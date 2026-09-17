# Thus.Live

A minimal **Vue 3 + VitePress + TypeScript static blog template**. Write Markdown, organize posts in date-based folders, and deploy the generated HTML to Vercel or Nginx. No backend or database is required.

[中文完整说明](README.md) · [Configuration](docs/CONFIGURATION.md) · [Deployment](docs/DEPLOYMENT.md) · [License](LICENSE)

**Built through human–AI collaboration:** people defined requirements, chose the design, and reviewed the result; AI tools (ChatGPT / Codex) assisted with design, implementation, tests, and documentation. This provenance note adds no attribution or licensing requirements.

Thus.Live is a brand name, with `thus-live` as the package name. It does not imply ownership of a domain. Included posts are limited to a [Markdown guide](content/posts/2026/09/16/markdown-guide.md) and a [blog writing and publishing guide](content/posts/2026/09/17/blog-writing-guide.md), both in Chinese. Keep them as references or replace them with your own content.

## Features

- Markdown-customizable home page, post lists, multiple tags, date archives, and full-text search.
- Consistent date, author, and reading time in lists and articles.
- Responsive light / dark themes, subtle motion, and reduced-motion support.
- Shiki syntax highlighting, line numbers, copy buttons, diffs, focus, and code groups.
- Tables, task lists, footnotes, definitions, math, Mermaid, Emoji, and Vue components.
- Prerendered HTML, draft exclusion, and optional canonical URLs, RSS, and sitemap.
- RSS subscription page with copyable addresses, per-tag feeds, and a header link.

## Quick start

Use Node.js 22.12 or newer; Node.js 24 is recommended.

```bash
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. For a production preview:

```bash
npm run build
npm run preview
```

The output is `dist/`; preview runs at `http://127.0.0.1:4173`. Restart preview after rebuilding to refresh its asset list.

## Personalize

Edit `site.profile.json` for site settings and `content/index.md` for home page content. The public template keeps the profile as `{}`; your private repository should commit its own values. Missing settings inherit defaults from `site.config.ts`.

```json
{
  "name": "My Notes",
  "author": "Your name",
  "title": "My Notes · Writing and learning",
  "description": "Notes on things I learn.",
  "footer": "Keep learning",
  "avatar": "",
  "avatarText": "N",
  "url": "",
  "pageSize": 10
}
```

See [site.profile.example.json](site.profile.example.json) and the [configuration reference](docs/CONFIGURATION.md). `author` is shared across all posts; it is not read from individual frontmatter. Put an optional avatar at `content/public/avatar.webp` and set `avatar` to `/avatar.webp`. Empty or failed images show a text placeholder.

The UI is currently Chinese. `language` sets document/feed metadata; it does not translate the interface. Site settings become public website content and must not contain secrets.

## Customize the home page

Write headings, paragraphs, images, lists, and links directly in `content/index.md`, keeping `layout: home` in its frontmatter. The page uses the same Markdown extensions as posts. The optional `<Avatar />` component reads the profile's avatar settings; remove it or replace it with a Markdown image as desired.

Home page content no longer uses `role` or `introduction` from the profile. When upgrading, move those values into the Markdown body and remove the old fields. The profile's `name` still controls site branding. Its `title` and `description` provide default metadata, which the home page can override in frontmatter. Markdown edits update live during development.

## Write a post

```bash
npm run new:post -- my-first-post --title "My first post" --date 2026-09-17
```

The command creates a draft at `content/posts/2026/09/17/my-first-post.md`. The date defaults to today in Asia/Shanghai if omitted. `content/posts/2026/09/17/my-first-post/index.md` is also supported.

```markdown
---
title: My first post
description: A short summary.
tags: [Vue, TypeScript]
draft: false
---

## Hello

Write with **Markdown**, code, and 🚀 Emoji.
```

The folder determines the publication date; an optional `date` field must match it. `updated` can specify a later date. Multiple tags are supported. Drafts do not generate article pages or enter search, archives, tags, RSS, or sitemap. Restart the development server after adding, moving, deleting, or changing draft status of posts.

Keep images beside posts and use relative Markdown links, or place public files in `content/public/`. Draft flags are not an asset privacy boundary. Markdown is trusted source code and can contain HTML and Vue.

Explore the [Markdown example](content/posts/2026/09/16/markdown-guide.md). Native Emoji and shortcodes such as `:rocket:` work; a general-purpose icon library is not installed.

## RSS subscriptions

Open `/rss` from the header to copy a feed address into your RSS reader. Configure the production origin using profile `url` or build-time `SITE_URL` to enable `/feed.xml` and `/feeds/tags/<tag-slug>.xml`. Feeds include published post summaries, authors, dates, categories, and original links; drafts are excluded. Without an origin, the page shows an unavailable state. See the [RSS guide](docs/RSS.md).

## Deploy

- **Vercel:** import your repository, select Other and Node.js 24. `vercel.json` sets `npm ci`, `npm run build`, and output directory `dist`.
- **Nginx:** publish the contents of `dist/` using [deploy/nginx.conf](deploy/nginx.conf). Real HTML pages need no SPA fallback.
- **Docker:** `docker build --build-arg SITE_URL=https://blog.example.com -t thus-live .`, then `docker run --rm -p 8080:80 thus-live`.

Replace the example domain. The production origin is selected at build time: `SITE_URL` environment variable → profile `url` → `VERCEL_PROJECT_PRODUCTION_URL`. Without one, the site still builds, but canonical URLs, RSS, and sitemap are omitted. Hosting at a domain root is supported by default. See [deployment details](docs/DEPLOYMENT.md).

## Validate

```bash
npm run typecheck
npm test
npm run build
npm run check:output
npm run test:e2e
```

Browser tests use installed Chrome by default. Alternatively install Playwright Chromium and set `PLAYWRIGHT_BROWSER=chromium`. End-to-end tests use the two included writing guides; adjust their fixtures after replacing them. Build and output checks remain useful for your own posts.

Theme tokens live in `src/styles/theme.css`; article styles in `markdown.css`; animations in `motion.css`. Build output, reports, screenshots, archives, and local environment files are Git-ignored. The package's `private: true` prevents npm publication and has no effect on GitHub visibility.

## License

Original code, documentation, and demo content use **[BSD Zero Clause (0BSD)](LICENSE)**, permitting commercial use, modification, and redistribution without attribution or notice-retention requirements. Software is provided as-is. See the [standard text](https://spdx.org/licenses/0BSD.html).

Third-party dependencies retain their own licenses. You may apply a separate content license to new posts you write. The AI collaboration disclosure adds no extra conditions.
