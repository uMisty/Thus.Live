export interface Post {
  file: string
  url: string
  title: string
  description: string
  date: string
  updated?: string
  year: string
  month: string
  day: string
  tags: string[]
  readingMinutes: number
}
export interface Tag { name: string; slug: string; count: number }
export interface BlogData { posts: Post[]; tags: Tag[] }
export interface SearchPost extends Post { searchText: string }
export interface BlogThemeConfig { feedUrl: string }
