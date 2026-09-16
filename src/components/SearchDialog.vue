<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import { siteConfig } from '../../site.config'
import type { SearchPost } from '../types'
import Icon from './Icon.vue'
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement>()
const input = ref<HTMLInputElement>()
const query = ref('')
const posts = ref<SearchPost[]>([])
const loading = ref(false)
const failed = ref(false)
let loaded = false
async function load() {
  if (loaded || loading.value) return
  loading.value = true
  failed.value = false
  try { posts.value = (await import('../search.data')).data; loaded = true }
  catch { failed.value = true }
  finally { loading.value = false }
}
watch(() => props.open, async open => {
  await nextTick()
  if (open) { dialog.value?.showModal(); input.value?.focus(); void load() }
  else dialog.value?.close()
})
const matches = computed(() => {
  const terms = query.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return posts.value.slice(0, 6)
  return posts.value.map(post => {
    const title = post.title.toLocaleLowerCase()
    const tags = post.tags.join(' ').toLocaleLowerCase()
    const haystack = `${title} ${tags} ${post.description} ${post.searchText}`.toLocaleLowerCase()
    return { post, score: terms.every(term => haystack.includes(term)) ? terms.reduce((score, term) => score + (title.includes(term) ? 10 : 0) + (tags.includes(term) ? 5 : 0) + 1, 0) : 0 }
  }).filter(hit => hit.score > 0).sort((a,b) => b.score - a.score || b.post.date.localeCompare(a.post.date)).map(hit => hit.post)
})
function move(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); emit('close'); return }
  if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return
  const links = [...(dialog.value?.querySelectorAll<HTMLAnchorElement>('.search-result') ?? [])]
  if (!links.length) return
  event.preventDefault()
  const index = links.indexOf(document.activeElement as HTMLAnchorElement)
  const next = event.key === 'ArrowDown' ? Math.min(index + 1, links.length - 1) : Math.max(index - 1, -1)
  if (next < 0) input.value?.focus()
  else links[next].focus()
}
</script>

<template>
  <dialog ref="dialog" class="search-dialog" aria-labelledby="search-heading" @cancel.prevent="emit('close')" @click="($event.target === $event.currentTarget) && emit('close')" @keydown="move">
    <div class="search-surface">
      <h2 id="search-heading" class="sr-only">搜索博文</h2>
      <div class="search-input-row">
        <Icon name="search" />
        <input ref="input" v-model="query" type="search" aria-label="搜索标题、正文或标签" placeholder="搜索标题、正文或标签…" autocomplete="off" />
        <button class="dismiss-search" aria-label="关闭搜索" @click="emit('close')"><span aria-hidden="true">Esc</span></button>
      </div>
      <div class="search-results">
        <p class="search-status" role="status" aria-live="polite">{{ loading ? '正在载入索引…' : failed ? '索引加载失败' : query.trim() ? `找到 ${matches.length} 篇文章` : '最近的记录' }}</p>
        <button v-if="failed" class="text-button" @click="load">重新加载</button>
        <div v-else-if="!loading && query.trim() && !matches.length" class="search-empty">
          <p>没有找到相关文章。</p><p class="muted">换一个关键词，或试试技术标签。</p>
          <button class="text-button" @click="query = ''; input?.focus()">清除搜索</button>
        </div>
        <a v-for="post in matches.slice(0, 30)" :key="post.url" class="search-result" :href="withBase(post.url)" @click="emit('close')">
          <time :datetime="post.date">{{ post.date.replaceAll('-', '.') }}</time><span class="search-meta"> · {{ siteConfig.author }} · 约 {{ post.readingMinutes }} 分钟</span>
          <h3>{{ post.title }}</h3><p>{{ post.description }}</p>
          <span class="search-tags"><span v-for="tag in post.tags" :key="tag">#{{ tag }}</span></span>
        </a>
        <p v-if="matches.length > 30" class="muted">仅显示前 30 项，请添加关键词缩小范围。</p>
      </div>
    </div>
  </dialog>
</template>
