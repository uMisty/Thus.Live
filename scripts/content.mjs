import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'

const plainParser = new MarkdownIt({ html: false })
export const contentRoot = path.resolve('content')

export function tagSlug(tag) {
  return tag.normalize('NFKC').toLowerCase().replace(/^\./, 'dot').replace(/\+/g, 'plus').replace(/#/g, 'sharp').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')
}

export function markdownText(markdown) {
  const visit = (tokens) => tokens.map(token => {
    if (token.type === 'html_block' || token.type === 'html_inline') return ''
    if (token.children) return visit(token.children)
    if (['text', 'code_inline', 'fence', 'code_block'].includes(token.type)) return token.content
    return ' '
  }).join(' ')
  return visit(plainParser.parse(markdown, {})).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function parsePost(relativeFile, raw) {
  const normalized = relativeFile.replaceAll('\\', '/')
  const match = /^posts\/(\d{4})\/(\d{2})\/(\d{2})\/([^/]+?)(?:\/index)?\.md$/.exec(normalized)
  if (!match) throw new Error(`${normalized}: 文章必须位于 posts/YYYY/MM/DD/slug.md 或 slug/index.md`)
  const [, year, month, day, slug] = match
  if (Number(year) < 1000 || !/^[\p{L}\p{N}][\p{L}\p{N}_-]*$/u.test(slug)) throw new Error(`${normalized}: 年份或文章名无效`)
  const date = `${year}-${month}-${day}`
  const parsedDate = new Date(`${date}T00:00:00Z`)
  if (!Number.isFinite(+parsedDate) || parsedDate.toISOString().slice(0, 10) !== date) throw new Error(`${normalized}: 目录日期无效`)
  const { data, content } = matter(raw)
  if (data.date !== undefined) {
    const declared = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date)
    if (declared !== date) throw new Error(`${normalized}: date 必须与目录日期 ${date} 一致`)
  }
  const title = data.title ?? content.match(/^#\s+(.+)$/m)?.[1]
  if (typeof title !== 'string' || !title.trim()) throw new Error(`${normalized}: 需要 title 或一级标题`)
  if (data.tags !== undefined && (!Array.isArray(data.tags) || data.tags.some(t => typeof t !== 'string' || !t.trim()))) throw new Error(`${normalized}: tags 必须是非空字符串数组`)
  if (data.draft !== undefined && typeof data.draft !== 'boolean') throw new Error(`${normalized}: draft 必须为布尔值`)
  const tags = [...new Set((data.tags ?? []).map(t => t.trim()))]
  if (tags.some(t => !tagSlug(t))) throw new Error(`${normalized}: 标签需要包含文字或数字`)
  const searchText = markdownText(content)
  const cjk = (searchText.match(/[\u3400-\u9fff]/g) ?? []).length
  const words = searchText.replace(/[\u3400-\u9fff]/g, ' ').split(/\s+/).filter(Boolean).length
  const url = '/' + normalized.replace(/\.md$/, '').replace(/\/index$/, '/').split('/').map(encodeURIComponent).join('/')
  let updated = data.updated
  if (updated instanceof Date) updated = updated.toISOString().slice(0, 10)
  if (updated !== undefined && (typeof updated !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(updated) || !Number.isFinite(Date.parse(updated)) || new Date(updated).toISOString().slice(0,10) !== updated || updated < date)) throw new Error(`${normalized}: updated 需要是有效日期，且不能早于发布日期`)
  return {
    file: normalized, url, title: title.trim(), date, year, month, day,
    description: typeof data.description === 'string' ? data.description : searchText.slice(0, 120),
    tags, readingMinutes: Math.max(1, Math.ceil(cjk / 350 + words / 220)),
    updated, draft: data.draft === true, content, searchText,
  }
}

export function readPosts(root = contentRoot, includeDrafts = false) {
  const folder = path.join(root, 'posts')
  if (!fs.existsSync(folder)) return []
  const files = []
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(absolute)
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(absolute)
    }
  }
  walk(folder)
  const posts = files.map(file => parsePost(path.relative(root, file), fs.readFileSync(file, 'utf8')))
  const seen = new Set()
  const slugs = new Map()
  for (const post of posts) {
    const normalizedUrl = post.url.replace(/\/$/, '').toLowerCase()
    if (seen.has(normalizedUrl)) throw new Error(`重复的文章路由：${post.url}`)
    seen.add(normalizedUrl)
    for (const tag of post.tags) {
      const slug = tagSlug(tag)
      if (slugs.has(slug) && slugs.get(slug) !== tag) throw new Error(`标签路由冲突：${tag} / ${slugs.get(slug)}`)
      slugs.set(slug, tag)
    }
  }
  return posts.filter(p => includeDrafts || !p.draft).sort((a,b) => b.date.localeCompare(a.date) || a.url.localeCompare(b.url))
}

export function publicPost({ content, searchText, draft, ...post }) { return post }
export function collectTags(posts) {
  const tags = new Map()
  for (const post of posts) for (const name of post.tags) tags.set(name, (tags.get(name) ?? 0) + 1)
  return [...tags].map(([name, count]) => ({ name, count, slug: tagSlug(name) })).sort((a,b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'))
}
export function archiveDates(posts) {
  return [...new Set(posts.flatMap(p => [p.year, `${p.year}/${p.month}`, `${p.year}/${p.month}/${p.day}`]))].sort().reverse()
}
