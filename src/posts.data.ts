import { readPosts, publicPost, collectTags } from '../scripts/content.mjs'
import type { BlogData } from './types'
declare const data: BlogData
export { data }
export default {
  watch: ['../content/posts/**/*.md'],
  load() {
    const posts = readPosts()
    return { posts: posts.map(publicPost), tags: collectTags(posts) }
  },
}
