import MarkdownIt from 'markdown-it'

const markdown = new MarkdownIt('zero', { html: false }).enable(['link', 'escape', 'entity'])

markdown.inline.ruler.before('escape', 'copyright-target', (state, silent) => {
  if (state.pending || state.tokens.at(-1)?.type !== 'link_close') return false
  const suffix = /^\{target=(?:"_blank"|'_blank')\}/.exec(state.src.slice(state.pos))
  if (!suffix) return false
  if (!silent) {
    const link = state.tokens.findLast(token => token.type === 'link_open')
    if (!link) return false
    link.attrSet('target', '_blank')
    link.attrSet('rel', 'noopener noreferrer')
  }
  state.pos += suffix[0].length
  return true
})

/** Render copyright text at build time without allowing raw HTML or unsafe URLs. */
export function renderCopyright(text) {
  return markdown.renderInline(text)
}
