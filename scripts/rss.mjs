/** XML 1.0 text, including safe handling of control characters in frontmatter. */
export function escapeXml(value) {
  return String(value)
    .replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, '')
    .replace(/[<>&"']/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[character]))
}

/** @param {string} [slug] */
export function feedPath(slug) {
  return slug === undefined ? '/feed.xml' : `/feeds/tags/${encodeURIComponent(slug)}.xml`
}

/**
 * Render summary feeds from the same metadata as the blog, without executing Markdown.
 * @param {(import('../src/types').Post & { draft?: boolean })[]} posts
 * @param {{ name: string, description: string, language: string, author: string }} site
 * @param {string} siteUrl
 * @param {{ name: string, slug: string }} [tag]
 */
export function renderRss(posts, site, siteUrl, tag) {
  const published = posts.filter(post => !post.draft && (!tag || post.tags.includes(tag.name)))
    .sort((a, b) => b.date.localeCompare(a.date) || a.url.localeCompare(b.url))
  const absolute = relative => new URL(relative, siteUrl).href
  const title = tag ? `${site.name} · #${tag.name}` : site.name
  const description = tag ? `${site.name} 中关于「${tag.name}」的博文。` : site.description
  const latest = published.map(post => post.updated || post.date).sort().at(-1)
  const date = value => new Date(`${value}T00:00:00Z`)
  const items = published.map(post => {
    const url = escapeXml(absolute(post.url))
    // RSS descriptions contain encoded HTML; escape summary text before wrapping it.
    const summary = escapeXml(`<p>${escapeXml(post.description)}</p>`)
    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${date(post.date).toUTCString()}</pubDate>
      ${post.updated ? `<atom:updated>${date(post.updated).toISOString()}</atom:updated>\n      ` : ''}<dc:creator>${escapeXml(site.author)}</dc:creator>
      <description>${summary}</description>
${post.tags.map(name => `      <category>${escapeXml(name)}</category>`).join('\n')}
    </item>`
  }).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(absolute(tag ? `/tags/${encodeURIComponent(tag.slug)}` : '/'))}</link>
    <description>${escapeXml(description)}</description>
    <language>${escapeXml(site.language)}</language>
    <atom:link href="${escapeXml(absolute(feedPath(tag?.slug)))}" rel="self" type="application/rss+xml" />
    <generator>Thus.Live</generator>
    ${latest ? `<lastBuildDate>${date(latest).toUTCString()}</lastBuildDate>\n` : ''}${items}
  </channel>
</rss>
`
}
