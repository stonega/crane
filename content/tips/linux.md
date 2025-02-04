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
- Fedora add repo from url
```bash
sudo dnf config-manager addrepo --from-repofile=https://brave-browser-rpm-release.s3.brave.com/brave-browser.repo
```
