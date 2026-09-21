import MarkdownIt from 'markdown-it'

const markdown = new MarkdownIt('zero', { html: false }).enable(['link', 'escape', 'entity'])

markdown.renderer.rules.link_open = (tokens, index, options, env, renderer) => {
  const link = tokens[index]
  // Match VitePress: a URL scheme or // identifies an external link.
  if (/^(?:[a-z]+:|\/\/)/i.test(link.attrGet('href') || '')) {
    link.attrSet('target', '_blank')
    link.attrSet('rel', 'noopener noreferrer')
  }
  return renderer.renderToken(tokens, index, options)
}

/** Render copyright text at build time without allowing raw HTML or unsafe URLs. */
export function renderCopyright(text) {
  return markdown.renderInline(text)
}
