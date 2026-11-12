# Crane

## Personal site

Building rocket with the crane.

## Blog translations

Each article in `content/blog` has a language counterpart beside it. For example,
`my_2024_review.md` and `my_2024_review.en.md` are paired automatically by filename.
The original post keeps its existing URL and remains the entry shown in blog
lists, tag pages, and the Atom feed.

For an English translation, copy the original post's date and tags, translate its
title, description, and body, and set these front matter fields:

```yaml
lang: en
isTranslation: true
permalink: posts/my-post/en/index.html
```

Original posts default to `lang: zh-CN`. If the original is English, set its
`lang: en` explicitly and add a `.zh.md` counterpart with `lang: zh-CN` and
`isTranslation: true`. Use a unique permalink for each version. Keeping the files
in the same directory lets both versions reuse relative image paths.

The post layout shows a 中文 / English switch, and previous/next links stay in
the current language. Each page also declares its language and alternate URLs.

## Solutions used

- [11ty](https://www.11ty.dev/)
- [Dev Icons](https://devicon.dev/)
- [Giscus](https://github.com/giscus)

## Curl card
```sh
curl https://stonegate.me/sh
```

## Home gallery

Configure the homepage photo gallery with Cloudflare-hosted images:

```sh
CLOUDFLARE_IMAGE_BUCKET_URL=https://pub-68d4e56b495346c097026e9087c01342.r2.dev
CLOUDFLARE_IMAGE_BUCKET_PREFIX=
CLOUDFLARE_IMAGE_BUCKET_IMAGES=photo-1.jpg,photo-2.jpg,photo-3.jpg
```

Build-time R2 sync:

```sh
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_BUCKET_NAME=your-r2-bucket-name
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key
```

These can live in `.env.local`, which is ignored by git.

Then run:

```sh
pnpm run sync:gallery
pnpm build
```

The sync script lists objects from the configured prefix, filters image files, and writes the gallery cache to `.cache/home-gallery.json`. Leave `CLOUDFLARE_IMAGE_BUCKET_PREFIX` empty when the files live at the bucket root.

Optional manifest support:

```sh
CLOUDFLARE_IMAGE_BUCKET_MANIFEST_URL=https://pub-68d4e56b495346c097026e9087c01342.r2.dev/gallery.json
```

The manifest can be either an array of strings or an array/object with `photos` or `images`.
