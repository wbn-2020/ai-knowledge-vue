<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteAdminDocument, getAdminDocument, getAdminDocumentChunks, retryAdminDocument } from '@/api/knowledge'
import type { DocumentItem } from '@/types'
import { documentErrorOf, documentNameOf, embeddingStatusText, fileSizeOf, fileTypeOf, kbNameOf, parseStatusText, statusTagType, timeOf } from '@/utils/view-adapters'

const route = useRoute()
const doc = ref<DocumentItem | null>(null)
const loading = ref(false)
const chunkLoading = ref(false)
const chunks = ref<any[]>([])
const chunkDialogVisible = ref(false)
const activeChunk = ref<any | null>(null)
const chunkPager = reactive({ pageNo: 1, pageSize: 10, total: 0 })

async function loadChunks(id: number) {
  chunkLoading.value = true
  try {
    const data = await getAdminDocumentChunks(id, { pageNo: chunkPager.pageNo, pageSize: chunkPager.pageSize })
    chunks.value = data?.list || []
    chunkPager.total = data?.total || 0
    chunkPager.pageNo = data?.pageNo || chunkPager.pageNo
    chunkPager.pageSize = data?.pageSize || chunkPager.pageSize
  } catch {
    chunks.value = []
  } finally {
    chunkLoading.value = false
  }
}

async function loadDetail() {
  loading.value = true
  try {
    const id = Number(route.params.id)
    doc.value = await getAdminDocument(id)
    await loadChunks(id)
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

function openChunkDialog(row: any) {
  activeChunk.value = row
  chunkDialogVisible.value = true
}

onMounted(loadDetail)
</script>

<template>
  <div v-loading="loading">
    <div class="page-header">
      <div>
        <h1 class="page-title">后台文档详情</h1>
        <div class="page-desc">查看文档元数据、失败原因、状态和重试入口。</div>
      </div>
    </div>
    <div v-if="doc" class="detail-grid">
      <section class="soft-card">
        <div class="soft-card-body">
          <h2>{{ documentNameOf(doc) }}</h2>
          <div class="meta-grid">
            <div><span>知识库</span><strong>{{ kbNameOf(doc) }}</strong></div>
            <div><span>类型</span><strong>{{ fileTypeOf(doc) }}</strong></div>
            <div><span>大小</span><strong>{{ fileSizeOf(doc) }}</strong></div>
            <div><span>解析状态</span><el-tag :type="statusTagType(doc.parseStatus)">{{ parseStatusText(doc.parseStatus) }}</el-tag></div>
            <div><span>向量状态</span><el-tag :type="statusTagType(doc.embeddingStatus)" effect="plain">{{ embeddingStatusText(doc.embeddingStatus) }}</el-tag></div>
            <div><span>更新时间</span><strong>{{ timeOf(doc) }}</strong></div>
            <div><span>上传用户</span><strong>{{ (doc as any).ownerName || (doc as any).username || '-' }}</strong></div>
            <div><span>分块数量</span><strong>{{ (doc as any).chunkCount || (doc as any).segmentCount || 0 }}</strong></div>
            <div><span>失败原因</span><strong>{{ documentErrorOf(doc) || '-' }}</strong></div>
          </div>
        </div>
      </section>
      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">操作</h3>
          <div class="action-list">
            <el-button type="warning" @click="retry">重新解析</el-button>
            <el-button type="danger" @click="remove">删除文档</el-button>
          </div>
        </div>
      </section>
    </div>

    <section v-if="doc" class="soft-card chunk-section">
      <div class="soft-card-body">
        <h3 class="section-title">文档切片</h3>
        <el-table :data="chunks" v-loading="chunkLoading" size="large" empty-text="当前文档暂无切片，可能还未完成解析或向量化">
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
        <div class="chunk-dialog-content">{{ activeChunk.content || '-' }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.detail-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 16px;
}

h2 {
  margin: 0 0 18px;
  font-size: 28px;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.meta-grid span {
  display: block;
  color: var(--color-text-muted);
  font-size: 13px;
}

.meta-grid strong {
  display: block;
  margin-top: 6px;
}

.action-list {
  display: grid;
  gap: 10px;
}

.chunk-section {
  margin-top: 16px;
}

.chunk-content {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  word-break: break-word;
  line-height: 1.6;
}

.chunk-dialog-meta p {
  margin: 0 0 8px;
  color: var(--color-text-muted);
}

.chunk-dialog-content {
  margin-top: 8px;
  padding: 12px;
  border-radius: 8px;
  background: var(--color-surface-soft);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 420px;
  overflow: auto;
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
