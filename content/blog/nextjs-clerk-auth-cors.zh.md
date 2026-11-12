---
title: 解决 Clerk 与 Next.js 项目中的 CORS 问题
date: "2023-10-06"
tags: [clerk, nextjs]
description: 通过配置 API 响应和中间件，处理 Clerk 与 Next.js 项目中的跨域请求。
permalink: posts/how-to-fix-cors-issue-in-clerk-nextjs-project/zh/index.html
lang: zh-CN
isTranslation: true
---

如果你正在使用 Next.js 构建 Web 应用，并使用 Clerk 进行身份验证，在从应用外部发起 API 请求时，可能会遇到 CORS（跨源资源共享）问题。当浏览器阻止向不同源发起的请求时，就会出现这种情况。

下面记录在 Clerk 与 Next.js 项目中处理 CORS 问题的步骤。

## 第一步：为 API 端点添加 CORS 响应头

```typescript
export async function GET(request: Request) {
  return new Response("Hello, Next.js!", {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
```

## 第二步：更新中间件

在中间件中，首先检查请求是否为 `OPTIONS` 请求。这是浏览器发送的预检请求，用来判断是否允许跨源访问。如果是 `OPTIONS` 请求，就直接返回包含跨域响应头的响应；否则，调用 Clerk 的 `authMiddleware` 函数。

```typescript
import { authMiddleware } from "@clerk/nextjs";
import { NextFetchEvent, NextRequest } from "next/server";

export function middleware(request: NextRequest, event: NextFetchEvent) {
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("origin");
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization,  Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version",
        "Access-Control-Max-Age": "86400"
      }
    });
  }
  const auth = authMiddleware({});
  return auth(request, event);
}
```

## 总结

这篇教程介绍了如何在 Clerk 与 Next.js 项目中处理 CORS 问题：修改 API 端点以允许跨域请求，并在中间件的响应中添加浏览器访问资源所需的响应头。

完成这些修改后，就可以从不同的源向 Clerk 与 Next.js 项目发起 API 请求。
