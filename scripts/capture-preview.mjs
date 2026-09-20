import fs from 'node:fs'
import { chromium } from '@playwright/test'
const readme = process.argv.includes('--readme')
const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const dir = readme ? 'docs/images' : 'design/implementation'
fs.mkdirSync(dir, { recursive: true })
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_BROWSER === 'chromium' ? undefined : process.env.PLAYWRIGHT_BROWSER || 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1040 }, colorScheme: 'light' })
async function settleMotion() {
  // Poll the current animations; inherited colors can replace transition objects.
  await page.waitForFunction(() => document.getAnimations().every(animation => animation.playState !== 'running'), {}, { timeout: 5000 })
}
for (const [name, url, dark, width, height] of [
  ['home-desktop', '/', false, 1440, 1040],
  ['blog-desktop', '/blog', false, 1440, 1000],
  ['archive-light', '/archive', false, 1440, 1200],
  ['archive-dark', '/archive', true, 1440, 1200],
  ['article-dark', '/posts/2026/09/16/markdown-guide', true, 1440, 1000],
  ['home-mobile', '/', false, 390, 844],
  ['blog-mobile-dark', '/blog', true, 390, 844],
  ['archive-mobile-light', '/archive', false, 390, 1100],
  ['archive-mobile-dark', '/archive', true, 390, 1100],
  ['article-mobile', '/posts/2026/09/16/markdown-guide', false, 390, 844],
]) {
  if (readme && !['home-desktop', 'blog-desktop', 'archive-light', 'article-dark', 'article-mobile'].includes(name)) continue
  await page.setViewportSize({ width, height })
  await page.goto(new URL(url, baseUrl).href)
  await page.locator('.site-header').waitFor()
  const actual = await page.locator('html').evaluate(el => el.classList.contains('dark'))
  if (actual !== dark) await page.getByRole('button', { name: '切换明暗主题' }).click()
  await settleMotion()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: `${dir}/${name}.png` })
}
await page.getByRole('button', { name: '搜索博文' }).click()
await page.getByRole('searchbox').fill('Vue')
await page.locator('.search-result').first().waitFor()
await settleMotion()
await page.screenshot({ path: `${dir}/search-mobile.png` })
await browser.close()
console.log(`Screenshots saved to ${dir}`)
