<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { data } from '../posts.data'
import TagLinks from './TagLinks.vue'
import { formatDate } from '../format-date'
const { page } = useData()
const selected = computed(() => String(page.value.params?.date ?? ''))
const groups = computed(() => {
  const posts = data.posts.filter(post => !selected.value || post.date.replaceAll('-', '/').startsWith(selected.value))
  return [...new Set(posts.map(post => post.year))].map(year => ({
    year, months: [...new Set(posts.filter(post => post.year === year).map(post => post.month))].map(month => ({
      month, posts: posts.filter(post => post.year === year && post.month === month),
    })),
  }))
})
</script>

<template>
  <div class="archive-view">
    <div v-if="selected" class="filter-context"><span>{{ formatDate(selected) }} 的记录</span><a :href="withBase('/archive')">全部时间轴</a></div>
    <h1 class="sr-only">{{ formatDate(selected) || '全部' }}文章归档</h1>
    <section v-for="year in groups" :key="year.year" class="archive-year">
      <h2 data-reveal><a :href="withBase(`/archive/${year.year}`)">{{ year.year }}</a></h2>
      <section v-for="month in year.months" :key="month.month" class="archive-month">
        <h3 data-reveal><a :href="withBase(`/archive/${year.year}/${month.month}`)">{{ month.month }} 月</a></h3>
        <div class="archive-entries">
          <article v-for="post in month.posts" :key="post.url" class="archive-entry">
            <a class="archive-date" :href="withBase(`/archive/${post.date.replaceAll('-', '/')}`)"><time :datetime="post.date">{{ formatDate(post.date) }}</time></a>
            <div class="archive-entry-content" data-reveal><h4><a :href="withBase(post.url)">{{ post.title }}</a></h4><TagLinks :tags="post.tags" /></div>
          </article>
        </div>
      </section>
    </section>
    <p v-if="!groups.length" class="empty-message">这个日期还没有记录。</p>
  </div>
</template>
