<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  deleteDocument,
  downloadDocument,
  extractDocumentKeywords,
  generateDocumentSummary,
  getDocument,
  getDocumentChunks,
  getDocumentKeywords,
  getDocumentPreview,
  getDocumentSummary,
  reextractDocumentKeywords,
  regenerateDocumentSummary,
  renameDocument,
  retryDocument,
} from '@/api/knowledge'
import type { DocumentItem, DocumentSummaryVO, KeywordVO } from '@/types'
import {
  documentErrorOf,
  documentNameOf,
  embeddingStatusText,
  fileSizeOf,
  fileTypeOf,
  formatDateTimeValue,
  kbNameOf,
  parseStatusText,
  statusTagType,
  textOf,
  timeOf,
} from '@/utils/view-adapters'
import { renderMarkdownSafe } from '@/utils/markdown'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const previewLoading = ref(false)
const chunkLoading = ref(false)
const doc = ref<DocumentItem | null>(null)
const preview = ref('')
const chunks = ref<any[]>([])
const retrying = ref(false)
const downloading = ref(false)
const errorMessage = ref('')
const chunkDialogVisible = ref(false)
const activeChunk = ref<any | null>(null)
const chunkPager = reactive({ pageNo: 1, pageSize: 10, total: 0 })

const summaryLoading = ref(false)
const summaryActionLoading = ref(false)
const keywordLoading = ref(false)
const keywordActionLoading = ref(false)
const summaryData = ref<DocumentSummaryVO | null>(null)
const keywords = ref<KeywordVO[]>([])

const previewHtml = computed(() => renderMarkdownSafe(preview.value || '暂无预览内容'))
const activeChunkHtml = computed(() => renderMarkdownSafe(activeChunk.value?.content || '-'))
const summaryText = computed(() => textOf(summaryData.value?.summary, '暂无摘要内容'))
const canGenerateSummary = computed(() => (doc.value?.parseStatus || '').toUpperCase() === 'SUCCESS')
const hasSummary = computed(() => Boolean(String(summaryData.value?.summary || '').trim()))
const hasKeywords = computed(() => keywords.value.length > 0)
const canAskByDocument = computed(() => (doc.value?.parseStatus || '').toUpperCase() === 'SUCCESS' && (doc.value?.embeddingStatus || '').toUpperCase() === 'SUCCESS')

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

function normalizeKeywords(list: KeywordVO[] | null | undefined): KeywordVO[] {
  if (!Array.isArray(list)) return []
  return list.filter((item) => item && String(item.keyword || '').trim())
}

function weightText(weight: unknown): string {
  if (weight === null || weight === undefined || weight === '') return ''
  const num = Number(weight)
  if (Number.isNaN(num)) return String(weight)
  return num.toFixed(2)
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

async function loadChunks(id: number) {
  chunkLoading.value = true
  try {
    const data = await getDocumentChunks(id, { pageNo: chunkPager.pageNo, pageSize: chunkPager.pageSize })
    chunks.value = data.list || []
    chunkPager.total = data.total || 0
    chunkPager.pageNo = data.pageNo || chunkPager.pageNo
    chunkPager.pageSize = data.pageSize || chunkPager.pageSize
  } catch {
    chunks.value = []
  } finally {
    chunkLoading.value = false
  }
}

async function loadDocUnderstanding(id: number) {
  summaryLoading.value = true
  keywordLoading.value = true
  try {
    const [summary, keywordList] = await Promise.all([
      getDocumentSummary(id).catch(() => null),
      getDocumentKeywords(id).catch(() => [] as KeywordVO[]),
    ])
    summaryData.value = summary || null
    keywords.value = normalizeKeywords(keywordList || [])
  } finally {
    summaryLoading.value = false
    keywordLoading.value = false
  }
}

async function loadDetail() {
  loading.value = true
  errorMessage.value = ''
  try {
    const id = Number(route.params.id)
    doc.value = await getDocument(id)
    await Promise.all([loadPreview(id), loadChunks(id), loadDocUnderstanding(id)])
  } catch (error) {
    doc.value = null
    errorMessage.value = error instanceof Error ? error.message : '文档详情加载失败'
  } finally {
    loading.value = false
  }
}

async function handleGenerateSummary(regenerate = false) {
  if (!doc.value) return
  if (!canGenerateSummary.value) {
    ElMessage.warning('文档尚未解析成功，暂不能生成摘要。')
    return
  }
  summaryActionLoading.value = true
  try {
    if (regenerate) {
      await regenerateDocumentSummary(doc.value.id)
      ElMessage.success('已提交重新生成摘要')
    } else {
      await generateDocumentSummary(doc.value.id)
      ElMessage.success('已提交生成摘要')
    }
    summaryData.value = await getDocumentSummary(doc.value.id)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '摘要操作失败，请稍后重试')
  } finally {
    summaryActionLoading.value = false
  }
}

async function handleExtractKeywords(reextract = false) {
  if (!doc.value) return
  if (!canGenerateSummary.value) {
    ElMessage.warning('文档尚未解析成功，暂不能提取关键词。')
    return
  }
  keywordActionLoading.value = true
  try {
    const list = reextract ? await reextractDocumentKeywords(doc.value.id) : await extractDocumentKeywords(doc.value.id)
    ElMessage.success(reextract ? '已重新提取关键词' : '已提取关键词')
    keywords.value = normalizeKeywords(list || [])
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '关键词操作失败，请稍后重试')
  } finally {
    keywordActionLoading.value = false
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
  await ElMessageBox.confirm(`确认删除文档“${documentNameOf(doc.value)}”吗？`, '删除确认', { type: 'warning' })
  await deleteDocument(doc.value.id)
  ElMessage.success('文档已删除')
  router.push('/app/documents')
}

function askByCurrentDocument() {
  if (!doc.value?.id) return
  if (!canAskByDocument.value) {
    ElMessage.warning('文档尚未解析和向量化完成，暂不能问答。')
    return
  }
  router.push({
    path: '/app/chat',
    query: {
      scope: 'document',
      documentId: String(doc.value.id),
      documentName: documentNameOf(doc.value),
    },
  })
}

function openChunkDialog(row: any) {
  activeChunk.value = row
  chunkDialogVisible.value = true
}

onMounted(loadDetail)
</script>

<template>
  <div v-loading="loading">
    <el-alert v-if="errorMessage" class="state-alert" type="error" show-icon :closable="false" :title="errorMessage" />

    <template v-if="doc">
      <div class="page-header">
        <div>
          <h1 class="page-title">文档详情</h1>
          <div class="page-desc">查看文档状态、失败原因、预览与切片。</div>
        </div>
        <div class="header-actions">
          <el-tooltip v-if="!canAskByDocument" content="文档尚未解析和向量化完成，暂不能问答。" placement="top">
            <span>
              <el-button type="success" disabled>基于本文档提问</el-button>
            </span>
          </el-tooltip>
          <el-button v-else type="success" @click="askByCurrentDocument">基于本文档提问</el-button>
          <el-button plain @click="router.push('/app/documents')">返回列表</el-button>
          <el-button plain @click="rename">重命名</el-button>
          <el-button plain :loading="retrying" @click="retryParse">重新解析</el-button>
          <el-button plain type="danger" @click="removeDoc">删除</el-button>
          <el-button type="primary" :loading="downloading" @click="downloadRaw">下载原文件</el-button>
        </div>
      </div>

      <div class="detail-grid">
        <section class="soft-card">
          <div class="soft-card-body">
            <span class="subtle-badge">{{ fileTypeOf(doc) }}</span>
            <h2>{{ documentNameOf(doc) }}</h2>
            <div class="meta-grid">
              <div><span>所属知识库</span><strong>{{ kbNameOf(doc) }}</strong></div>
              <div><span>上传人</span><strong>{{ (doc as any).ownerName || (doc as any).username || '-' }}</strong></div>
              <div><span>大小</span><strong>{{ fileSizeOf(doc) }}</strong></div>
              <div><span>切块数量</span><strong>{{ (doc as any).chunkCount || (doc as any).segmentCount || 0 }}</strong></div>
              <div><span>解析状态</span><el-tag :type="statusTagType(doc.parseStatus)">{{ parseStatusText(doc.parseStatus) }}</el-tag></div>
              <div><span>向量状态</span><el-tag :type="statusTagType(doc.embeddingStatus)" effect="plain">{{ embeddingStatusText(doc.embeddingStatus) }}</el-tag></div>
              <div><span>更新时间</span><strong>{{ timeOf(doc) }}</strong></div>
              <div><span>失败原因</span><strong>{{ documentErrorOf(doc) || '-' }}</strong></div>
            </div>
          </div>
        </section>
        <section class="soft-card">
          <div class="soft-card-body">
            <h3 class="section-title">预览</h3>
            <div class="summary-box markdown-body" v-loading="previewLoading" v-html="previewHtml" />
          </div>
        </section>
      </div>

      <div class="detail-grid understanding-grid">
        <section class="soft-card">
          <div class="soft-card-body" v-loading="summaryLoading">
            <div class="section-head">
              <h3 class="section-title">文档理解 · 摘要</h3>
              <el-button
                type="primary"
                plain
                :loading="summaryActionLoading"
                :disabled="!canGenerateSummary"
                @click="handleGenerateSummary(hasSummary)"
              >
                {{ hasSummary ? '重新生成' : '生成摘要' }}
              </el-button>
            </div>
            <el-alert
              v-if="!canGenerateSummary"
              type="warning"
              :closable="false"
              show-icon
              title="文档尚未解析成功，暂不能生成摘要。"
            />
            <div class="meta-line">
              <span>状态：{{ textOf(summaryData?.status) }}</span>
              <span>模型：{{ textOf(summaryData?.modelName) }}</span>
              <span>生成时间：{{ formatDateTimeValue(summaryData?.generatedAt) }}</span>
            </div>
            <el-alert
              v-if="summaryData?.errorMessage"
              type="error"
              :closable="false"
              show-icon
              :title="textOf(summaryData?.errorMessage, '摘要生成失败')"
            />
            <div class="summary-content">{{ summaryText }}</div>
          </div>
        </section>

        <section class="soft-card">
          <div class="soft-card-body" v-loading="keywordLoading">
            <div class="section-head">
              <h3 class="section-title">文档理解 · 关键词</h3>
              <el-button
                type="primary"
                plain
                :loading="keywordActionLoading"
                :disabled="!canGenerateSummary"
                @click="handleExtractKeywords(hasKeywords)"
              >
                {{ hasKeywords ? '重新提取' : '提取关键词' }}
              </el-button>
            </div>
            <el-alert
              v-if="!canGenerateSummary"
              type="warning"
              :closable="false"
              show-icon
              title="文档尚未解析成功，暂不能提取关键词。"
            />
            <el-empty v-if="!keywords.length" description="暂无关键词" :image-size="80" />
            <div v-else class="keyword-tags">
              <el-tag v-for="(item, index) in keywords" :key="`${item.keyword || 'keyword'}-${index}`" round>
                {{ textOf(item.keyword, '-') }}
                <template v-if="weightText(item.weight)"> {{ weightText(item.weight) }} </template>
              </el-tag>
            </div>
          </div>
        </section>
      </div>

      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">文档切片</h3>
          <el-table :data="chunks" v-loading="chunkLoading" size="large" empty-text="当前文档暂无切片，可能还未完成解析或向量化。">
            <el-table-column label="切片序号" width="100">
              <template #default="{ row }">{{ row.chunkIndex ?? '-' }}</template>
            </el-table-column>
            <el-table-column label="切片内容" min-width="420">
              <template #default="{ row }">
                <div class="chunk-content">{{ row.content || '-' }}</div>
                <el-button link type="primary" @click="openChunkDialog(row)">查看完整内容</el-button>
              </template>
            </el-table-column>
            <el-table-column label="Token 数" width="110">
              <template #default="{ row }">{{ row.tokenCount ?? '-' }}</template>
            </el-table-column>
            <el-table-column label="Vector ID" width="240" show-overflow-tooltip>
              <template #default="{ row }">{{ row.vectorId || '-' }}</template>
            </el-table-column>
            <el-table-column label="创建时间" width="180">
              <template #default="{ row }">{{ row.createdAt || row.createTime || '-' }}</template>
            </el-table-column>
          </el-table>
          <div class="pagination-row">
            <el-pagination
              v-model:current-page="chunkPager.pageNo"
              v-model:page-size="chunkPager.pageSize"
              layout="total, sizes, prev, pager, next"
              :page-sizes="[10, 20, 50]"
              :total="chunkPager.total"
              @size-change="chunkPager.pageNo = 1; loadChunks(doc!.id)"
              @current-change="loadChunks(doc!.id)"
            />
          </div>
        </div>
      </section>

      <el-dialog v-model="chunkDialogVisible" title="切片完整内容" width="760px">
        <div v-if="activeChunk" class="chunk-dialog-meta">
          <p>切片序号：{{ activeChunk.chunkIndex ?? '-' }}</p>
          <p>Token 数：{{ activeChunk.tokenCount ?? '-' }}</p>
          <p>Vector ID：{{ activeChunk.vectorId || '-' }}</p>
          <p>创建时间：{{ activeChunk.createdAt || activeChunk.createTime || '-' }}</p>
          <div class="chunk-dialog-content markdown-body" v-html="activeChunkHtml" />
        </div>
      </el-dialog>
    </template>
  </div>
</template>

<style scoped lang="scss">
.state-alert { margin-bottom: 16px; }
.header-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.detail-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 16px; }
.understanding-grid { margin-top: 16px; }
h2 { margin: 14px 0 0; font-size: 28px; }
.meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 18px; }
.meta-grid span { display: block; color: var(--color-text-muted); font-size: 13px; margin-bottom: 6px; }
.summary-box { margin-top: 16px; max-height: 420px; min-height: 220px; overflow: auto; padding: 16px; border-radius: 14px; background: var(--color-surface-soft); color: var(--color-text-muted); line-height: 1.8; }
.section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.meta-line { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; color: var(--color-text-muted); font-size: 13px; }
.summary-content { white-space: pre-wrap; word-break: break-word; line-height: 1.8; color: var(--color-text-main); min-height: 64px; }
.keyword-tags { display: flex; flex-wrap: wrap; gap: 10px; }
.chunk-content {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  word-break: break-word;
  line-height: 1.6;
}
.chunk-dialog-meta p { margin: 0 0 8px; color: var(--color-text-muted); }
.chunk-dialog-content {
  margin-top: 8px;
  padding: 12px;
  border-radius: 8px;
  background: var(--color-surface-soft);
  word-break: break-word;
  max-height: 420px;
  overflow: auto;
}
.markdown-body :deep(p),
.markdown-body :deep(ul),
.markdown-body :deep(ol),
.markdown-body :deep(pre),
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin: 0 0 8px;
}
.markdown-body :deep(pre) {
  background: #111827;
  color: #f9fafb;
  border-radius: 8px;
  padding: 10px;
  overflow-x: auto;
}
.markdown-body :deep(code) {
  background: #f3f4f6;
  border-radius: 4px;
  padding: 1px 4px;
}
.pagination-row { display: flex; justify-content: flex-end; margin-top: 16px; }
@media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }
</style>
