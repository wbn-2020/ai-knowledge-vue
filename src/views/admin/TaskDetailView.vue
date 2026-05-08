<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getDocumentTask } from '@/api/knowledge'
import { documentNameOf, timeOf } from '@/utils/view-adapters'

const route = useRoute()
const loading = ref(false)
const task = ref<any>(null)

async function loadTask() {
  loading.value = true
  try {
    task.value = await getDocumentTask(Number(route.params.id))
  } finally {
    loading.value = false
  }
}

onMounted(loadTask)
</script>

<template>
  <div v-loading="loading">
    <div class="page-header"><div><h1 class="page-title">任务详情</h1><div class="page-desc">查看任务类型、关联文档、日志摘要和失败原因。</div></div></div>
    <div v-if="task" class="detail-grid">
      <section class="soft-card"><div class="soft-card-body"><div class="meta-grid">
        <div><span>ID</span><strong>#{{ task.id }}</strong></div><div><span>类型</span><strong>{{ task.type || task.taskType }}</strong></div>
        <div><span>文档</span><strong>{{ task.documentName || documentNameOf(task.document || task) }}</strong></div><div><span>状态</span><strong>{{ task.status }}</strong></div>
        <div><span>创建时间</span><strong>{{ timeOf(task) }}</strong></div><div><span>失败原因</span><strong>{{ task.reason || task.errorMessage || '-' }}</strong></div>
      </div></div></section>
      <section class="soft-card"><div class="soft-card-body"><h3 class="section-title">执行日志</h3><div class="log-box">{{ task.log || task.message || '暂无执行日志' }}</div></div></section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.meta-grid { display: grid; gap: 14px; }
.meta-grid span { display: block; color: var(--color-text-muted); font-size: 13px; }
.meta-grid strong { display: block; margin-top: 6px; }
.log-box { padding: 16px; border-radius: 14px; background: var(--color-surface-soft); color: var(--color-text-muted); line-height: 1.8; white-space: pre-wrap; }
@media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }
</style>
