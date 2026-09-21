<script setup lang="ts">
import { withBase } from 'vitepress'
defineProps<{ name: 'search' | 'moon' | 'sun' | 'system' | 'chevron' | 'copy' | 'rss' }>()
</script>

<template>
  <span class="icon" aria-hidden="true" :style="{ maskImage: `url(${withBase(`/icons/${name}.svg`)})`, WebkitMaskImage: `url(${withBase(`/icons/${name}.svg`)})` }" />
</template>
