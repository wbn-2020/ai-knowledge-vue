<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  deleteAdminDocument,
  downloadAdminDocument,
  getAdminDocuments,
  getAdminKnowledgeBases,
  retryAdminDocument,
} from '@/api/knowledge'
import type { DocumentItem, KnowledgeBase } from '@/types'
import {
  documentErrorOf,
  documentNameOf,
  embeddingStatusText,
  fileSizeOf,
  fileTypeOf,
  kbNameOf,
  parseStatusText,
  statusTagType,
  textOf,
  timeDisplayOf,
} from '@/utils/view-adapters'

const loading = ref(false)
const docs = ref<DocumentItem[]>([])
const knowledgeBases = ref<KnowledgeBase[]>([])
const keyword = ref('')
const knowledgeBaseId = ref<number>()
const parseStatus = ref('')
const embeddingStatus = ref('')
const fileType = ref('')
const username = ref('')
const pager = reactive({ pageNo: 1, pageSize: 10, total: 0 })

const fileTypeOptions = [
  { label: '全部', value: '' },
  { label: 'PDF', value: 'PDF' },
  { label: 'DOCX', value: 'DOCX' },
  { label: 'TXT', value: 'TXT' },
  { label: 'MD', value: 'MD' },
]

const embeddingStatusOptions = [
  { label: '全部', value: '' },
  { label: '待向量化', value: 'PENDING' },
  { label: '向量化中', value: 'PROCESSING' },
  { label: '向量化成功', value: 'SUCCESS' },
  { label: '向量化失败', value: 'FAILED' },
]

function extractErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  const maybeAxios = error as any
  const backendMessage = maybeAxios?.response?.data?.message || maybeAxios?.response?.data?.msg
  return backendMessage ? String(backendMessage) : fallback
}

function preferredDownloadName(row: any) {
  return row?.originalName || row?.documentName || row?.name || `document-${row?.id ?? 'unknown'}`
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function loadKnowledgeBases() {
  const data = await getAdminKnowledgeBases({ pageNo: 1, pageSize: 100 })
  knowledgeBases.value = data?.list || []
}

async function loadDocs() {
  loading.value = true
  try {
    const data = await getAdminDocuments({
      keyword: keyword.value || undefined,
      knowledgeBaseId: knowledgeBaseId.value,
      parseStatus: parseStatus.value || undefined,
      embeddingStatus: embeddingStatus.value || undefined,
      fileType: fileType.value || undefined,
      username: username.value || undefined,
      pageNo: pager.pageNo,
      pageSize: pager.pageSize,
    })
    docs.value = data?.list || []
    pager.total = data?.total || 0
    pager.pageNo = data?.pageNo || pager.pageNo
    pager.pageSize = data?.pageSize || pager.pageSize
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, '文档列表加载失败'))
  } finally {
    loading.value = false
  }
}

async function retry(row: DocumentItem) {
  await ElMessageBox.confirm(`确认重新解析文档「${documentNameOf(row)}」吗？`, '重试解析', { type: 'warning' })
  await retryAdminDocument(row.id)
  ElMessage.success('已提交重新解析')
  await loadDocs()
}

async function remove(row: DocumentItem) {
  await ElMessageBox.confirm(`确认删除文档「${documentNameOf(row)}」吗？`, '删除确认', { type: 'warning' })
  await deleteAdminDocument(row.id)
  ElMessage.success('文档已删除')
  if (docs.value.length === 1 && pager.pageNo > 1) pager.pageNo -= 1
  await loadDocs()
}

async function download(row: DocumentItem) {
  try {
    const response: any = await downloadAdminDocument(row.id)
    const blob = response?.data instanceof Blob ? response.data : new Blob([response?.data ?? ''])
    triggerDownload(blob, preferredDownloadName(row))
    ElMessage.success('下载已开始')
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, '下载失败'))
  }
}

watch([keyword, knowledgeBaseId, parseStatus, embeddingStatus, fileType, username], () => {
  pager.pageNo = 1
  loadDocs()
})

onMounted(() => {
  loadKnowledgeBases()
  loadDocs()
})
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">后台文档管理</h1>
        <div class="page-desc">查看平台文档、解析状态、向量状态和失败重试入口。</div>
      </div>
      <el-button plain :loading="loading" @click="loadDocs"><el-icon><Refresh /></el-icon>刷新</el-button>
    </div>

    <div class="toolbar">
      <el-input v-model="keyword" placeholder="搜索文档名称" clearable style="max-width: 280px" />
      <el-select v-model="knowledgeBaseId" placeholder="所属知识库" clearable style="width: 220px">
        <el-option v-for="kb in knowledgeBases" :key="kb.id" :label="textOf(kb.name)" :value="kb.id" />
      </el-select>
      <el-select v-model="parseStatus" placeholder="解析状态" clearable style="width: 150px">
        <el-option label="待解析" value="PENDING" />
        <el-option label="解析中" value="PARSING" />
        <el-option label="解析成功" value="SUCCESS" />
        <el-option label="解析失败" value="FAILED" />
      </el-select>
      <el-select v-model="embeddingStatus" placeholder="向量状态" clearable style="width: 170px">
        <el-option v-for="item in embeddingStatusOptions" :key="item.value || 'all'" :label="item.label" :value="item.value" />
      </el-select>
      <el-select v-model="fileType" placeholder="文件类型" clearable style="width: 120px">
        <el-option v-for="item in fileTypeOptions" :key="item.label" :label="item.label" :value="item.value" />
      </el-select>
      <el-input v-model="username" placeholder="上传账号" clearable style="width: 140px" />
    </div>

    <section class="soft-card">
      <div class="soft-card-body">
        <el-table :data="docs" v-loading="loading" size="large" empty-text="暂无文档">
          <el-table-column label="文档名称" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">{{ documentNameOf(row) }}</template>
          </el-table-column>
          <el-table-column label="知识库" width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ kbNameOf(row) }}</template>
          </el-table-column>
          <el-table-column label="上传人" width="120">
            <template #default="{ row }">{{ (row as any).ownerName || (row as any).username || '-' }}</template>
          </el-table-column>
          <el-table-column label="类型" width="90">
            <template #default="{ row }">{{ fileTypeOf(row) }}</template>
          </el-table-column>
          <el-table-column label="大小" width="110">
            <template #default="{ row }">{{ fileSizeOf(row) }}</template>
          </el-table-column>
          <el-table-column label="分块数" width="100">
            <template #default="{ row }">{{ (row as any).chunkCount || (row as any).segmentCount || 0 }}</template>
          </el-table-column>
          <el-table-column label="解析状态" width="120">
            <template #default="{ row }"><el-tag :type="statusTagType(row?.parseStatus)">{{ parseStatusText(row?.parseStatus) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="向量状态" width="120">
            <template #default="{ row }"><el-tag :type="statusTagType(row?.embeddingStatus)" effect="plain">{{ embeddingStatusText(row?.embeddingStatus) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="失败原因" min-width="190" show-overflow-tooltip>
            <template #default="{ row }">{{ textOf(documentErrorOf(row)) }}</template>
          </el-table-column>
          <el-table-column label="更新时间" width="190">
            <template #default="{ row }"><span class="time-cell">{{ timeDisplayOf(row) }}</span></template>
          </el-table-column>
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="$router.push(`/admin/documents/${row.id}`)">详情</el-button>
              <el-button link type="primary" @click="download(row)">下载</el-button>
              <el-button v-if="String(row.parseStatus).toUpperCase() === 'FAILED'" link type="warning" @click="retry(row)">重新解析</el-button>
              <el-button link type="danger" @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-row">
          <el-pagination
            v-model:current-page="pager.pageNo"
            v-model:page-size="pager.pageSize"
            layout="total, sizes, prev, pager, next"
            :page-sizes="[10, 20, 50]"
            :total="pager.total"
            @size-change="pager.pageNo = 1; loadDocs()"
            @current-change="loadDocs"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.time-cell {
  white-space: nowrap;
}
</style>
