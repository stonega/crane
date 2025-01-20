---
title: Linux
description: Useful linux tips.
permalink: tips/{{ title | slug }}/index.html
icon: https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg
---

- Fedora update kmod-nvidia after kernel update
  ```bash
  sudo dnf remove 'kmod-nvidia-*'
  sudo akmods --force
  ```
