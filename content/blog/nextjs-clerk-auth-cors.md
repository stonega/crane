---
title: How to fix cors issue in clerk nextjs project
date: "2023-10-06"
tags: [clerk, nextjs]
description: .
permalink: posts/{{ title | slug }}/index.html
---

If you're building a web application with Next.js and using the Clerk authentication service, you may encounter a CORS (Cross-Origin Resource Sharing) issue when making API requests outside the app. This issue occurs when the browser blocks requests to a different domain than the one the app is hosted on.

With the follow steps, we'll walk through how to fix the CORS issue in a Clerk Next.js project.

## Step 1. Add CORS Headers to the API Endpoint

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

## Step 2. Update middleware

In this middleware, we first checks if the incoming request is an OPTIONS request, which is a preflight request that is sent by the browser to check if a cross-origin request is allowed. If it is an OPTIONS request, the middleware returns a response with headers that allow cross-origin requests. If it's not an OPTIONS request, the middleware calls the authMiddleware function from the Clerk Next.js library.

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

## Conclusion

In this tutorial, we walked through how to fix the CORS issue in a Clerk Next.js project. We modified the API endpoint to allow cross-origin requests, and added some headers to the response to allow the browser to access the resource.

With these changes, you can now make API requests from a different domain in your Clerk Next.js project without encountering a CORS issue.
