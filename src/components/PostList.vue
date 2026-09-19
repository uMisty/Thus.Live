<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import { siteConfig } from '../../site.config'
import type { Post } from '../types'
import TagLinks from './TagLinks.vue'
import PostMeta from './PostMeta.vue'
const props = defineProps<{ posts: Post[] }>()
const visibleCount = ref(siteConfig.pageSize)
const visible = computed(() => props.posts.slice(0, visibleCount.value))
watch(() => props.posts, () => { visibleCount.value = siteConfig.pageSize })
</script>

<template>
  <div class="post-list">
    <article v-for="post in visible" :key="post.url" class="post-entry" data-reveal>
      <PostMeta :post="post" />
      <h2><a :href="withBase(post.url)">{{ post.title }}</a></h2>
      <p class="post-description">{{ post.description }}</p>
      <TagLinks :tags="post.tags" />
    </article>
    <p v-if="!posts.length" class="empty-message">暂时没有文章。新的记录会出现在这里。</p>
    <div v-if="visibleCount < posts.length" class="load-more"><button class="text-button" @click="visibleCount += siteConfig.pageSize">加载更多 <span aria-hidden="true">↓</span></button><span class="muted">{{ visible.length }} / {{ posts.length }}</span></div>
    <noscript v-if="posts.length > siteConfig.pageSize"><p>可通过<a :href="withBase('/archive')">时间轴</a>浏览全部文章。</p></noscript>
  </div>
</template>
