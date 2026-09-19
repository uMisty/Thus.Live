import { test, expect } from '@playwright/test'
import { readPosts, collectTags } from '../../scripts/content.mjs'
import { feedPath } from '../../scripts/rss.mjs'
import { siteConfig } from '../../site.config'

const posts = readPosts()
const tags = collectTags(posts)
const discovery = 'head link[rel="alternate"][type="application/rss+xml"]'

test('RSS entry, feed XML and per-tag discovery match the published content', async ({ page, request }) => {
  await page.goto('/')
  await page.locator('.header-actions').getByRole('link', { name: 'RSS 订阅' }).click()
  await expect(page).toHaveURL(/\/rss$/)
  await expect(page.getByRole('heading', { name: 'RSS 订阅', exact: true })).toBeVisible()
  await expect(page.locator('.site-footer').getByRole('link', { name: 'RSS 订阅' })).toHaveCount(0)
  const feedUrl = await page.locator(discovery).getAttribute('href', { timeout: 1000 }).catch(() => null)
  if (!feedUrl) {
    await expect(page.getByText('本站暂未启用 RSS 订阅', { exact: false })).toBeVisible()
    await expect(page.locator('.feed-address')).toHaveCount(0)
    expect((await request.get('/feed.xml')).status()).toBe(404)
    for (const tag of tags) expect((await request.get(feedPath(tag.slug))).status()).toBe(404)
    return
  }
  await expect(page.getByRole('textbox', { name: '全部博文 RSS 地址', exact: true })).toHaveValue(feedUrl)
  await expect(page.locator('.feed-address')).toHaveCount(tags.length + 1)
  for (const tag of [undefined, ...tags]) {
    const response = await request.get(feedPath(tag?.slug))
    expect(response.ok()).toBe(true)
    expect(response.headers()['content-type']).toMatch(/xml/)
    const xml = await response.text()
    const parsed = await page.evaluate(source => {
      const doc = new DOMParser().parseFromString(source, 'application/xml')
      return {
        error: doc.querySelector('parsererror')?.textContent,
        title: doc.querySelector('channel > title')?.textContent,
        self: doc.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'link')[0]?.getAttribute('href'),
        items: [...doc.querySelectorAll('item')].map(item => ({
          title: item.querySelector('title')?.textContent,
          url: item.querySelector('link')?.textContent,
          guid: item.querySelector('guid')?.textContent,
          author: item.getElementsByTagNameNS('http://purl.org/dc/elements/1.1/', 'creator')[0]?.textContent,
          date: item.querySelector('pubDate')?.textContent,
        })),
      }
    }, xml)
    expect(parsed.error).toBeUndefined()
    expect(parsed.title).toBe(tag ? `${siteConfig.name} · #${tag.name}` : siteConfig.name)
    expect(parsed.self).toBe(new URL(feedPath(tag?.slug), feedUrl).href)
    const expectedPosts = posts.filter(post => !tag || post.tags.includes(tag.name))
    expect(parsed.items.map(item => item.title)).toEqual(expectedPosts.map(post => post.title))
    for (const [index, item] of parsed.items.entries()) {
      expect(item.url).toBe(new URL(expectedPosts[index].url, feedUrl).href)
      expect(item.guid).toBe(item.url)
      expect(item.author).toBe(siteConfig.author)
      expect(Number.isFinite(Date.parse(item.date || ''))).toBe(true)
    }
    if (tag) {
      await page.goto(`/tags/${encodeURIComponent(tag.slug)}`)
      await expect(page.locator(`${discovery}[href="${parsed.self}"]`)).toHaveCount(1)
      await expect(page.getByRole('link', { name: `订阅 #${tag.name} RSS（新窗口）` })).toHaveAttribute('href', feedPath(tag.slug))
    }
  }
  await page.getByRole('link', { name: '博文', exact: true }).click()
  await expect(page.locator(discovery)).toHaveCount(1)
})

test('RSS addresses can be copied, with manual selection when the clipboard is unavailable', async ({ page, context }) => {
  await page.goto('/rss')
  test.skip(await page.locator(discovery).count() === 0, 'RSS is disabled without a configured site URL')
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  for (const label of ['全部博文', ...tags.map(tag => `#${tag.name}`)]) {
    const input = page.getByRole('textbox', { name: `${label} RSS 地址`, exact: true })
    await page.getByRole('button', { name: `复制${label} RSS 地址`, exact: true }).click()
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(await input.inputValue())
  }
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }))
  await page.getByRole('button', { name: '复制全部博文 RSS 地址', exact: true }).click()
  const input = page.getByRole('textbox', { name: '全部博文 RSS 地址', exact: true })
  await expect(input).toBeFocused()
  await expect(page.getByRole('status').first()).toHaveText('请手动复制已选中的地址。')
  expect(await input.evaluate((element: HTMLInputElement) => element.value.slice(element.selectionStart ?? 0, element.selectionEnd ?? 0))).toBe(await input.inputValue())
})

test('RSS stays readable on mobile, in both themes and without JavaScript', async ({ page, browser }) => {
  await page.goto('/rss')
  const enabled = await page.locator(discovery).count() > 0
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const dark of [false, true]) {
      await page.evaluate(value => document.documentElement.classList.toggle('dark', value), dark)
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await expect(page.locator('.header-actions').getByRole('link', { name: 'RSS 订阅' })).toBeVisible()
    }
  }
  await page.evaluate(() => document.documentElement.classList.remove('dark'))
  await page.screenshot({ path: 'test-results/rss-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: 'test-results/rss-mobile.png', fullPage: true })
  const context = await browser.newContext({ javaScriptEnabled: false })
  const staticPage = await context.newPage()
  await staticPage.goto('/rss')
  await expect(staticPage.getByRole('heading', { name: 'RSS 订阅', exact: true })).toBeVisible()
  if (enabled) {
    await expect(staticPage.getByRole('textbox', { name: '全部博文 RSS 地址', exact: true })).toBeVisible()
    await expect(staticPage.getByRole('link', { name: '打开全部博文 RSS（新窗口）' })).toHaveAttribute('href', '/feed.xml')
  } else {
    await expect(staticPage.getByText('本站暂未启用 RSS 订阅', { exact: false })).toBeVisible()
  }
  await context.close()
})
