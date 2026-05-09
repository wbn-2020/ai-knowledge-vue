<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteDocument, downloadDocument, getDocument, getDocumentPreview, renameDocument, retryDocument } from '@/api/knowledge'
import type { DocumentItem } from '@/types'
import { documentErrorOf, documentNameOf, embeddingStatusText, fileSizeOf, fileTypeOf, kbNameOf, parseStatusText, statusTagType, timeOf } from '@/utils/view-adapters'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const previewLoading = ref(false)
const doc = ref<DocumentItem | null>(null)
const preview = ref('')
const retrying = ref(false)
const downloading = ref(false)
const errorMessage = ref('')

function downloadBlob(response: any, fallbackName: string) {
  const blob = response?.data instanceof Blob ? response.data : new Blob([response?.data || ''])
  const disposition = response?.headers?.['content-disposition'] || ''
  const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i)
  const filename = match ? decodeURIComponent(match[1]) : fallbackName
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

async function loadPreview(id: number) {
  previewLoading.value = true
  try {
    preview.value = await getDocumentPreview(id)
  } catch {
    preview.value = ''
  } finally {
    previewLoading.value = false
  }
}

async function loadDetail() {
  loading.value = true
  errorMessage.value = ''
  try {
    const id = Number(route.params.id)
    doc.value = await getDocument(id)
    await loadPreview(id)
  } catch (error) {
    doc.value = null
    errorMessage.value = error instanceof Error ? error.message : '文档详情加载失败'
  } finally {
    loading.value = false
  }
}

async function retryParse() {
  if (!doc.value) return
  retrying.value = true
  try {
    await retryDocument(doc.value.id)
    ElMessage.success('已提交重新解析任务')
    await loadDetail()
  } finally {
    retrying.value = false
  }
}

async function downloadRaw() {
  if (!doc.value) return
  downloading.value = true
  try {
    const response = await downloadDocument(doc.value.id)
    downloadBlob(response, documentNameOf(doc.value))
  } finally {
    downloading.value = false
  }
}

async function rename() {
  if (!doc.value) return
  const result = await ElMessageBox.prompt('请输入新的文档名称', '重命名文档', {
    inputValue: documentNameOf(doc.value),
    inputValidator: (value) => !!value.trim() || '文档名称不能为空',
  })
  await renameDocument(doc.value.id, result.value.trim())
  ElMessage.success('文档已重命名')
  await loadDetail()
}

async function removeDoc() {
  if (!doc.value) return
  await ElMessageBox.confirm(`确认删除文档「${documentNameOf(doc.value)}」吗？`, '删除确认', { type: 'warning' })
  await deleteDocument(doc.value.id)
  ElMessage.success('文档已删除')
  router.push('/app/documents')
}

onMounted(loadDetail)
</script>

<template>
  <div v-loading="loading">
    <el-alert v-if="errorMessage" class="state-alert" type="error" show-icon :closable="false" :title="errorMessage" />
    <template v-if="doc">
      <div class="page-header">
        <div><h1 class="page-title">文档详情</h1><div class="page-desc">查看文档状态、失败原因和预览。</div></div>
        <div class="header-actions">
          <el-button plain @click="router.push('/app/documents')">返回列表</el-button>
          <el-button plain @click="rename">重命名</el-button>
          <el-button plain :loading="retrying" @click="retryParse">重新解析</el-button>
          <el-button plain type="danger" @click="removeDoc">删除</el-button>
          <el-button type="primary" :loading="downloading" @click="downloadRaw">下载原文件</el-button>
        </div>
      </div>
      <div class="detail-grid">
        <section class="soft-card"><div class="soft-card-body">
          <span class="subtle-badge">{{ fileTypeOf(doc) }}</span>
          <h2>{{ documentNameOf(doc) }}</h2>
          <div class="meta-grid">
            <div><span>所属知识库</span><strong>{{ kbNameOf(doc) }}</strong></div>
            <div><span>上传人</span><strong>{{ (doc as any).ownerName || (doc as any).username || '-' }}</strong></div>
            <div><span>大小</span><strong>{{ fileSizeOf(doc) }}</strong></div>
            <div><span>分块数量</span><strong>{{ (doc as any).chunkCount || (doc as any).segmentCount || 0 }}</strong></div>
            <div><span>解析状态</span><el-tag :type="statusTagType(doc.parseStatus)">{{ parseStatusText(doc.parseStatus) }}</el-tag></div>
            <div><span>向量状态</span><el-tag :type="statusTagType(doc.embeddingStatus)" effect="plain">{{ embeddingStatusText(doc.embeddingStatus) }}</el-tag></div>
            <div><span>更新时间</span><strong>{{ timeOf(doc) }}</strong></div>
            <div><span>失败原因</span><strong>{{ documentErrorOf(doc) || '-' }}</strong></div>
          </div>
        </div></section>
        <section class="soft-card"><div class="soft-card-body">
          <h3 class="section-title">预览</h3>
          <div class="summary-box" v-loading="previewLoading">{{ preview || '暂无预览内容' }}</div>
        </div></section>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.state-alert { margin-bottom: 16px; }
.header-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.detail-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 16px; }
h2 { margin: 14px 0 0; font-size: 28px; }
.meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 18px; }
.meta-grid span { display: block; color: var(--color-text-muted); font-size: 13px; margin-bottom: 6px; }
.summary-box { margin-top: 16px; max-height: 420px; min-height: 220px; overflow: auto; padding: 16px; border-radius: 14px; background: var(--color-surface-soft); color: var(--color-text-muted); line-height: 1.8; white-space: pre-wrap; }
@media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }
</style>
