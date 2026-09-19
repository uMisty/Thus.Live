import { readPosts, collectTags } from '../../scripts/content.mjs'
export default {
  paths: () => collectTags(readPosts()).map(tag => ({ params: { tag: tag.slug, tagName: tag.name } })),
}
