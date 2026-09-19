import fs from 'node:fs'
import path from 'node:path'
const root = path.resolve('dist')
const files = fs.readdirSync(root, { recursive: true }).filter(file => file.endsWith('.html'))
const problems = []
let checked = 0
for (const file of files) {
  const html = fs.readFileSync(path.join(root, file), 'utf8')
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = match[1].replaceAll('&amp;', '&')
    if (!target || target.startsWith('#') || /^(https?:|data:|mailto:|tel:|javascript:)/.test(target)) continue
    const url = new URL(target, `https://local.test/${file.replaceAll('\\', '/')}`)
    const relative = decodeURIComponent(url.pathname).replace(/^\//, '')
    const candidates = [relative, relative + '.html', relative.replace(/\/$/, '') + '/index.html']
    if (!candidates.some(candidate => { const f = path.join(root, candidate); return fs.existsSync(f) && fs.statSync(f).isFile() })) problems.push({ file, target })
    checked++
  }
}
if (problems.length) { console.error(problems); process.exitCode = 1 }
else console.log(`静态链接校验通过：${files.length} 个 HTML，${checked} 个本地链接与资源引用。`)
