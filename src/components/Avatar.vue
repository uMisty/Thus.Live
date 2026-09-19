<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import { siteConfig } from '../../site.config'
const failed = ref(false)
const placeholder = computed(() => siteConfig.avatarText || Array.from(siteConfig.name.trim())[0]?.toUpperCase() || 'T')
defineProps<{ small?: boolean }>()
</script>

<template>
  <span class="avatar" :class="{ small }" aria-hidden="true">
    <img v-if="siteConfig.avatar && !failed" :src="withBase(siteConfig.avatar)" alt="" width="64" height="64" @error="failed = true" />
    <span v-else>{{ placeholder }}</span>
  </span>
</template>
