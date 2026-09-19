<script setup lang="ts">
import { withBase } from 'vitepress'
import { data } from '../posts.data'
defineProps<{ tags: string[] }>()
function url(name: string) { return withBase('/tags/' + encodeURIComponent(data.tags.find(tag => tag.name === name)!.slug)) }
</script>

<template>
  <ul class="tag-links" aria-label="文章标签">
    <li v-for="tag in tags" :key="tag"><a :href="url(tag)">#{{ tag }}</a></li>
  </ul>
</template>
