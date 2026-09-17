<script setup lang="ts">
import { useData, withBase } from 'vitepress'
import { data } from '../posts.data'
import { feedPath } from '../../scripts/rss.mjs'
import type { BlogThemeConfig } from '../types'
import FeedAddress from './FeedAddress.vue'

const { theme } = useData<BlogThemeConfig>()
function tagUrl(slug: string) { return new URL(feedPath(slug), theme.value.feedUrl).href }
</script>

<template>
  <div class="rss-view">
    <header class="rss-intro">
      <h1 class="section-heading">RSS 订阅</h1>
      <p class="muted">把更新交给阅读器，按自己的节奏阅读。</p>
      <p class="rss-help">复制订阅地址，粘贴到 RSS 阅读器的「添加订阅」中。新文章发布后，阅读器会自动获取标题和摘要，点击即可阅读原文。</p>
    </header>
    <template v-if="theme.feedUrl">
      <section class="rss-feed" aria-labelledby="rss-all-heading">
        <h2 id="rss-all-heading">全部博文 <span>{{ data.posts.length }} 篇</span></h2>
        <p class="muted">在一处收取所有话题的更新。</p>
        <FeedAddress :url="theme.feedUrl" label="全部博文" />
      </section>
      <section v-if="data.tags.length" class="rss-tags" aria-labelledby="rss-tags-heading">
        <h2 id="rss-tags-heading">按标签订阅</h2>
        <p class="muted">只关注感兴趣的话题，也可以同时订阅多个标签。</p>
        <ul>
          <li v-for="tag in data.tags" :key="tag.slug" class="rss-feed">
            <h3><a :href="withBase(`/tags/${encodeURIComponent(tag.slug)}`)">#{{ tag.name }}</a> <span>{{ tag.count }} 篇</span></h3>
            <FeedAddress :url="tagUrl(tag.slug)" :label="`#${tag.name}`" />
          </li>
        </ul>
      </section>
    </template>
    <p v-else class="rss-unavailable muted">本站暂未启用 RSS 订阅，可以先<a :href="withBase('/blog')">浏览博文</a>。</p>
  </div>
</template>

<style scoped>
.rss-view { max-width: 720px; }
.rss-intro { margin-bottom: 36px; }
.rss-help { margin-top: 20px; line-height: 1.9; }
.rss-feed { padding: 24px 0; border-bottom: 1px solid var(--line); }
.rss-feed h2, .rss-tags > h2 { font-size: 22px; margin-bottom: 8px; }
.rss-feed h3 { font-size: 18px; }
.rss-feed h3 a { color: var(--accent); }
.rss-feed h3 a:hover { text-decoration: underline; }
.rss-feed h2 span, .rss-feed h3 span { margin-left: 12px; font-size: 13px; color: var(--muted); font-weight: 400; white-space: nowrap; }
.rss-tags { margin-top: 40px; }
.rss-tags ul { padding: 0; list-style: none; }
.rss-unavailable { padding-block: 24px; border-top: 1px solid var(--line); }
.rss-unavailable a { margin-inline: 4px; color: var(--accent); text-decoration: underline; }
</style>
