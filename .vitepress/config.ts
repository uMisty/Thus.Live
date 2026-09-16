import { defineConfig } from 'vitepress'
import fs from 'node:fs/promises'
import path from 'node:path'
import footnote from 'markdown-it-footnote'
import taskLists from 'markdown-it-task-lists'
import deflist from 'markdown-it-deflist'
import abbr from 'markdown-it-abbr'
import mark from 'markdown-it-mark'
import sub from 'markdown-it-sub'
import sup from 'markdown-it-sup'
import { readPosts, parsePost, publicPost, archiveDates, collectTags } from '../scripts/content.mjs'
import { siteConfig } from '../site.config'

const allPosts = readPosts(undefined, true)
const published = allPosts.filter(p => !p.draft)
const configuredUrl = process.env.SITE_URL || siteConfig.url || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
if (configuredUrl) {
  const parsed = new URL(configuredUrl)
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') throw new Error('站点 URL 必须是 HTTP(S) 根域名地址，例如 https://blog.example.com')
}
const siteUrl = configuredUrl ? new URL(configuredUrl).origin : ''
const escapeXml = (value: string) => value.replace(/[<>&"']/g, c => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&apos;' }[c]!))

export default defineConfig({
  lang: siteConfig.language,
  title: siteConfig.name,
  description: siteConfig.description,
  srcDir: 'content',
  outDir: 'dist',
  cleanUrls: true,
  appearance: { disableTransition: false },
  lastUpdated: false,
  srcExclude: allPosts.filter(p => p.draft).map(p => p.file),
  head: [
    ['meta', { name: 'theme-color', content: '#FFFFFF', media: '(prefers-color-scheme: light)' }],
    ['meta', { name: 'theme-color', content: '#17191A', media: '(prefers-color-scheme: dark)' }],
    ['meta', { name: 'color-scheme', content: 'light dark' }],
    ...(siteUrl ? [['link', { rel: 'alternate', type: 'application/rss+xml', title: `${siteConfig.name} RSS`, href: `${siteUrl}/feed.xml` }]] as [string, Record<string, string>][] : []),
  ],
  markdown: {
    theme: { light: 'github-light', dark: 'github-dark' },
    lineNumbers: true,
    headers: { level: [2, 3] },
    math: true,
    image: { lazyLoading: true },
    config(md) {
      md.use(footnote).use(taskLists).use(deflist).use(abbr).use(mark).use(sub).use(sup)
      md.core.ruler.after('inline', 'article-title', state => {
        if (!state.env.relativePath?.startsWith('posts/')) return
        const [open, title] = state.tokens
        if (open?.type === 'heading_open' && open.tag === 'h1' && (!state.env.frontmatter?.title || state.env.frontmatter.title === title?.content)) state.tokens.splice(0, 3)
      })
      const fence = md.renderer.rules.fence!
      md.renderer.rules.fence = (tokens, index, options, env, self) => {
        if (tokens[index].info.trim() === 'mermaid') {
          return `<MermaidDiagram source="${md.utils.escapeHtml(encodeURIComponent(tokens[index].content))}" />`
        }
        return fence(tokens, index, options, env, self)
      }
    },
  },
  async transformPageData(page) {
    if (page.frontmatter.layout === 'home') {
      page.title = siteConfig.title
      page.titleTemplate = false
      page.frontmatter.title = siteConfig.title
      page.frontmatter.titleTemplate = false
    }
    const post = page.relativePath.startsWith('posts/') ? parsePost(page.relativePath, await fs.readFile(path.resolve('content', page.relativePath), 'utf8')) : undefined
    if (post) {
      page.frontmatter.layout = 'article'
      page.frontmatter.post = publicPost(post)
      page.title = post.title
      page.description = post.description
      page.frontmatter.title = post.title
    }
    if (page.frontmatter.layout === 'tag') page.title = `#${page.params?.tagName ?? ''}`
    if (page.frontmatter.layout === 'archive' && page.params?.date) page.title = `${page.params.date} · 时间轴`
    if (siteUrl && !page.isNotFound) {
      const relative = page.relativePath.replace(/\.md$/, '').replace(/(^|\/)index$/, '$1')
      const url = new URL('/' + relative.split('/').map(encodeURIComponent).join('/'), siteUrl).href
      page.frontmatter.head ??= []
      page.frontmatter.head.push(['link', { rel: 'canonical', href: url }], ['meta', { property: 'og:url', content: url }], ['meta', { property: 'og:title', content: page.title }], ['meta', { property: 'og:description', content: page.description || siteConfig.description }], ['meta', { property: 'og:type', content: post ? 'article' : 'website' }])
    }
  },
  async buildEnd(config) {
    await fs.writeFile(path.join(config.outDir, 'robots.txt'), `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}`)
    if (!siteUrl) return
    const urls = ['/', '/blog', '/archive', '/tags', ...published.map(p => p.url), ...archiveDates(published).map(date => `/archive/${date}`), ...collectTags(published).map(tag => `/tags/${encodeURIComponent(tag.slug)}`)]
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${escapeXml(siteUrl + url)}</loc></url>`).join('')}</urlset>`
    await fs.writeFile(path.join(config.outDir, 'sitemap.xml'), sitemap)
    const feed = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml(siteConfig.name)}</title><link>${escapeXml(siteUrl)}</link><description>${escapeXml(siteConfig.description)}</description><language>${escapeXml(siteConfig.language)}</language>${published.map(post => `<item><title>${escapeXml(post.title)}</title><link>${escapeXml(siteUrl + post.url)}</link><guid>${escapeXml(siteUrl + post.url)}</guid><pubDate>${new Date(post.date + 'T00:00:00Z').toUTCString()}</pubDate><description>${escapeXml(post.description)}</description>${post.tags.map(tag => `<category>${escapeXml(tag)}</category>`).join('')}</item>`).join('')}</channel></rss>`
    await fs.writeFile(path.join(config.outDir, 'feed.xml'), feed)
  },
})
