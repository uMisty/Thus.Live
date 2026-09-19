# Thus.Live 设计约定

以文字阅读为中心：白色与中性暗色背景，青绿色链接，细线列表和时间轴，不使用大面积装饰卡片。

- 首页采用头像占位、名称、简短介绍与博文入口；默认内容不代表任何个人履历。
- 站点名称、作者、简介与头像都由 `site.profile.json` 覆盖。头像为空时使用配置的占位文字，或站点名称首字母。
- 列表与正文共用 `PostMeta.vue`，顺序为日期、作者、预计阅读时间。
- 时间轴的圆点与日期行居中对齐；跨月保持连续，最后一个节点没有尾线。
- 文章使用多标签和二、三级标题目录。代码高亮有独立的亮色和暗色配色。
- 动效简短、只播放一次，并尊重系统“减少动态效果”设置。

## 实现入口

| 文件 | 内容 |
| --- | --- |
| `src/styles/theme.css` | 语义颜色、排版、页面布局 |
| `src/styles/markdown.css` | Markdown 与代码块 |
| `src/styles/motion.css` | 入场、主题和交互动效 |
| `src/components/` | Vue 页面组件 |
| `design/responsive.md` | 响应式约定 |

`npm run capture:preview` 在本地预览服务器运行后生成截图到 `design/implementation/`。该目录属于本地检查产物，不进入 Git 或 Docker 构建。
