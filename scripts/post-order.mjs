/**
 * Newest dates first; within a day, higher order first, then URL for stable ties.
 * @param {{ date: string, order?: number, url: string }} a
 * @param {{ date: string, order?: number, url: string }} b
 */
export function comparePosts(a, b) {
  return b.date.localeCompare(a.date) || (b.order ?? 0) - (a.order ?? 0) || a.url.localeCompare(b.url)
}
