import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { parsePost, readPosts, collectTags, archiveDates, markdownText } from '../scripts/content.mjs'

const article = '---\ntitle: 测试文章\ntags: [Vue, .NET, Vue]\n---\n\n## 标题\n\n正文 `const value = 42`。'
test('date comes from directories, tags deduplicate, and Chinese URLs encode safely', () => {
  const post = parsePost('posts/2024/02/29/新文章.md', article)
  assert.equal(post.date, '2024-02-29')
  assert.equal(post.url, '/posts/2024/02/29/%E6%96%B0%E6%96%87%E7%AB%A0')
  assert.deepEqual(post.tags, ['Vue', '.NET'])
  assert.ok(post.readingMinutes >= 1)
  assert.equal(parsePost('posts/2024/02/29/hello/index.md', article).url, '/posts/2024/02/29/hello/')
})
test('rejects impossible dates, non-date folders and conflicting metadata', () => {
  assert.throws(() => parsePost('posts/2025/02/29/test.md', article), /日期无效/)
  assert.throws(() => parsePost('posts/2026/13/01/test.md', article), /日期无效/)
  assert.throws(() => parsePost('posts/misc/test.md', article), /必须位于/)
  assert.throws(() => parsePost('posts/2026/09/16/test.md', article.replace('title:', 'date: 2026-09-15\ntitle:')), /date 必须/)
  assert.throws(() => parsePost('posts/2026/09/16/test.md', article.replace('tags: [Vue, .NET, Vue]', 'tags: Vue')), /tags 必须/)
})
test('drafts never enter public metadata, tags or archive dates; collisions fail fast', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'thus-live-content-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const dir = path.join(root, 'posts/2026/09/16')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'public.md'), article)
  fs.writeFileSync(path.join(dir, 'draft.md'), article.replace('title:', 'draft: true\ntitle:'))
  const posts = readPosts(root)
  assert.equal(posts.length, 1)
  assert.equal(readPosts(root, true).length, 2)
  assert.deepEqual(archiveDates(posts), ['2026/09/16', '2026/09', '2026'])
  assert.equal(collectTags(posts).find(tag => tag.name === '.NET').slug, 'dotnet')
  assert.equal(collectTags(posts).find(tag => tag.name === 'Vue').count, 1)
  fs.mkdirSync(path.join(dir, 'public'))
  fs.writeFileSync(path.join(dir, 'public/index.md'), article)
  assert.throws(() => readPosts(root), /重复的文章路由/)
})
test('search text keeps code and strips Markdown punctuation', () => {
  const text = markdownText('## Heading\n\nA **bold** [link](https://example.test).\n\n```ts\nconst uniqueToken = 42\n```')
  assert.match(text, /bold link/)
  assert.match(text, /uniqueToken/)
  assert.doesNotMatch(text, /https:\/\//)
})
