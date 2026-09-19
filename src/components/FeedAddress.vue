<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{ url: string; label: string }>()
const localPath = computed(() => new URL(props.url).pathname)
const address = ref<HTMLInputElement>()
const status = ref('')
const copying = ref(false)

async function copy() {
  copying.value = true
  try {
    await navigator.clipboard.writeText(props.url)
    status.value = '地址已复制，可粘贴到阅读器。'
  } catch {
    address.value?.focus()
    address.value?.select()
    status.value = '请手动复制已选中的地址。'
  } finally {
    copying.value = false
  }
}
</script>

<template>
  <div class="feed-address">
    <input ref="address" :value="url" :aria-label="`${label} RSS 地址`" readonly spellcheck="false" @focus="address?.select()" />
    <div class="feed-actions">
      <button class="text-button" :aria-label="`复制${label} RSS 地址`" :disabled="copying" @click="copy">复制地址</button>
      <a :href="localPath" target="_blank" rel="noopener" :aria-label="`打开${label} RSS（新窗口）`">打开 RSS <span aria-hidden="true">↗</span></a>
    </div>
    <p class="copy-status muted" role="status">{{ status }}</p>
  </div>
</template>

<style scoped>
.feed-address { margin-top: 16px; }
input { width: 100%; min-width: 0; padding: 10px 12px; border: 1px solid var(--line); border-radius: 4px; background: var(--code-bg); color: var(--text); font-family: var(--font-mono); font-size: 13px; line-height: 24px; }
.feed-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 24px; margin-top: 8px; font-size: 14px; color: var(--accent); }
.feed-actions > * { display: inline-flex; align-items: center; min-height: 44px; }
.feed-actions a:hover { text-decoration: underline; }
.copy-status { min-height: 22px; font-size: 13px; }
</style>
