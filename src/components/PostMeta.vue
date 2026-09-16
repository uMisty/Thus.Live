<script setup lang="ts">
import { withBase } from 'vitepress'
import { siteConfig } from '../../site.config'
import type { Post } from '../types'
defineProps<{ post: Pick<Post, 'date' | 'readingMinutes' | 'updated'>; linkDate?: boolean; showUpdated?: boolean }>()
</script>

<template>
  <p class="post-meta">
    <a v-if="linkDate" :href="withBase(`/archive/${post.date.replaceAll('-', '/')}`)"><time :datetime="post.date">{{ post.date.replaceAll('-', '.') }}</time></a>
    <time v-else :datetime="post.date">{{ post.date.replaceAll('-', '.') }}</time>
    <span aria-hidden="true">·</span><span class="post-author">{{ siteConfig.author }}</span>
    <span aria-hidden="true">·</span><span>约 {{ post.readingMinutes }} 分钟</span>
    <span v-if="showUpdated && post.updated" class="post-updated">更新于 <time :datetime="post.updated">{{ post.updated }}</time></span>
  </p>
</template>
