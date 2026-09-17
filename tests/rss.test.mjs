import test from 'node:test'
import assert from 'node:assert/strict'
import { parsePost } from '../scripts/content.mjs'
import { escapeXml, feedPath, renderRss } from '../scripts/rss.mjs'

const site = { name: '记录 & 分享', description: '持续写作 <学习>', language: 'zh-CN', author: '作者 & 朋友' }
const origin = 'https://blog.example.test'
function post(slug, metadata = {}) {
  return parsePost(`posts/2026/09/17/${slug}.md`, `---\n${JSON.stringify({ title: slug, description: '文章摘要', tags: ['写作'], ...metadata })}\n---\n正文不应进入摘要 Feed。`)
}

test('RSS excludes drafts, sorts newest first and does not mutate post order', () => {
  const older = { ...post('older'), date: '2026-09-16' }
  const posts = [post('z-last'), older, post('secret', { draft: true }), post('a-first')]
  const before = [...posts]
  const xml = renderRss(posts, site, origin)
  assert.deepEqual([...xml.matchAll(/<item>\s*<title>(.*?)<\/title>/g)].map(match => match[1]), ['a-first', 'z-last', 'older'])
  assert.doesNotMatch(xml, /secret|正文不应/)
  assert.deepEqual(posts, before)
  assert.equal((renderRss(Array.from({ length: 25 }, (_, i) => post(`post-${i}`)), site, origin).match(/<item>/g) || []).length, 25)
})

test('RSS keeps stable absolute permalinks, author, self URL and publication dates after updates', () => {
  const original = post('中文文章')
  const updated = { ...original, updated: '2026-09-19' }
  const before = renderRss([original], site, origin)
  const after = renderRss([updated], site, origin + '/')
  const url = origin + original.url
  assert.ok(after.includes(`<link>${url}</link>`))
  assert.ok(after.includes(`<guid isPermaLink="true">${url}</guid>`))
  assert.equal(before.match(/<pubDate>.*?<\/pubDate>/)?.[0], after.match(/<pubDate>.*?<\/pubDate>/)?.[0])
  assert.match(after, /<atom:updated>2026-09-19T00:00:00.000Z<\/atom:updated>/)
  assert.match(after, /<lastBuildDate>Sat, 19 Sep 2026 00:00:00 GMT<\/lastBuildDate>/)
  assert.ok(after.includes(`<atom:link href="${origin}/feed.xml" rel="self" type="application/rss+xml" />`))
  assert.match(after, /<dc:creator>作者 &amp; 朋友<\/dc:creator>/)
})

test('tag feeds include only matching published posts and use encoded tag URLs', () => {
  const tag = { name: '写作', slug: '写作' }
  const xml = renderRss([post('included'), post('excluded', { tags: ['Vue'] }), post('draft', { draft: true })], site, origin, tag)
  assert.match(xml, /<title>记录 &amp; 分享 · #写作<\/title>/)
  assert.match(xml, /<title>included<\/title>/)
  assert.doesNotMatch(xml, /excluded|<title>draft<\/title>/)
  assert.ok(xml.includes(`${origin}/tags/${encodeURIComponent(tag.slug)}`))
  assert.ok(xml.includes(origin + feedPath(tag.slug)))
  assert.match(xml, /<category>写作<\/category>/)
  assert.equal(feedPath('dotnet'), '/feeds/tags/dotnet.xml')
})

test('XML and HTML summary escaping preserve Chinese, emoji and literal markup', () => {
  const xml = renderRss([post('escaping', { title: '<标题> & "引号" 🚀', description: '<script>alert("x")</script> & 示例 ]]>\u0000' })], site, origin)
  assert.match(xml, /<title>&lt;标题&gt; &amp; &quot;引号&quot; 🚀<\/title>/)
  assert.ok(xml.includes('&lt;p&gt;&amp;lt;script&amp;gt;'))
  assert.doesNotMatch(xml, /<script>|\u0000|\]\]>/)
  assert.equal(escapeXml('\u0000\u0001\u000b\ufffe\uffff\ud800\t\n中文 🚀'), '\t\n中文 🚀')
})

test('an empty feed remains a channel without invented dates or items', () => {
  const xml = renderRss([], site, origin)
  assert.match(xml, /<rss version="2.0"/)
  assert.match(xml, /<channel>/)
  assert.match(xml, /<language>zh-CN<\/language>/)
  assert.doesNotMatch(xml, /<item>|lastBuildDate|Invalid Date/)
})
