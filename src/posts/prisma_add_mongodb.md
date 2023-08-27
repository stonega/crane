---
title: How to set up a Prisma Client That Uses MongoDB as a Second Database
date: "2023-08-27"
tags: [prisma, nextjs]
description: .
permalink: posts/{{ title | slug }}/index.html
---

最近在 Recos 项目中将字幕文件的存储转移到了 Mongo 数据库，前端项目采用的是 Nextjs + Prisma 的框架，于是需要 Prisma 添加 Mongo 的支持，其中还是遇到了一些小坑，在此记录下。

Prisma 本身是不支持连接到多个数据库的，实现方法是在 `prisma` 目录中新建一个文件名为 `mongo_schema.prisma`

```
generator client {
  provider = "prisma-client-js"
  output   = "./generated/mongo_client"
}

datasource db {
  provider = "mongodb"
  url      = env("MONGO_URL")
}

model subtitle {
  id_            String @id @default(auto()) @map("_id") @db.ObjectId
  ...
}

```
主要是在 client 里面添加 output 字段，首先在项目 .`env` 文件中添加 `MONGO_URL`,然后执行 `prisma generate --schema=prisma/mongo_schema.prisma` ，就会在 `prisma` 目录下生成 prisma client 的代码。

通过以下方法引入后就可以使用了。

```
import { PrismaClient as PrismaMongoClient } from "../prisma/generated/mongo_client";

```

值得注意的是，如果你连接到 Mongo 数据库报以下错误时

`import { PrismaClient as PrismaMongoClient } from "../prisma/generated/mongo_client";`

可以尝试在环境变量文件 `MONGO_URL` 后添加 `?authSource=admin`