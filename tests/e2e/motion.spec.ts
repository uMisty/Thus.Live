import { test, expect, type Page } from '@playwright/test'
import { siteConfig } from '../../site.config'

async function settle(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    await Promise.allSettled(document.getAnimations().map(animation => animation.finished))
  })
}

test('animated navigation and scrolling keep content readable and focus usable', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await page.getByRole('link', { name: '浏览博文' }).click()
  await expect(page.locator('.post-entry')).toHaveCount(2)
  await expect(page.locator('main')).toBeFocused()
  // Navigate again while the prior content is arriving.
  await page.getByRole('link', { name: '时间轴', exact: true }).click()
  await page.getByRole('link', { name: '博文', exact: true }).click()
  await settle(page)
  const last = page.locator('.post-entry').last()
  await last.scrollIntoViewIfNeeded()
  await settle(page)
  await expect(last).toHaveCSS('opacity', '1')
  await expect(last).toHaveCSS('transform', 'none')
  await expect(page.locator('main')).toHaveCSS('opacity', '1')
  const title = await last.locator('h2').innerText()
  await last.locator('h2 a').click()
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
  await page.goBack()
  await settle(page)
  await expect(last).toBeInViewport()
  await expect(last).toHaveCSS('opacity', '1')
  expect(errors).toEqual([])
})

test('search can close and reopen during its transition without losing keyboard focus', async ({ page }) => {
  await page.goto('/blog')
  await page.getByRole('button', { name: '搜索博文' }).click()
  await expect(page.getByRole('searchbox')).toBeFocused()
  await page.keyboard.press('Escape')
  // The native close returns focus immediately, while the visual exit finishes.
  await page.keyboard.press('Control+k')
  await expect(page.getByRole('searchbox')).toBeFocused()
  await page.getByRole('searchbox').fill('Vue')
  await expect(page.locator('.search-result').first()).toBeVisible()
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('.search-result').first()).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.locator('dialog')).not.toBeVisible()
  await expect(page.getByRole('button', { name: '搜索博文' })).toBeFocused()
})

test('reduced motion disables effects immediately and preserves navigation and search', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('link', { name: '浏览博文' }).click()
  await page.locator('.post-entry').last().scrollIntoViewIfNeeded()
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0)
  await expect(page.locator('.post-entry').last()).toHaveCSS('opacity', '1')
  await page.getByRole('button', { name: '切换明暗主题' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.getByRole('button', { name: '搜索博文' }).click()
  await expect(page.getByRole('searchbox')).toBeFocused()
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0)
  await page.keyboard.press('Escape')
  await expect(page.locator('dialog')).not.toBeVisible()
  // Changing the OS preference on an already mounted page also cancels effects.
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.getByRole('link', { name: `${siteConfig.name} 首页` }).click()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0)
  await expect(page.locator('.home-content').getByRole('heading', { name: /Thus\.Live/, level: 1 })).toHaveCSS('opacity', '1')
})

test('direct article anchors land on readable content without entrance displacement', async ({ page }) => {
  const path = '/posts/2026/09/17/blog-writing-guide'
  await page.goto(path)
  const hash = await page.locator('.desktop-toc a').last().getAttribute('href')
  expect(hash).toBeTruthy()
  await page.goto(`${path}${hash}`)
  const heading = page.locator('.markdown-body :target')
  await expect(heading).toBeInViewport()
  await expect(page.locator('main')).toHaveCSS('animation-name', 'none')
  await expect(page.locator('.is-revealing')).toHaveCount(0)
  await expect(page.locator('main')).toHaveCSS('opacity', '1')
})
