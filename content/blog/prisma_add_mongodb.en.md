---
title: How to Set Up a Prisma Client That Uses MongoDB as a Second Database
date: "2023-08-27"
tags: [prisma, nextjs]
description: Adding a separate Prisma client for MongoDB alongside an existing database.
permalink: posts/how-to-set-up-a-prisma-client-that-uses-mongodb-as-a-second-database/en/index.html
lang: en
isTranslation: true
---

I recently moved subtitle file storage in the Recos project to MongoDB. The frontend uses Next.js and Prisma, so I needed to add MongoDB support to the Prisma setup. I ran into a few small issues and wanted to record the solution here.

A Prisma schema does not connect to multiple databases at once. The approach is to create a separate file named `mongo_schema.prisma` in the `prisma` directory.

```prisma
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

The important part is the `output` field in the client generator. First add `MONGO_URL` to the project's `.env` file, then run `prisma generate --schema=prisma/mongo_schema.prisma`. This generates the client code inside the `prisma` directory.

Import it as follows, and it is ready to use:

```prisma
import { PrismaClient as PrismaMongoClient } from "../prisma/generated/mongo_client";

```

One thing to keep in mind when connecting to MongoDB is the connection string's authentication database. The import used for this client is:

```prisma
import { PrismaClient as PrismaMongoClient } from "../prisma/generated/mongo_client";
```

If the connection fails, try appending `?authSource=admin` to `MONGO_URL` in the environment file.
