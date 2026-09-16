import { readPosts, archiveDates } from '../../scripts/content.mjs'
export default {
  paths: () => archiveDates(readPosts()).map(date => ({ params: { date } })),
}
