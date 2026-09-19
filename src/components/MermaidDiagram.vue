<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'
const props = defineProps<{ source: string }>()
const { isDark } = useData()
const output = ref('')
const error = ref('')
const code = decodeURIComponent(props.source)
let version = 0
async function render() {
  const current = ++version
  try {
    const { default: mermaid } = await import('mermaid')
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: isDark.value ? 'dark' : 'neutral', fontFamily: 'inherit' })
    const result = await mermaid.render(`diagram-${Date.now()}-${Math.random().toString(36).slice(2)}`, code)
    if (current === version) { output.value = result.svg; error.value = '' }
  } catch (cause) { console.error('Mermaid render failed:', cause); if (current === version) { output.value = ''; error.value = '图表暂时无法显示，可展开查看源码。' } }
}
onMounted(() => { void render(); watch(isDark, render) })
</script>

<template>
  <figure class="mermaid-block">
    <div v-if="output" class="mermaid-output" role="img" aria-label="Mermaid 图表" v-html="output" />
    <p v-else class="muted" role="status">{{ error || '图表将在浏览器中渲染。' }}</p>
    <details :open="!!error"><summary>图表源码</summary><pre><code>{{ code }}</code></pre></details>
  </figure>
</template>
