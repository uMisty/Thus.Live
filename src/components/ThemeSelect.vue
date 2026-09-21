<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import Icon from './Icon.vue'

const storageKey = 'vitepress-theme-appearance'
const appearance = ref<'auto' | 'light' | 'dark'>('auto')
const modes = ['auto', 'light', 'dark'] as const
const labels = { auto: '跟随系统', light: '浅色', dark: '深色' }
const nextMode = computed(() => modes[(modes.indexOf(appearance.value) + 1) % modes.length])
const label = computed(() => `当前主题：${labels[appearance.value]}；点击切换为${labels[nextMode.value]}`)
function syncAppearance() {
  const saved = localStorage.getItem(storageKey)
  appearance.value = saved === 'light' || saved === 'dark' ? saved : 'auto'
}
function changeAppearance() {
  const value = nextMode.value
  const oldValue = localStorage.getItem(storageKey)
  localStorage.setItem(storageKey, value)
  appearance.value = value
  // Notify VitePress's reactive storage in this tab as well as other tabs.
  window.dispatchEvent(new StorageEvent('storage', {
    key: storageKey, oldValue, newValue: value, storageArea: localStorage,
  }))
}
onMounted(() => {
  syncAppearance()
  window.addEventListener('storage', syncAppearance)
})
onBeforeUnmount(() => window.removeEventListener('storage', syncAppearance))
</script>

<template>
  <button type="button" class="icon-button theme-toggle" :title="label" :aria-label="label" :data-appearance="appearance" @click="changeAppearance">
    <Icon :name="appearance === 'auto' ? 'system' : appearance === 'light' ? 'sun' : 'moon'" />
  </button>
</template>
