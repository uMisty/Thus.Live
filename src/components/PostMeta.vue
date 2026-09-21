<script setup lang="ts">
import { withBase } from 'vitepress'
import { siteConfig } from '../../site.config'
import type { Post } from '../types'
import { formatDate } from '../format-date'
defineProps<{ post: Pick<Post, 'date' | 'readingMinutes' | 'updated'>; linkDate?: boolean; showUpdated?: boolean }>()
</script>

<template>
  <p class="post-meta">
    <a v-if="linkDate" :href="withBase(`/archive/${post.date.replaceAll('-', '/')}`)"><time :datetime="post.date">{{ formatDate(post.date) }}</time></a>
    <time v-else :datetime="post.date">{{ formatDate(post.date) }}</time>
    <span aria-hidden="true">·</span><span class="post-author">{{ siteConfig.author }}</span>
    <span aria-hidden="true">·</span><span>约 {{ post.readingMinutes }} 分钟</span>
    <template v-if="showUpdated && post.updated">
      <span aria-hidden="true">·</span><span class="post-updated">最后修订于 <time :datetime="post.updated">{{ formatDate(post.updated) }}</time></span>
    </template>
  </p>
</template>
