import fs from 'node:fs'
import path from 'node:path'
import { parsePost } from './content.mjs'

const args = process.argv.slice(2)
const slug = args[0]
const get = name => { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1] }
const date = get('--date') || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
if (!slug || slug.startsWith('--')) {
  console.error('用法：npm run new:post -- article-slug --title "文章标题" --date 2026-09-16')
  process.exit(1)
}
const title = get('--title') || slug
const relative = `posts/${date.replaceAll('-', '/')}/${slug}.md`
const source = `---\ntitle: ${JSON.stringify(title)}\ndescription: "写下一句话摘要。"\ntags: []\ndraft: true\n---\n\n## 开始记录\n\n在这里写下正文。\n`
parsePost(relative, source)
const file = path.resolve('content', relative)
fs.mkdirSync(path.dirname(file), { recursive: true })
fs.writeFileSync(file, source, { flag: 'wx' })
console.log(`已创建草稿：${file}\n完成后把 draft 改为 false，再运行 npm run build。`)
