# 站点配置

[返回 README](../README.md)

`site.config.ts` 定义公开模板的默认值，`site.profile.json` 保存派生博客的覆盖值。组件只读取合并后的配置，修改作者或名称无需改动页面代码。

首页正文独立保存在 `content/index.md`，用 Markdown 自定义标题、介绍、图片、列表和链接。

公开模板的 `site.profile.json` 为 `{}`。在自己的私有仓库中编辑并提交它；可以参考 [完整示例](../site.profile.example.json)，只填写需要覆盖的字段。不要把它加入 `.gitignore`，否则远程构建无法得到个人配置。

## 字段

| 字段 | 类型 | 默认值 / 用途 |
| --- | --- | --- |
| `name` | string | `Thus.Live`；导航和 RSS 名称，首页正文标题由 Markdown 决定 |
| `author` | string | `Thus.Live`；列表、正文、搜索结果和 RSS 的统一作者 |
| `title` | string | `Thus.Live · 记录与分享`；默认首页浏览器标题，可由首页 frontmatter 覆盖 |
| `description` | string | `记录当下，持续思考。`；默认 SEO 与 RSS 描述，首页正文由 Markdown 决定 |
| `language` | string | `zh-CN`；HTML 与 RSS 语言，不会自动翻译界面 |
| `url` | string | 空；正式站点根地址，例如 `https://blog.example.com` |
| `avatar` | string | 空；本地资源路径或图片 URL |
| `avatarText` | string | 空；头像占位文字，空时取 `name` 首字符 |
| `copyright` | string | `[Thus.Live](/)`；网站版权信息，显示在页脚左侧，支持 `[文字](链接)`，空字符串隐藏内容 |
| `footer` | string | `记录与分享`；页脚右侧短句 |
| `pageSize` | 正整数 | `10`；博文列表每页数量 |

配置采用字段覆盖。`name`、`author`、`title`、`language` 不可为空白，拼错字段名或填错类型会中止构建并报错。JSON 不支持注释和末尾逗号。

当前是单作者博客，Markdown frontmatter 中的 `author` 不参与展示。修改 `author` 会同步更新所有文章列表、正文、搜索结果和 RSS。

## 网站版权信息

网站版权信息显示在页脚左侧，通过 `site.profile.json` 的 `copyright` 单独编辑，不跟随 `name` 变化。例如 `"copyright": "© 我的博客 · [GitHub](https://github.com/uMisty)"`。支持普通文字和多个 Markdown 链接，站内链接可写为 `[首页](/)`；原始 HTML 不会执行。右侧仍使用 `footer`。修改配置后重新构建并部署。

链接采用与正文一致的判断规则：带协议的地址（如 `https://`）或以 `//` 开头的地址在新标签页打开，自动添加 `rel="noopener noreferrer"`；站内路径、相对路径和 `#锚点` 在当前标签页跳转。例如：

```json
{
  "copyright": "© 我的博客 · [首页](/) · [GitHub](https://github.com/uMisty)"
}
```

无需添加 `{}` 属性后缀；旧配置中的 `{target='_blank'}` 或 `{target="_blank"}` 应删除，否则会作为普通文字显示。使用站内路径（如 `/about`）表示内部链接，完整 URL 按外部链接处理。

## 首页内容

编辑 `content/index.md`，保留 `layout: home`，正文直接使用 Markdown：

```markdown
---
layout: home
title: 欢迎来到我的博客
description: 我的笔记、阅读和生活记录。
---

<Avatar />

# 你好，我是小记

这里记录我的 **技术笔记** 和日常想法。

- 正在学习 Vue
- 喜欢阅读与摄影

[浏览博文 →](/blog)
```

`#` 一级标题控制页面正文标题；frontmatter 的 `title` 控制浏览器标题，省略时使用 profile 的 `title`。`description` 可覆盖首页 SEO 描述，省略时使用站点默认值。默认不追加站点名；需要时可另设 frontmatter 的 `titleTemplate`。

正文支持与文章相同的 Markdown 扩展，可以添加段落、图片、链接、表格和代码块。示例中的 `<Avatar />` 使用站点头像配置，可删除或换成 `![图片说明](/自己的图片.webp)`；「浏览博文」也只是普通 Markdown 链接，可以修改或移除。

旧版本的 `role`、`introduction` 已移除。升级时将对应文字迁入首页正文，并从 profile 中删除这两个字段。修改首页 Markdown 可热更新；部署前重新构建即可。

## 头像

把图片放在 `content/public/avatar.webp`，设置 `"avatar": "/avatar.webp"`。建议正方形图片，显示时裁为圆形。留空或图片加载失败时显示文字占位，不需要额外头像服务。

站点默认部署在域名根路径。资源引用不包含 `content/public`，例如 `/avatar.webp`。

## 域名与元数据

构建时按以下优先级决定正式地址：

1. 进程环境变量 `SITE_URL`。
2. `site.profile.json` 的 `url`。
3. Vercel 提供的 `VERCEL_PROJECT_PRODUCTION_URL`。

只接受 HTTP(S) 的根地址，不接受用户名、密码、查询参数、锚点或子目录。末尾 `/` 可以省略。没有配置时仍然正常生成网页与 `robots.txt`，但不生成 canonical、RSS 与 sitemap。

`/rss` 提供全部博文与按标签的订阅地址，导航栏提供 RSS 图标入口。未配置正式域名时，订阅页显示未启用状态；配置后自动启用，无需额外开关。详见 [RSS 订阅说明](RSS.md)。

`SITE_URL` 是构建参数，构建后再修改 Nginx 或容器的运行时环境变量不会改变生成的 HTML。项目没有配置自动读取本地 `.env`；请使用 shell 环境变量、托管平台环境设置，或 `site.profile.json`。参见 [部署说明](DEPLOYMENT.md)。

网页会展示或包含这些配置，不要放 Token、密码或不想公开的个人信息。源代码仓库设为私有并不改变已部署静态网页的可见性。

## 主题与交互

- `src/styles/theme.css`：明暗主题的语义颜色变量、页面布局和组件样式。
- `src/styles/markdown.css`：正文排版、代码、表格与公式。
- `src/styles/motion.css`：路由过渡、入场、悬停和搜索动画。
- `.vitepress/config.ts`：Shiki 明暗代码主题、Markdown 扩展、SEO 和输出配置。

优先调整语义颜色变量，让导航、正文、边框和标签一起保持一致。代码高亮的亮色 / 暗色方案需要成对配置。系统选择减少动态效果时，界面停用相关动画。

## 私有博客的维护边界

| 文件 | 通常由谁维护 |
| --- | --- |
| `src/`、`.vitepress/`、`scripts/`、依赖 | 跟随公共模板，按需覆盖 |
| `site.config.ts` | 公共模板默认值与校验 |
| `site.profile.json` | 私有博客自己的配置 |
| `content/index.md`、`content/posts/`、`content/public/` | 私有博客自己的首页、文章和资源 |
| `tests/e2e/` | 以两篇写作指南为数据的回归测试；替换文章后相应调整 |

公开模板应尽量保持 `site.profile.json` 为空，减少上游更新与个人配置的冲突。文章也在同一仓库内，因此上游改动写作指南时仍可能产生冲突；合并时需要检查。详见 [GitHub 私有源码仓库与上游更新](PRIVATE-BLOG.md)。
