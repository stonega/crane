#!/usr/bin/env python3
"""Retitle the kitty tab that owns an agent session (Codex / Claude Code hooks).

Why this is not a one-liner any more
------------------------------------
Current Codex versions serve sessions from a long-lived, shared app-server
daemon (feature ``daemon_auto_start``).  Hooks therefore no longer run inside
the tab that hosts the session: they run as children of the daemon and inherit
*its* environment.  That environment holds whatever kitty variables existed when
the daemon was first started - usually a dead KITTY_LISTEN_ON plus an unrelated
KITTY_WINDOW_ID.

Consequences of the old script (plain ``kitten @ set-tab-title``):

* the kitty socket in the inherited environment no longer exists, so the title
  was never applied ("hooks stopped working"), and
* whenever kitty did accept the command but the window id was unknown to it,
  kitty silently retitled the *active* tab, so one tab's status was driven by a
  thread running in another tab.

This script resolves the owning tab itself:

1. discover every live kitty instance (inherited KITTY_LISTEN_ON if it still
   exists, otherwise every kitty socket in /proc/net/unix and the usual runtime
   directories),
2. map the hook payload's session to one window: exact window id when the hook
   really did run inside the tab (client side hooks, ``codex exec``), otherwise
   by matching the session's thread name (``~/.codex/session_index.jsonl``,
   fallback ``~/.codex/state_*.sqlite``) against the title the Codex TUI
   publishes, then by working directory,
3. retitle exactly that tab with ``--match window_id:<id>``.

There is deliberately no fallback to the active tab: when the owner cannot be
identified the hook stays silent instead of retitling somebody else's tab.

Options - ~/.config/kitty/kitty-agent-title.conf (KEY=VALUE, because hooks
that run inside the daemon never see your shell environment):

    THREAD_NAME=1          prefix the tab title with the thread name
    REPO_ALIAS=shortname   override the repository part of the label
    QUIET=1                stop writing the one line per hook run
    DEBUG=1                add verbose resolution tracing
    LOG=/path/to.log       where to write (default /tmp/kitty-agent-title.log)

``--dry-run`` prints the resolution without retitling, ``--json`` prints it as
JSON - handy for checking the mapping by hand:

    echo '{"session_id":"...","cwd":"/path","hook_event_name":"Stop"}' |
        kitty-agent-title codex --dry-run --json
"""

from __future__ import annotations

import glob
import json
import os
import stat
import subprocess
import sys
import time

CONFIG_PATH = os.path.expanduser("~/.config/kitty/kitty-agent-title.conf")


def _load_config() -> dict:
    """Options are read from a file: daemon run hooks only see the daemon env."""
    values: dict = {}
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, value = line.partition("=")
                values[key.strip().upper()] = value.strip()
    except OSError:
        pass
    return values


CONFIG = _load_config()


def option(name: str, env_name: str, default: str = "") -> str:
    value = os.environ.get(env_name)
    if value:
        return value
    return CONFIG.get(name, default)


def truthy(value: str) -> bool:
    return value.strip().casefold() in ("1", "yes", "true", "on")


DEBUG = truthy(option("DEBUG", "KITTY_AGENT_TITLE_DEBUG"))
QUIET = truthy(option("QUIET", "KITTY_AGENT_TITLE_QUIET"))
LOG_PATH = option("LOG", "KITTY_AGENT_TITLE_LOG", "/tmp/kitty-agent-title.log")
LOG_MAX_BYTES = 262144
MAX_TITLE_LEN = 120
# Minimum score before we dare retitle a tab: 40 = exact cwd match, 100 = the
# session's thread name was found in the window title.
MIN_SCORE = 40

MARKS = {
    "SessionStart": "\U0001f4e2",       # 📢
    "SessionEnd": "\U0001f4e2",
    "UserPromptSubmit": "\u2692\ufe0f",  # ⚒️
    "PreToolUse": "\u2622\ufe0f",        # ☢️
    "PostToolUse": "\u2692\ufe0f",       # ⚒️
    "PermissionRequest": "\U0001f514",   # 🔔
    "Stop": "\u2705",                    # ✅
    "SubagentStop": "\u2705",
    "SubagentStart": "\U0001f465",       # 👥
    "PreCompact": "\U0001f9f6",          # 🧶
    "PostCompact": "\U0001f9f6",
    "Interrupt": "\u26d4",               # ⛔
}


def _append(message: str) -> None:
    try:
        if os.path.exists(LOG_PATH) and os.path.getsize(LOG_PATH) > LOG_MAX_BYTES:
            os.replace(LOG_PATH, LOG_PATH + ".1")
        with open(LOG_PATH, "a", encoding="utf-8") as handle:
            handle.write(f"{time.strftime('%m-%d %H:%M:%S')} {message}\n")
    except OSError:
        pass


def log_debug(message: str) -> None:
    """Verbose tracing (needs KITTY_AGENT_TITLE_DEBUG in the hook's own env)."""
    if DEBUG:
        _append(message)


def log_summary(message: str) -> None:
    """One compact line per hook run, so problems stay diagnosable."""
    if not QUIET:
        _append(message)


def run(args: list[str], timeout: float = 5.0) -> tuple[int, str, str]:
    try:
        proc = subprocess.run(
            args, capture_output=True, text=True, timeout=timeout, check=False
        )
        return proc.returncode, proc.stdout, proc.stderr
    except (OSError, subprocess.SubprocessError) as exc:
        return 1, "", str(exc)


def find_kitten() -> str | None:
    for name in ("kitten",):
        for directory in os.environ.get("PATH", "").split(os.pathsep):
            if not directory:
                continue
            candidate = os.path.join(directory, name)
            if os.access(candidate, os.X_OK):
                return candidate
    for candidate in (
        os.path.expanduser("~/.local/bin/kitten"),
        os.path.expanduser("~/.local/kitty.app/bin/kitten"),
        "/usr/bin/kitten",
        "/usr/local/bin/kitten",
    ):
        if os.access(candidate, os.X_OK):
            return candidate
    return None


KITTEN = find_kitten()


def is_socket(path: str) -> bool:
    try:
        return stat.S_ISSOCK(os.stat(path).st_mode)
    except OSError:
        return False


def candidate_instances() -> list[str]:
    """Addresses of kitty instances that could be running this session."""
    seen: list[str] = []

    def add(address: str | None) -> None:
        if not address:
            return
        if not address.startswith("unix:"):
            return
        path = address[len("unix:") :]
        if address in seen:
            return
        if path.startswith("@"):  # abstract socket, exists as long as kitty runs
            if address not in seen:
                seen.append(address)
            return
        if is_socket(path):
            seen.append(address)

    add(os.environ.get("KITTY_LISTEN_ON"))

    # Every unix socket that kitty currently listens on, regardless of the
    # (possibly stale) environment inherited from the daemon.
    try:
        with open("/proc/net/unix", "r", encoding="utf-8", errors="replace") as handle:
            for line in handle:
                fields = line.split()
                if not fields:
                    continue
                path = fields[-1]
                if path.startswith(("@", "/")) and "kitty" in os.path.basename(path):
                    add("unix:" + path)
    except OSError:
        pass

    runtime = os.environ.get("XDG_RUNTIME_DIR", f"/run/user/{os.getuid()}")
    patterns = [
        "/tmp/kitty",
        "/tmp/kitty-*",
        os.path.join(runtime, "kitty*"),
        os.path.expanduser("~/.kitty-*"),
    ]
    for pattern in patterns:
        for path in sorted(glob.glob(pattern)):
            add("unix:" + path)
    return seen


def instance_windows(kitten: str, address: str) -> list[dict]:
    code, out, err = run([kitten, "@", "--to", address, "ls"])
    if code != 0:
        log_debug(f"ls failed for {address}: {err.strip()[:200]}")
        return []
    try:
        tree = json.loads(out)
    except ValueError:
        return []
    windows: list[dict] = []
    for os_window in tree:
        for tab in os_window.get("tabs", []):
            for window in tab.get("windows", []):
                foreground = []
                for process in window.get("foreground_processes") or []:
                    cmdline = process.get("cmdline") or []
                    if cmdline:
                        foreground.append(os.path.basename(cmdline[0]))
                windows.append(
                    {
                        "address": address,
                        "os_window": os_window.get("id"),
                        "tab": tab.get("id"),
                        "window": window.get("id"),
                        "title": window.get("title") or "",
                        "tab_title": tab.get("title") or "",
                        "cwd": window.get("cwd") or "",
                        "foreground": foreground,
                        "tab_active": bool(tab.get("is_active")),
                        "focused": bool(window.get("is_focused")),
                        "last_focused_at": window.get("last_focused_at") or 0,
                    }
                )
    return windows


def instance_pid(address: str) -> str | None:
    """The kitty process id behind a unix:/...-<pid> socket, when it is known."""
    base = os.path.basename(address[len("unix:") :])
    for chunk in reversed(base.split("-")):
        if chunk.isdigit():
            return chunk
    return None


def thread_name(session_id: str) -> str:
    if not session_id:
        return ""
    home = os.environ.get("CODEX_HOME") or os.path.expanduser("~/.codex")
    index = os.path.join(home, "session_index.jsonl")
    try:
        with open(index, "r", encoding="utf-8", errors="replace") as handle:
            for line in reversed(handle.readlines()):
                if session_id not in line:
                    continue
                try:
                    record = json.loads(line)
                except ValueError:
                    continue
                if record.get("id") == session_id and record.get("thread_name"):
                    return str(record["thread_name"])
    except OSError:
        pass

    try:
        import sqlite3
    except ImportError:
        return ""
    for database in sorted(glob.glob(os.path.join(home, "state_*.sqlite")), reverse=True):
        try:
            connection = sqlite3.connect(f"file:{database}?mode=ro", uri=True)
            try:
                row = connection.execute(
                    "select name from threads where id = ?", (session_id,)
                ).fetchone()
            finally:
                connection.close()
        except sqlite3.Error:
            continue
        if row and row[0]:
            return str(row[0])
    return ""


def ancestor_cmdlines(limit: int = 8):
    """(pid, cmdline) for our process and its ancestors, nearest first."""
    pid = os.getpid()
    result = []
    for _ in range(limit):
        try:
            with open(f"/proc/{pid}/cmdline", "rb") as handle:
                cmdline = (
                    handle.read().decode("utf-8", "replace").replace("\x00", " ").strip()
                )
        except OSError:
            break
        try:
            stat = open(f"/proc/{pid}/stat", "rb").read().decode("utf-8", "replace")
        except OSError:
            break
        close = stat.rfind(")")
        fields = stat[close + 2 :].split()
        if len(fields) < 2:
            break
        parent = int(fields[1])
        result.append((pid, cmdline))
        if parent <= 1:
            break
        pid = parent
    return result


def env_describes_this_tab() -> bool:
    """False when the hook runs inside the shared app-server daemon.

    The daemon is long lived, so the kitty variables it passes on describe
    whatever terminal happened to start it, not the tab that owns the session.
    """
    for _pid, cmdline in ancestor_cmdlines():
        lowered = cmdline.casefold()
        if "app-server" in lowered and ("codex" in lowered or "managed-daemon" in lowered):
            return False
    return True



def norm(text: str) -> str:
    return " ".join(text.split()).casefold()


def pick_window(windows: list[dict], payload: dict, name: str) -> tuple[dict | None, str]:
    session_cwd = payload.get("cwd") or ""
    env_window_id = os.environ.get("KITTY_WINDOW_ID")
    env_trusted = bool(env_window_id) and env_describes_this_tab()

    # Hook ran inside the tab (client side hooks, `codex exec`, foreground
    # sessions): the inherited window id is the tab that owns the session, but
    # only when it also names the instance it came from - window ids are reused
    # across kitty instances.
    if env_trusted:
        env_address = os.environ.get("KITTY_LISTEN_ON")
        env_kitty_pid = os.environ.get("KITTY_PID")
        for window in windows:
            if str(window["window"]) != str(env_window_id):
                continue
            same_instance = bool(
                (env_address and window["address"] == env_address)
                or (env_kitty_pid and instance_pid(window["address"]) == env_kitty_pid)
            )
            if same_instance:
                return window, "hook ran inside the tab (KITTY_WINDOW_ID)"

    scored: list[tuple[int, dict, list[str]]] = []
    target_name = norm(name)
    for window in windows:
        score = 0
        reasons: list[str] = []
        title = norm(window["title"])
        if target_name and target_name in title:
            score += 100
            reasons.append("thread-name")
        if session_cwd:
            window_cwd = window["cwd"].rstrip("/")
            session_dir = session_cwd.rstrip("/")
            if window_cwd and window_cwd == session_dir:
                score += 40
                reasons.append("cwd")
            elif window_cwd and session_dir.startswith(window_cwd + "/"):
                score += 15
                reasons.append("cwd-parent")
            elif window_cwd and window_cwd.startswith(session_dir + "/"):
                score += 5
                reasons.append("cwd-child")
        if any("codex" in process or "claude" in process for process in window["foreground"]):
            score += 3
            reasons.append("agent-process")
        if score > 0:
            scored.append((score, window, reasons))

    if not scored:
        return None, "no candidate window"

    scored.sort(key=lambda item: (item[0], item[1]["last_focused_at"]), reverse=True)
    best_score, best, best_reasons = scored[0]
    if best_score < MIN_SCORE:
        return None, f"best candidate only scored {best_score} ({','.join(best_reasons)})"

    tied = [item for item in scored if item[0] == best_score]
    if len(tied) > 1:
        described = ", ".join(
            f"win={item[1]['window']} title={item[1]['title']!r}" for item in tied
        )
        # Only a thread-name match may be resolved by focus: several tabs in the
        # same repository are indistinguishable otherwise, and guessing is what
        # used to retitle the wrong tab.
        if not all("thread-name" in item[2] for item in tied):
            return None, f"ambiguous candidates ({described})"
        log_debug(f"ambiguous by name, using most recently focused: {described}")
    return best, f"score={best_score} ({','.join(best_reasons)})"


def short_branch(branch: str) -> str:
    for prefix in ("worktree-", "feature/", "fix/", "bugfix/", "chore/"):
        if branch.startswith(prefix):
            branch = branch[len(prefix) :]
    if branch in ("", "main", "master", "trunk"):
        return ""
    if branch[:3].lower() == "pr-" and branch[3:4].isdigit():
        digits = ""
        for char in branch[3:]:
            if char.isdigit():
                digits += char
            else:
                break
        return f"{branch[:3]}{digits}"
    head, _, tail = branch.partition("-")
    if tail and tail[:1].isdigit() and 2 <= len(head) <= 4 and head.isalpha():
        digits = ""
        for char in tail:
            if char.isdigit():
                digits += char
            else:
                break
        return f"{head}-{digits}"
    if "-" in branch:
        return branch.split("-", 1)[0]
    return branch


def label_for(agent: str, cwd: str, name: str) -> str:
    code, out, _ = run(["git", "-C", cwd, "rev-parse", "--show-toplevel"])
    git_root = out.strip() if code == 0 else ""
    code, out, _ = run(
        ["git", "-C", cwd, "rev-parse", "--path-format=absolute", "--git-common-dir"]
    )
    common_dir = out.strip() if code == 0 else ""
    code, out, _ = run(["git", "-C", cwd, "branch", "--show-current"])
    branch = out.strip() if code == 0 else ""

    if git_root:
        repo = os.path.basename(os.path.dirname(common_dir)) if common_dir else os.path.basename(git_root)
    else:
        repo = os.path.basename(cwd.rstrip("/")) or cwd
    repo = option("REPO_ALIAS", "KITTY_TITLE_REPO_ALIAS") or repo

    label = f"C {repo}" if agent == "claude" else repo
    if agent not in ("claude", "codex"):
        label = f"{agent} {repo}"
    branch = short_branch(branch)
    if branch:
        label = f"{label}/{branch}"
    if truthy(option("THREAD_NAME", "KITTY_TITLE_THREAD_NAME")) and name:
        label = f"{name} | {label}"
    return label


def sanitize(text: str) -> str:
    cleaned = "".join(char for char in text if char.isprintable())
    cleaned = " ".join(cleaned.split())
    if len(cleaned) > MAX_TITLE_LEN:
        cleaned = cleaned[: MAX_TITLE_LEN - 1] + "\u2026"
    return cleaned


def osc_fallback(title: str) -> None:
    """Last resort for terminals without kitty remote control."""
    if os.environ.get("KITTY_WINDOW_ID") or os.environ.get("KITTY_LISTEN_ON"):
        return  # we are inside kitty but could not resolve the owner: stay quiet
    try:
        with open("/dev/tty", "w", encoding="utf-8") as tty:
            tty.write(f"\x1b]2;{title}\x07")
            tty.flush()
    except OSError:
        pass


def main() -> int:
    argv = [arg for arg in sys.argv[1:] if not arg.startswith("--")]
    dry_run = "--dry-run" in sys.argv
    as_json = "--json" in sys.argv
    agent = argv[0] if argv else "agent"

    raw = ""
    if not sys.stdin.isatty():
        raw = sys.stdin.read()
    payload: dict = {}
    if raw.strip():
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, dict):
                payload = parsed
        except ValueError:
            payload = {}

    event = str(payload.get("hook_event_name") or "")
    cwd = str(payload.get("cwd") or "")
    if not cwd or not os.path.isdir(cwd):
        cwd = os.getcwd()
    session_id = str(payload.get("session_id") or "")
    name = thread_name(session_id)

    label = label_for(agent, cwd, name)
    mark = MARKS.get(event, "")
    title = sanitize(f"{label} {mark}".strip() or label)

    windows: list[dict] = []
    if KITTEN:
        for address in candidate_instances():
            windows.extend(instance_windows(KITTEN, address))
    log_debug(f"session={session_id} name={name!r} cwd={cwd} windows={len(windows)}")

    target: dict | None = None
    reason = "no kitty instance found"
    if windows:
        target, reason = pick_window(windows, payload, name)

    if target is None:
        log_summary(
            f"event={event} win=- name={name!r} cwd={cwd} skipped: {reason}"
        )
        if as_json:
            print(json.dumps({"target": None, "reason": reason, "title": title}, indent=1))
        if not dry_run and not windows:
            osc_fallback(title)
        return 0

    log_summary(
        f"event={event} win={target['window']} tab={target['tab']} "
        f"name={name!r} reason={reason} title={title!r}"
    )
    if as_json:
        print(
            json.dumps(
                {
                    "target": {
                        "address": target["address"],
                        "os_window": target["os_window"],
                        "tab": target["tab"],
                        "window": target["window"],
                        "window_title": target["title"],
                    },
                    "reason": reason,
                    "title": title,
                },
                indent=1,
            )
        )
    if dry_run:
        return 0

    code, _, err = run(
        [
            KITTEN,
            "@",
            "--to",
            target["address"],
            "set-tab-title",
            "--match",
            f"window_id:{target['window']}",
            title,
        ]
    )
    if code != 0:
        log_summary(f"event={event} win={target['window']} FAILED: {err.strip()[:200]}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # hooks must never break the agent
        log_summary(f"crashed: {exc!r}")
        raise SystemExit(0)
