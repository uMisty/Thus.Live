# 从公开模板创建 GitHub 私有源码仓库

[返回 README](../README.md)

目标是在 GitHub 上保留公开的通用项目，并派生一个可自行修改的 Private 源码仓库。本文说明的是 GitHub 仓库的创建与同步，部署方式可独立选择。

GitHub 的公开仓库 fork 仍然是公开仓库，无法单独改成私有。因此请建立**独立私有仓库**，而不是直接使用 Fork。参见 [GitHub 的 fork 可见性说明](https://docs.github.com/en/pull-requests/reference/forks)。

不需要额外后端或 GitHub API Token。项目已将默认配置与个人覆盖配置分开；仓库关系通过 Git 管理即可。

## 方式一：保留历史，方便以后合并更新（推荐）

适合长期跟随 Thus.Live 的界面、Markdown 能力和构建修复。独立仓库保留相同的基础提交，因此可以正常合并上游更新。

先由你在 GitHub 创建一个**空的 Private 仓库**，不要提前添加 README、LICENSE 或 `.gitignore`。以下命令仅是操作说明；请把 `PUBLIC_OWNER`、`YOUR_ACCOUNT` 和仓库名替换为自己的实际值，并确认公共仓库的默认分支是否为 `main`。

```bash
git clone https://github.com/PUBLIC_OWNER/thus-live.git my-blog
cd my-blog
git remote rename origin upstream
git remote set-url --push upstream DISABLED
git remote add origin https://github.com/YOUR_ACCOUNT/my-blog.git
git config remote.pushDefault origin
git remote -v
```

检查输出：`upstream` 的 fetch 地址应是公共模板，push 地址为 `DISABLED`；`origin` 应是你自己的私有仓库。然后由你执行首次推送：

```bash
git push -u origin main
```

这是一个独立仓库，不会显示为 GitHub 的 fork，也不会自动同步公共仓库。GitHub 也提供了 [复制仓库的官方说明](https://docs.github.com/en/repositories/creating-and-managing-repositories/duplicating-a-repository)。

### 添加自己的内容

1. 编辑 `site.profile.json`：名称、作者、头像、SEO 描述和域名；编辑 `content/index.md` 自定义首页内容。
2. 在 `content/posts/` 中添加自己的文章；两篇写作指南可保留或替换，并相应调整文内链接。
3. 在 `content/public/` 或文章相邻目录放入准备公开的图片。
4. 运行 `npm ci`、`npm run typecheck`、`npm test`、`npm run build`、`npm run check:output`。
5. 在自己的私有仓库提交个人配置和内容，并连接部署平台。

保留 `LICENSE` 便于读者了解模板来源与许可，0BSD 本身不强制要求保留版权或署名。你新写的文章可以单独声明内容许可。

### 后续同步上游

先提交或妥善保存自己的改动，让工作区保持干净。在私有仓库中新建更新分支，检查上游差异后合并：

```bash
git switch main
git fetch upstream
git log --oneline HEAD..upstream/main
git diff --stat HEAD...upstream/main
git switch -c update/template-2026-09
git merge upstream/main
```

更新分支名称应每次更换；若公共仓库默认分支不是 `main`，请替换对应命令。遇到冲突时逐个检查，保留自己的个人配置与文章，并理解模板新增配置或代码的用途。不要整体覆盖 `site.profile.json`，也不要把个人文章误改成上游演示内容。

合并后安装更新后的依赖并验证：

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run check:output
```

浏览器回归测试使用两篇写作指南的标题、数量和路由；替换指南后，先调整 `tests/e2e/` 再运行 `npm run test:e2e`。确认预览正常后，在私有仓库合并更新分支。

贡献公共模板修复时，建议另建一份干净的公共模板工作区，只提交通用代码改动。个人配置和文章留在私有仓库。

## 方式二：Use this template

把公共仓库设为 Template repository 后，可以点击 **Use this template → Create a new repository → Private**，在 GitHub 上创建自己的私有源码仓库。它提供当前文件的一份独立起点，操作更简单。

模板生成的仓库不继承完整提交历史，与原仓库没有共同的 Git 历史；不能像方式一那样直接合并上游更新。后续可对照版本说明手工应用所需改动。不要把强制合并不相关历史当作日常更新流程。参见 [GitHub 模板仓库说明](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template)。

## 公开与私有的范围

- 私有仓库控制的是源码访问；部署到公开网址的文章、作者、图片和搜索索引仍然公开。
- `draft: true` 会排除文章页面和索引，但 `content/public/` 会原样发布；邻近资源也不应存放敏感文件。
- `site.profile.json` 是网站配置，应提交到私有仓库，不是密钥存储。
- `.gitignore` 已排除构建目录、缓存、测试报告、截图、压缩包和本地环境文件；它不会从 Git 历史中移除已经提交过的文件。
- `package.json` 的 `private: true` 仅防止发布到 npm，与 GitHub 仓库可见性无关。

以上都是准备与维护步骤，本项目不会替你创建仓库、推送代码或调整 GitHub 权限。
