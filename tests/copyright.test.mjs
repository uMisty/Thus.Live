import test from 'node:test'
import assert from 'node:assert/strict'
import { renderCopyright } from '../scripts/copyright.mjs'

test('copyright external links automatically open in a new tab', () => {
  assert.equal(
    renderCopyright('© 博客 · [首页](/) · [GitHub](https://github.com/uMisty)'),
    '© 博客 · <a href="/">首页</a> · <a href="https://github.com/uMisty" target="_blank" rel="noopener noreferrer">GitHub</a>',
  )
  for (const url of ['http://example.com', 'https://example.com/a_(b)', '//example.com', 'mailto:hello@example.com']) {
    assert.match(renderCopyright(`[链接](${url})`), /target="_blank" rel="noopener noreferrer"/)
  }
})

test('internal links stay in the same tab and attribute suffixes are plain text', () => {
  for (const url of ['/', '/about', './about', '../about', '#section', '?page=2']) {
    assert.doesNotMatch(renderCopyright(`[链接](${url})`), /target=/)
  }
  for (const text of ['普通文字{target="_blank"}', '[首页](/) {target="_blank"}', '[首页](/)\\{target="_blank"}', '[首页](/){onclick="alert(1)"}']) {
    assert.doesNotMatch(renderCopyright(text), /<a[^>]+(?:target|onclick)=/)
  }
  assert.match(renderCopyright('[首页](/){target="_blank"}'), /<\/a>\{target=&quot;_blank&quot;\}/)
})

test('copyright still escapes HTML and rejects unsafe links', () => {
  assert.doesNotMatch(renderCopyright('[危险](javascript:alert(1)){target="_blank"}'), /<a /)
  assert.equal(renderCopyright('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;')
  assert.equal(renderCopyright(''), '')
})
