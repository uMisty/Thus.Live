import profile from './site.profile.json' with { type: 'json' }

/** Public template defaults. Keep personal overrides in site.profile.json. */
export interface SiteConfig {
  name: string
  author: string
  title: string
  description: string
  language: string
  url: string
  avatar: string
  avatarText: string
  footer: string
  pageSize: number
}

const defaults: SiteConfig = {
  name: 'Thus.Live',
  author: 'Thus.Live',
  title: 'Thus.Live · 记录与分享',
  description: '记录当下，持续思考。',
  language: 'zh-CN',
  url: '',
  avatar: '',
  avatarText: '',
  footer: '记录与分享',
  pageSize: 10,
}

// Reject misspelled/invalid overrides instead of silently producing broken pages.
if (!profile || typeof profile !== 'object' || Array.isArray(profile)) throw new Error('site.profile.json: 配置必须是 JSON 对象')
for (const [key, value] of Object.entries(profile)) {
  if (!Object.hasOwn(defaults, key)) throw new Error(`site.profile.json: 未知配置 ${key}`)
  if (key === 'pageSize') {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) throw new Error('site.profile.json: pageSize 必须是正整数')
  } else if (typeof value !== 'string') throw new Error(`site.profile.json: ${key} 必须是字符串`)
}

export const siteConfig: SiteConfig = { ...defaults, ...profile }
for (const key of ['name', 'author', 'title', 'language'] as const) {
  if (!siteConfig[key].trim()) throw new Error(`site.profile.json: ${key} 不能为空`)
}
