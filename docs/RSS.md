# RSS 订阅

[返回 README](../README.md) · [站点配置](CONFIGURATION.md)

## 读者如何订阅

点击导航栏的 RSS 图标，进入 `/rss`：

1. 选择「全部博文」或感兴趣的标签。
2. 点击「复制地址」，把地址粘贴到 RSS 阅读器的「添加订阅」中。
3. 阅读器会定期检查更新，显示文章标题、摘要、作者、发布日期和标签；点击文章可阅读原文。

也可以使用「打开 RSS」查看 XML 文件，或从标签页直接打开该标签的订阅。浏览器限制剪贴板权限时，页面会选中地址并提示手动复制。禁用 JavaScript 后仍可手动复制地址和打开 Feed。

## 站点启用方式

设置 `site.profile.json` 的 `url` 为自己的正式域名，然后重新构建部署：

```json
{
  "url": "https://blog.example.com"
}
```

示例域名需要替换。也可通过构建环境变量 `SITE_URL` 设置；优先级与 canonical、sitemap 一致：`SITE_URL` → profile 的 `url` → `VERCEL_PROJECT_PRODUCTION_URL`。当前仅支持域名根路径。

没有域名配置时，不生成 Feed 或自动发现链接，`/rss` 显示「本站暂未启用 RSS 订阅」。不会自动把本机地址当作正式订阅地址。

## 输出与更新

| 地址 | 内容 |
| --- | --- |
| `/rss` | 订阅说明、所有地址和复制操作 |
| `/feed.xml` | 全部已发布博文，按发布日期倒序，不受列表分页影响 |
| `/feeds/tags/<标签 slug>.xml` | 指定标签的已发布博文，与标签页面使用同一个 slug |

中文标签在链接中自动编码，`.NET` 等标签使用现有的 slug 规则。全站 HTML 声明全部博文的 RSS 自动发现链接；标签页额外声明该标签的 Feed。

Feed 使用 RSS 2.0，包含摘要而非全文。作者通过 `dc:creator` 提供，自身地址通过 `atom:link` 提供，参见 [RSS 规范](https://www.rssboard.org/rss-specification) 与 [兼容性建议](https://www.rssboard.org/rss-profile)。

- `draft: true` 不进入任何 Feed，只有草稿使用的标签也不会生成 Feed。
- 原文地址作为稳定的 GUID；修改标题、摘要或 `updated` 不会改变 GUID。
- `pubDate` 保留目录中的发布日期。设置 `updated` 后，条目会提供 `atom:updated`；频道的 `lastBuildDate` 取最新发布日期或更新日期。日期与原有 RSS 保持一致，按 UTC 零点输出。
- 修改文章后重新构建、部署，阅读器下次刷新时才会获取更新；是否重新提醒旧文章由阅读器决定。
- 移动文章目录或更改域名会改变原文地址和 GUID；更改标签名称可能改变标签 Feed 地址，读者需要更新订阅。
- 部署时替换完整 `dist/`，避免已删除标签的旧 Feed 残留。

## 本地验证

```powershell
$env:SITE_URL = 'https://blog.example.com'
npm run build
npm run check:output
npm run test:e2e
Remove-Item Env:SITE_URL
```

运行 `npm run preview` 后，可在本地查看 `/rss`、`/feed.xml` 和标签 Feed。页面提供的复制地址始终使用配置的正式域名，「打开 RSS」使用当前站点路径以便本地验证。

`npm run dev` 同样支持 Feed 预览：设置正式域名后，开发服务器按请求读取当前文章并生成 XML；新增、移动文章或切换草稿状态后仍需重启开发服务器以同步页面路由。没有域名配置时，开发环境也不启用 Feed。
