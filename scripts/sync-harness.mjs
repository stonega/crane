import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outputPath = path.join(rootDir, "_data", "harness.json");
const repo = "stonega/harness";
const ref = "main";
const baseApiUrl = `https://api.github.com/repos/${repo}/contents`;
const repoUrl = `https://github.com/${repo}`;

async function fetchJson(url) {
	const response = await fetch(url, {
		headers: {
			"Accept": "application/vnd.github+json",
			"User-Agent": "crane-harness-sync"
		}
	});

	if (!response.ok) {
		throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
	}

	return response.json();
}

function toEntry(item) {
	return {
		name: item.name,
		path: item.path,
		url: item.html_url,
		type: item.type
	};
}

async function readExistingData() {
	try {
		const existing = await readFile(outputPath, "utf8");
		return JSON.parse(existing);
	} catch {
		return null;
	}
}

async function syncHarness() {
	const repoMeta = await fetchJson(`https://api.github.com/repos/${repo}`);
	const [prompts, skills] = await Promise.all([
		fetchJson(`${baseApiUrl}/prompts?ref=${ref}`),
		fetchJson(`${baseApiUrl}/skills?ref=${ref}`)
	]);

	const data = {
		repo: {
			name: repoMeta.full_name,
			url: repoUrl,
			branch: ref,
			pushedAt: repoMeta.pushed_at,
			updatedAt: repoMeta.updated_at
		},
		syncedAt: new Date().toISOString(),
		prompts: prompts
			.filter((item) => item.type === "file")
			.map(toEntry)
			.sort((a, b) => a.name.localeCompare(b.name)),
		skills: skills
			.filter((item) => item.type === "dir")
			.map(toEntry)
			.sort((a, b) => a.name.localeCompare(b.name))
	};

	await mkdir(path.dirname(outputPath), { recursive: true });
	await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`);
}

try {
	await syncHarness();
	console.log(`Synced Harness data to ${path.relative(rootDir, outputPath)}`);
} catch (error) {
	const existingData = await readExistingData();

	if (existingData) {
		console.warn(`Harness sync failed, using existing data: ${error.message}`);
		process.exit(0);
	}

	console.error(`Harness sync failed and no cached data is available: ${error.message}`);
	process.exit(1);
}
