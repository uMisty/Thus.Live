import test from 'node:test'
import assert from 'node:assert/strict'
import { renderCopyright } from '../scripts/copyright.mjs'

test('copyright links open in a new tab only when explicitly marked', () => {
  assert.equal(
    renderCopyright('© 博客 · [首页](/) · [GitHub](https://github.com/uMisty){target="_blank"}'),
    '© 博客 · <a href="/">首页</a> · <a href="https://github.com/uMisty" target="_blank" rel="noopener noreferrer">GitHub</a>',
  )
  assert.match(renderCopyright("[页面](https://example.com/a_(b)){target='_blank'}"), /target="_blank"/)
})

test('copyright attributes must immediately follow a valid link', () => {
  for (const text of ['普通文字{target="_blank"}', '[首页](/) {target="_blank"}', '[首页](/)\\{target="_blank"}', '[首页](/){onclick="alert(1)"}']) {
    assert.doesNotMatch(renderCopyright(text), /<a[^>]+(?:target|onclick)=/)
  }
  assert.doesNotMatch(renderCopyright('[危险](javascript:alert(1)){target="_blank"}'), /<a /)
  assert.equal(renderCopyright('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;')
  assert.equal(renderCopyright(''), '')
})
