import { readPosts, publicPost } from '../scripts/content.mjs'
import type { SearchPost } from './types'
declare const data: SearchPost[]
export { data }
export default {
  watch: ['../content/posts/**/*.md'],
  load: () => readPosts().map(post => ({ ...publicPost(post), searchText: post.searchText })),
}
