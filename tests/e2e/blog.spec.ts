import { test, expect } from '@playwright/test'
import { siteConfig } from '../../site.config'

test('home, date archive, multi-tag navigation and theme persistence', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page).toHaveTitle(siteConfig.title)
  await expect(page.getByRole('heading', { name: siteConfig.name, exact: true })).toBeVisible()
  await page.getByRole('link', { name: '浏览博文' }).click()
  await expect(page.locator('.post-entry')).toHaveCount(2)
  await expect(page.locator('.post-entry .post-author').first()).toHaveText(siteConfig.author)
  await page.getByRole('link', { name: '#写作', exact: true }).first().click()
  await expect(page.locator('.post-entry')).toHaveCount(2)
  await page.getByRole('link', { name: '#博客指南', exact: true }).first().click()
  await expect(page.locator('.post-entry')).toHaveCount(1)
  await expect(page.locator('.post-entry h2')).toHaveText('博客编写与发布指南')
  await page.getByRole('link', { name: '时间轴', exact: true }).click()
  await page.getByRole('link', { name: '09 月', exact: true }).click()
  await expect(page).toHaveURL(/archive\/2026\/09$/)
  await expect(page.locator('.archive-entry')).toHaveCount(2)
  await page.getByRole('button', { name: '切换明暗主题' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  expect(errors).toEqual([])
})

test('search loads body text, handles empty results, keyboard close and focus return', async ({ page }) => {
  await page.goto('/blog')
  await page.getByRole('button', { name: '搜索博文' }).click()
  const input = page.getByRole('searchbox')
  await input.fill('AbortController')
  await expect(page.locator('.search-result')).toHaveCount(1)
  await expect(page.locator('.search-result')).toContainText('Markdown 写作与代码展示')
  await expect(page.locator('.search-result .search-meta')).toContainText(siteConfig.author)
  await input.fill('不会存在的关键词XYZ')
  await expect(page.getByText('没有找到相关文章。')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('dialog')).not.toBeVisible()
  await expect(page.getByRole('button', { name: '搜索博文' })).toBeFocused()
})

test('Markdown renders code, math, diagrams and functional code groups', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/posts/2026/09/16/markdown-guide')
  await expect(page.locator('.markdown-body table')).toBeVisible()
  await expect(page.locator('.task-list-item')).toHaveCount(3)
  await expect(page.locator('.footnotes')).toBeVisible()
  await expect(page.locator('mjx-container').first()).toBeVisible()
  await expect(page.locator('.mermaid-output svg')).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: '切换明暗主题' }).click()
  await expect(page.locator('.mermaid-output svg')).toBeVisible()
  await expect(page.locator('.article-header .post-author')).toHaveText(siteConfig.author)
  const localImage = page.getByRole('img', { name: 'Markdown 转换为静态网页的流程示例' })
  await localImage.scrollIntoViewIfNeeded()
  await expect.poll(() => localImage.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
  await expect(page.locator('.desktop-toc a').first()).toBeVisible()
  await page.locator('.language-csharp button.copy').click()
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('AddScoped')
  await page.getByText('example.json', { exact: true }).click()
  await expect(page.locator('.vp-code-group .blocks > .active')).toContainText('一篇新的记录')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Markdown 写作与代码展示', exact: true })).toBeVisible()
})

test('responsive views have no page overflow and mobile TOC stays usable', async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of ['/', '/blog', '/archive', '/posts/2026/09/16/markdown-guide']) {
      await page.goto(path)
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByText('本文目录', { exact: true }).click()
  await expect(page.locator('.mobile-toc nav a').first()).toBeVisible()
  await expect(page.locator('.mermaid-output svg')).toBeVisible({ timeout: 30_000 })
  await page.screenshot({ path: 'test-results/article-mobile.png', fullPage: true })
})

test('syntax highlighting has distinct colors in both themes and survives switching back', async ({ page }) => {
  await page.goto('/posts/2026/09/16/markdown-guide')
  const code = page.locator('.language-csharp .shiki')
  const palette = () => code.locator('.line span').evaluateAll(tokens =>
    [...new Set(tokens.map(token => getComputedStyle(token).color))].sort())
  const lightColors = await palette()
  expect(lightColors.length).toBeGreaterThan(2)
  await page.getByRole('button', { name: '切换明暗主题' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  const darkColors = await palette()
  expect(darkColors.length).toBeGreaterThan(2)
  expect(darkColors).not.toEqual(lightColors)
  await page.getByRole('button', { name: '切换明暗主题' }).click()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await expect.poll(palette).toEqual(lightColors)
  await page.reload()
  await expect.poll(palette).toEqual(lightColors)
})

test('HTML is prerendered and removed demo articles return 404', async ({ browser, request }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/posts/2026/09/16/markdown-guide')
  await expect(page.getByRole('heading', { name: 'Markdown 写作与代码展示', exact: true })).toBeVisible()
  await expect(page.locator('.markdown-body')).toContainText('AddScoped')
  const staticColors = await page.locator('.language-csharp .shiki .line span').evaluateAll(tokens =>
    new Set(tokens.map(token => getComputedStyle(token).color)).size)
  expect(staticColors).toBeGreaterThan(2)
  await context.close()
  for (const removed of [
    '2026/08/06/continuous-integration', '2026/08/15/ddd-boundaries', '2026/08/23/mysql-indexes',
    '2026/09/01/vue-components', '2026/09/08/ef-core-queries', '2026/09/15/dependency-injection',
    '2026/09/17/draft-example',
  ]) {
    const response = await request.get(`/posts/${removed}`)
    expect(response.status(), removed).toBe(404)
  }
})

test('writing guides link to each other and explain the publishing workflow', async ({ page }) => {
  await page.goto('/posts/2026/09/17/blog-writing-guide')
  await expect(page.getByRole('heading', { name: '博客编写与发布指南', exact: true })).toBeVisible()
  await expect(page.locator('.markdown-body')).toContainText('npm run new:post')
  await expect(page.locator('.markdown-body')).toContainText('site.profile.json')
  await page.locator('.markdown-body').getByRole('link', { name: 'Markdown 写作与代码展示', exact: true }).click()
  await expect(page).toHaveURL(/\/markdown-guide$/)
  await page.locator('.markdown-body').getByRole('link', { name: '博客编写与发布指南', exact: true }).first().click()
  await expect(page).toHaveURL(/\/blog-writing-guide$/)
})
