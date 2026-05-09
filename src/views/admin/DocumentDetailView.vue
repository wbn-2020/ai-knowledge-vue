<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteAdminDocument, getAdminDocument, retryAdminDocument } from '@/api/knowledge'
import type { DocumentItem } from '@/types'
import { documentErrorOf, documentNameOf, embeddingStatusText, fileSizeOf, fileTypeOf, kbNameOf, parseStatusText, statusTagType, timeOf } from '@/utils/view-adapters'

const route = useRoute()
const doc = ref<DocumentItem | null>(null)
const loading = ref(false)

async function loadDetail() {
  loading.value = true
  try {
    doc.value = await getAdminDocument(Number(route.params.id))
  } finally {
    loading.value = false
  }
}

async function retry() {
  if (!doc.value) return
  await retryAdminDocument(doc.value.id)
  ElMessage.success('已提交重新解析')
  await loadDetail()
}

async function remove() {
  if (!doc.value) return
  await ElMessageBox.confirm(`确认删除文档「${documentNameOf(doc.value)}」吗？`, '删除确认', { type: 'warning' })
  await deleteAdminDocument(doc.value.id)
  ElMessage.success('文档已删除')
  history.back()
}

onMounted(loadDetail)
</script>

<template>
  <div v-loading="loading">
    <div class="page-header"><div><h1 class="page-title">后台文档详情</h1><div class="page-desc">查看文档元数据、失败原因、状态和重试入口。</div></div></div>
    <div v-if="doc" class="detail-grid">
      <section class="soft-card"><div class="soft-card-body">
        <h2>{{ documentNameOf(doc) }}</h2>
        <div class="meta-grid">
          <div><span>知识库</span><strong>{{ kbNameOf(doc) }}</strong></div><div><span>类型</span><strong>{{ fileTypeOf(doc) }}</strong></div>
          <div><span>大小</span><strong>{{ fileSizeOf(doc) }}</strong></div><div><span>解析状态</span><el-tag :type="statusTagType(doc.parseStatus)">{{ parseStatusText(doc.parseStatus) }}</el-tag></div>
          <div><span>向量状态</span><el-tag :type="statusTagType(doc.embeddingStatus)" effect="plain">{{ embeddingStatusText(doc.embeddingStatus) }}</el-tag></div><div><span>更新时间</span><strong>{{ timeOf(doc) }}</strong></div>
          <div><span>上传用户</span><strong>{{ (doc as any).ownerName || (doc as any).username || '-' }}</strong></div><div><span>分块数量</span><strong>{{ (doc as any).chunkCount || (doc as any).segmentCount || 0 }}</strong></div>
          <div><span>失败原因</span><strong>{{ documentErrorOf(doc) || '-' }}</strong></div>
        </div>
      </div></section>
      <section class="soft-card"><div class="soft-card-body"><h3 class="section-title">操作</h3><div class="action-list">
        <el-button type="warning" @click="retry">重新解析</el-button><el-button type="danger" @click="remove">删除文档</el-button>
      </div></div></section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.detail-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 16px; }
h2 { margin: 0 0 18px; font-size: 28px; }
.meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.meta-grid span { display: block; color: var(--color-text-muted); font-size: 13px; }
.meta-grid strong { display: block; margin-top: 6px; }
.action-list { display: grid; gap: 10px; }
@media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }
</style>
