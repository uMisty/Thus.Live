import type { Theme } from 'vitepress'
import Layout from '../../src/components/Layout.vue'
import MermaidDiagram from '../../src/components/MermaidDiagram.vue'
import '../../src/styles/theme.css'
import '../../src/styles/markdown.css'
import '../../src/styles/motion.css'

export default {
  Layout,
  enhanceApp({ app }) { app.component('MermaidDiagram', MermaidDiagram) },
} satisfies Theme
