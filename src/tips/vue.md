---
title: Vue
date: "2023-03-04"
description: Vue tips.
permalink: tips/{{ title | slug }}/index.html
icon: https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg
---

- 使用 `vueuse` 的 `useHover` 时，需要在元素中添加 `@click="() => void 0"`，否则在 ios 中不生效
- Debug 弹出组件 `setTimeout(function(){ debugger }, 5000)`
- Firefox favicon 必须使用 32x32 的图片，太大会不显示
