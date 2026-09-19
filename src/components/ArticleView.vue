<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData, withBase } from 'vitepress'
import { data } from '../posts.data'
import type { Post } from '../types'
import PostMeta from './PostMeta.vue'
import TagLinks from './TagLinks.vue'
const { frontmatter, page } = useData()
const post = computed(() => frontmatter.value.post as Post)
const body = ref<HTMLElement>()
const activeHeading = ref('')
const announcement = ref('')
const headings = computed(() => page.value.headers.flatMap(header => [header, ...header.children]))
const index = computed(() => data.posts.findIndex(item => item.url === post.value?.url))
const older = computed(() => data.posts[index.value + 1])
const newer = computed(() => data.posts[index.value - 1])
let observer: IntersectionObserver | undefined
let cleanupTimer: ReturnType<typeof setTimeout> | undefined
function observeHeadings() {
  observer?.disconnect()
  observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top)
    if (visible[0]) activeHeading.value = visible[0].target.id
  }, { rootMargin: '-12% 0px -65% 0px' })
  body.value?.querySelectorAll('h2[id],h3[id]').forEach(el => observer?.observe(el))
}
async function copy(event: MouseEvent) {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button.copy')
  if (!button || !body.value?.contains(button)) return
  // Own the copy event so the framework's global copy handler does not run twice.
  event.stopPropagation()
  const clone = button.parentElement?.querySelector('pre code')?.cloneNode(true) as HTMLElement | undefined
  clone?.querySelectorAll('.diff.remove, .vp-copy-ignore').forEach(node => node.remove())
  let code = clone?.textContent ?? ''
  if (/language-(shellscript|shell|bash|sh|zsh)/.test(button.parentElement?.className ?? '')) code = code.replace(/^ *(\$|>) /gm, '').trim()
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(code)
    else {
      const textarea = document.createElement('textarea'); textarea.value = code; textarea.style.position = 'fixed'; textarea.style.opacity = '0'; document.body.appendChild(textarea); textarea.select()
      const ok = document.execCommand('copy'); textarea.remove(); button.focus(); if (!ok) throw new Error('copy failed')
    }
    button.classList.add('copied'); announcement.value = '代码已复制'; button.setAttribute('aria-label', '代码已复制')
    cleanupTimer = setTimeout(() => { button.classList.remove('copied'); button.setAttribute('aria-label', '复制代码'); announcement.value = '' }, 2000)
  } catch { announcement.value = '复制失败，请选中代码后手动复制。' }
}
function codeGroup(event: Event) {
  const input = event.target as HTMLInputElement
  const group = input.closest('.vp-code-group')
  if (!group || input.type !== 'radio') return
  const index = [...group.querySelectorAll('input')].indexOf(input)
  group.querySelectorAll('.blocks > div').forEach((block, i) => block.classList.toggle('active', i === index))
}
async function enhance() {
  await nextTick()
  body.value?.querySelectorAll('button.copy').forEach(button => { button.setAttribute('aria-label', '复制代码'); button.setAttribute('title', '复制代码') })
  observeHeadings()
}
onMounted(() => { void enhance(); watch(() => page.value.relativePath, enhance) })
onBeforeUnmount(() => { observer?.disconnect(); clearTimeout(cleanupTimer) })
</script>

<template>
  <div v-if="post" class="article-layout">
    <article class="article-main">
      <header class="article-header" data-reveal-group>
        <a class="back-link" :href="withBase('/blog')">← 返回博文</a>
        <PostMeta :post="post" link-date show-updated />
        <h1>{{ post.title }}</h1>
        <TagLinks :tags="post.tags" />
        <p class="article-lead">{{ post.description }}</p>
      </header>
      <details v-if="headings.length" class="mobile-toc"><summary>本文目录</summary><nav aria-label="本文目录"><a v-for="heading in headings" :key="heading.link" :href="heading.link" :class="{ nested: heading.level > 2 }">{{ heading.title }}</a></nav></details>
      <div ref="body" class="markdown-body" @click="copy" @change="codeGroup"><Content /></div>
      <p class="sr-only" role="status">{{ announcement }}</p>
      <footer class="article-footer">
        <a class="back-link" :href="withBase('/blog')">← 返回博文列表</a>
        <nav v-if="newer || older" class="adjacent-posts" aria-label="相邻文章">
          <a v-if="newer" :href="withBase(newer.url)"><span>较新的记录</span>{{ newer.title }}</a>
          <a v-if="older" :href="withBase(older.url)"><span>较早的记录</span>{{ older.title }}</a>
        </nav>
      </footer>
    </article>
    <aside v-if="headings.length" class="desktop-toc"><nav aria-label="本文目录"><p>目录</p><a v-for="heading in headings" :key="heading.link" :href="heading.link" :aria-current="activeHeading === heading.link.slice(1) ? 'location' : undefined" :class="{ nested: heading.level > 2 }">{{ heading.title }}</a></nav></aside>
  </div>
</template>
