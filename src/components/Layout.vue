<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData, withBase } from 'vitepress'
import { data } from '../posts.data'
import { siteConfig } from '../../site.config'
import { vReveal } from '../directives/reveal'
import Icon from './Icon.vue'
import ThemeSelect from './ThemeSelect.vue'
import PostList from './PostList.vue'
import ArchiveView from './ArchiveView.vue'
import ArticleView from './ArticleView.vue'
import SearchDialog from './SearchDialog.vue'
import RssView from './RssView.vue'
import { feedPath } from '../../scripts/rss.mjs'
import type { BlogThemeConfig } from '../types'
const { frontmatter, page, theme } = useData<BlogThemeConfig>()
const searchOpen = ref(false)
const tagMenu = ref<HTMLDetailsElement>()
const main = ref<HTMLElement>()
const layout = computed(() => page.value.isNotFound ? 'not-found' : frontmatter.value.layout || 'article')
const activeTag = computed(() => String(page.value.params?.tagName ?? ''))
const filteredPosts = computed(() => data.posts.filter(post => post.tags.includes(activeTag.value)))
const isPosts = computed(() => ['blog', 'article', 'tag'].includes(layout.value))
function keydown(event: KeyboardEvent) {
  const typing = (event.target as HTMLElement)?.closest('input,textarea,[contenteditable="true"]')
  if ((event.key === '/' && !typing) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')) { event.preventDefault(); searchOpen.value = true }
  if (event.key === 'Escape' && tagMenu.value) tagMenu.value.open = false
}
function outside(event: MouseEvent) { if (tagMenu.value && !tagMenu.value.contains(event.target as Node)) tagMenu.value.open = false }
watch(() => page.value.relativePath, async () => {
  searchOpen.value = false
  if (tagMenu.value) tagMenu.value.open = false
  await nextTick()
  main.value?.focus({ preventScroll: true })
})
onMounted(() => { document.addEventListener('keydown', keydown); document.addEventListener('click', outside) })
onBeforeUnmount(() => { document.removeEventListener('keydown', keydown); document.removeEventListener('click', outside) })
</script>

<template>
  <a class="skip-link" href="#main-content">跳到正文</a>
  <div class="site-shell">
    <header class="site-header">
      <a class="brand" :href="withBase('/')" :aria-label="`${siteConfig.name} 首页`">{{ siteConfig.name }}</a>
      <nav class="site-nav" aria-label="主导航">
        <a :href="withBase('/blog')" :aria-current="isPosts ? 'page' : undefined">博文</a>
        <details ref="tagMenu" class="tag-menu">
          <summary :class="{ selected: ['tags', 'tag'].includes(layout) }">标签 <Icon name="chevron" /></summary>
          <div class="tag-popover"><span class="popover-label">按话题浏览</span><a v-for="tag in data.tags.slice(0, 8)" :key="tag.slug" :href="withBase(`/tags/${encodeURIComponent(tag.slug)}`)"><span>#{{ tag.name }}</span><span>{{ tag.count }}</span></a><a class="all-tags" :href="withBase('/tags')">全部标签 →</a></div>
        </details>
        <a :href="withBase('/archive')" :aria-current="layout === 'archive' ? 'page' : undefined">时间轴</a>
      </nav>
      <div class="header-actions">
        <a class="icon-button" :href="withBase('/rss')" aria-label="RSS 订阅" title="RSS 订阅" :aria-current="layout === 'rss' ? 'page' : undefined"><Icon name="rss" /></a>
        <button class="icon-button" aria-label="搜索博文" aria-haspopup="dialog" title="搜索（Ctrl / ⌘ K）" @click="searchOpen = true"><Icon name="search" /></button>
        <ThemeSelect />
      </div>
    </header>

    <main id="main-content" :key="page.relativePath" ref="main" v-reveal tabindex="-1" class="site-main" :class="[`layout-${layout}`]">
      <Content v-if="layout === 'home'" class="home-content markdown-body" data-reveal-group />
      <template v-else-if="layout === 'blog'"><h1 class="sr-only">博文</h1><PostList :posts="data.posts" /></template>
      <template v-else-if="layout === 'tag'"><div class="filter-context"><h1>#{{ activeTag }} <span>{{ filteredPosts.length }}</span></h1><div class="filter-actions"><a v-if="theme.feedUrl" :href="withBase(feedPath(String(page.params?.tag)))" target="_blank" rel="noopener" :aria-label="`订阅 #${activeTag} RSS（新窗口）`">订阅此标签 ↗</a><a :href="withBase('/blog')">清除筛选</a></div></div><PostList :posts="filteredPosts" /></template>
      <section v-else-if="layout === 'tags'" class="tag-index"><h1 class="section-heading">标签</h1><p class="muted">从一个话题，开始阅读。</p><ul data-reveal-group><li v-for="tag in data.tags" :key="tag.slug"><a :href="withBase(`/tags/${encodeURIComponent(tag.slug)}`)"><span>#{{ tag.name }}</span><span>{{ tag.count }}</span></a></li></ul></section>
      <ArchiveView v-else-if="layout === 'archive'" />
      <RssView v-else-if="layout === 'rss'" />
      <ArticleView v-else-if="layout === 'article'" :key="page.relativePath" />
      <section v-else-if="layout === 'not-found'" class="not-found"><p class="eyebrow">404</p><h1>这页记录不在这里。</h1><p class="muted">地址可能已更改，也可能还没有写下。</p><a class="read-link" :href="withBase('/blog')">返回博文 →</a></section>
      <Content v-else class="markdown-body" />
    </main>

    <footer class="site-footer"><span class="site-copyright" v-html="theme.copyrightHtml"></span><span>{{ siteConfig.footer }}</span></footer>
  </div>
  <SearchDialog :open="searchOpen" @close="searchOpen = false" />
</template>
