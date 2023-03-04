---
title: Vue
date: "2023-03-04"
description: Vue tips.
permalink: tips/{{ title | slug }}/index.html
icon: https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg
---

- 使用 `vueuse` 的 `useHover` 时，需要在元素中添加 `@click="() => void 0"`，否则在 ios 中不生效。 #flutter
