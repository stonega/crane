---
title: TypeScript
description: Flutter tips.
permalink: tips/{{ title | slug }}/index.html
icon: https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg
---

- Remove undefined type from union type.

```typescript
type Foo = NonNullable<FooOrUndefined>; // { bar: number; }
```
