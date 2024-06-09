---
title: CSS
description: Fun css tips.
permalink: tips/{{ title | slug }}/index.html
icon: https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg
---

- You can create icon sprite animations using the steps() animation-timing function

  ```css
  button img {
    object-fit: cover;
    object-position: 0 0;
  }
  [aria-pressed="true"] img {
    animation: play 0.5s steps(20) forwards;
  }
  @keyframes play {
    to {
      object-position: 100% 0;
    }
  }
  ```

- Line clump
  ```css
  .line-clamp {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  ```
