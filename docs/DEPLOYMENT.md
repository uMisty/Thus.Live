# 部署 Thus.Live

[返回 README](../README.md)

构建产物在 `dist/`，全部是静态文件。每篇发布的 Markdown 都有独立 HTML，直接打开深层链接无需后端。当前配置面向**域名根路径**，例如 `https://blog.example.com/`；子路径部署需要同时调整 VitePress base、资源路径与 SEO URL 生成，不在默认配置范围内。

## 本地构建与检查

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run check:output
npm run preview
```

访问 `http://127.0.0.1:4173`。重新构建后重启 preview；开发时使用支持热更新的 `npm run dev`。

正式域名可写入 `site.profile.json` 的 `url`，也可通过构建环境变量覆盖。

PowerShell：

```powershell
$env:SITE_URL = 'https://blog.example.com'
npm run build
Remove-Item Env:SITE_URL
```

Bash / Zsh：

```bash
SITE_URL=https://blog.example.com npm run build
```

请替换示例域名。优先级为 `SITE_URL` → profile 的 `url` → Vercel 的正式项目地址。没有域名时不生成 RSS、sitemap 和 canonical；`robots.txt` 仍然生成。配置文件不会自动读取 `.env`。

## Vercel

1. 在 Vercel 导入你的仓库，包括自己的独立私有仓库，并按平台流程授予读取权限。
2. Framework Preset 选 **Other**，Root Directory 使用包含 `package.json` 的目录。
3. 项目自带 [vercel.json](../vercel.json)，安装为 `npm ci`、构建为 `npm run build`、输出目录为 `dist`；Node.js 选 24。
4. 用 `site.profile.json` 的 `url` 或项目环境变量 `SITE_URL` 设置正式域名。
5. 部署后检查首页、`/blog`、文章深层链接、`/feed.xml` 和 `/sitemap.xml`。

当显式 URL 留空时，构建可使用 Vercel 提供的 `VERCEL_PROJECT_PRODUCTION_URL`。如果希望预览部署也使用正式 canonical，保持正式 URL 配置即可；域名变更后需要重新构建。

Vercel 的 Git 仓库访问与部署可见性分别设置。源仓库为私有不表示网站自动要求登录。

## Nginx

1. 本地或构建服务器运行 `npm ci && npm run build`。
2. 将 `dist/` **里面的内容**复制到服务器静态目录。
3. 参考 [deploy/nginx.conf](../deploy/nginx.conf)，按服务器实际情况设置 `root` 和 `server_name`，并配置 HTTPS。
4. 验证 Nginx 配置后重新加载。

核心路由规则：

```nginx
location / {
    try_files $uri $uri.html $uri/ =404;
    add_header Cache-Control "no-cache";
}
```

`/posts/2026/09/17/example` 可以映射到同名 `.html`；不存在的文章返回真正的 404。不要统一回退到首页，否则缺失文章与搜索引擎状态码会不正确。

带内容哈希的 `/assets/` 可以长期缓存，HTML 应每次重新校验。`content/public/` 中自行放置的文件尽量不要占用保留的 `/assets/` 路径，头像更新可改文件名避免旧缓存。

部署新版本时以完整 `dist/` 替换上个版本的发布目录，避免已经删除的文章或旧索引残留；线上服务可使用版本目录切换完成发布。

## Docker

```bash
docker build --build-arg SITE_URL=https://blog.example.com -t thus-live .
docker run --rm -p 8080:80 thus-live
```

访问 `http://localhost:8080`。Dockerfile 使用 Node.js 24 构建，再将 `dist/` 放入 Nginx 镜像；不运行 Node 服务。`site.profile.json` 会参与构建，本地 `.env` 和测试产物不会复制到镜像构建上下文。

`SITE_URL` 是 **build arg**。`docker run -e SITE_URL=...` 不会改写已经生成的网页；修改域名或文章后需要重新构建镜像。省略 build arg 时也可以直接使用 profile 中的 URL。

## 浏览器回归

本机默认使用 Chrome。Linux / CI 或没有 Chrome 时，可以安装 Playwright Chromium：

```bash
npx playwright install --with-deps chromium
PLAYWRIGHT_BROWSER=chromium npm run test:e2e
```

PowerShell：

```powershell
npx playwright install chromium
$env:PLAYWRIGHT_BROWSER = 'chromium'
npm run test:e2e
Remove-Item Env:PLAYWRIGHT_BROWSER
```

先执行 `npm run build`。测试会在 `4180` 端口启动独立预览服务，不复用你手工启动的 `4173` 服务。截图命令 `npm run capture:preview` 需要手工启动 `4173` 预览，也支持同一浏览器环境变量。
