import { readPosts, collectTags, archiveDates } from './content.mjs'
const all = readPosts(undefined, true)
const posts = all.filter(p => !p.draft)
console.log(`内容校验通过：${posts.length} 篇文章 / ${collectTags(posts).length} 个标签 / ${archiveDates(posts).length} 个日期归档；${all.length - posts.length} 篇草稿不会发布。`)
