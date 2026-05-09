<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteKnowledgeBase, getDocumentPage, getKnowledgeBaseDetail, retryDocument } from '@/api/knowledge'
import type { ChatSession, DocumentItem, KnowledgeBase } from '@/types'
import { docCountOf, documentErrorOf, documentNameOf, fileSizeOf, fileTypeOf, statusTagType, timeOf } from '@/utils/view-adapters'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const docLoading = ref(false)
const kb = ref<KnowledgeBase | null>(null)
const documents = ref<DocumentItem[]>([])
const recentSessions = ref<ChatSession[]>([])
const processingStatus = ref('NORMAL')
const invalidKb = ref(false)
const docPager = reactive({ pageNo: 1, pageSize: 10, total: 0 })

const kbId = computed(() => Number(route.params.id))
const isValidKbId = computed(() => Number.isFinite(kbId.value) && kbId.value > 0)

async function loadDetail() {
  if (!isValidKbId.value) {
    invalidKb.value = true
    kb.value = null
    return
  }
  loading.value = true
  try {
    const data = await getKnowledgeBaseDetail(kbId.value)
    kb.value = data.knowledgeBase
    recentSessions.value = data.recentSessions || []
    processingStatus.value = data.processingStatus || data.knowledgeBase?.status || 'NORMAL'
  } finally {
    loading.value = false
  }
}

async function loadDocuments() {
  if (!isValidKbId.value) {
    documents.value = []
    docPager.total = 0
    return
  }
  docLoading.value = true
  try {
    const data = await getDocumentPage({
      knowledgeBaseId: kbId.value,
      pageNo: docPager.pageNo,
      pageSize: docPager.pageSize,
    })
    documents.value = data.list || []
    docPager.total = data.total || 0
    docPager.pageNo = data.pageNo || docPager.pageNo
    docPager.pageSize = data.pageSize || docPager.pageSize
  } finally {
    docLoading.value = false
  }
}

async function refreshAll() {
  await Promise.all([loadDetail(), loadDocuments()])
}

function uploadForCurrentKb() {
  if (!isValidKbId.value) return
  router.push({ path: '/app/documents', query: { knowledgeBaseId: String(kbId.value), upload: '1' } })
}

function askInCurrentKb() {
  if (!isValidKbId.value) return
  router.push({ path: '/app/chat', query: { knowledgeBaseId: String(kbId.value) } })
}

async function removeKnowledgeBase() {
  if (!kb.value) return
  await ElMessageBox.confirm(`确认删除知识库「${kb.value.name}」吗？删除后不可恢复。`, '删除确认', { type: 'warning' })
  await deleteKnowledgeBase(kb.value.id)
  ElMessage.success('知识库已删除')
  router.push('/app/knowledge')
}

async function retryParse(row: DocumentItem) {
  await retryDocument(row.id)
  ElMessage.success('已提交重新解析任务')
  await loadDocuments()
}

onMounted(refreshAll)
</script>

<template>
  <div v-loading="loading">
    <el-empty v-if="invalidKb" description="无效知识库">
      <el-button type="primary" @click="router.push('/app/knowledge')">返回知识库列表</el-button>
    </el-empty>

    <template v-else-if="kb">
      <div class="detail-hero soft-card">
        <div class="soft-card-body hero-inner">
          <div class="kb-mark">{{ kb.icon || 'K' }}</div>
          <div class="hero-content">
            <span class="subtle-badge">{{ kb.category || '未分类' }}</span>
            <h1>{{ kb.name }}</h1>
            <p>{{ kb.description || '暂无简介' }}</p>
            <div class="hero-meta">
              <span>{{ docCountOf(kb) }} 个文档</span>
              <span>状态：{{ processingStatus }}</span>
              <span>更新：{{ timeOf(kb) }}</span>
            </div>
          </div>
          <div class="hero-actions">
            <el-button plain @click="refreshAll"><el-icon><Refresh /></el-icon>刷新状态</el-button>
            <el-button plain @click="router.push(`/app/knowledge/${kb.id}/edit`)">编辑</el-button>
            <el-button plain type="danger" @click="removeKnowledgeBase">删除</el-button>
            <el-button plain @click="uploadForCurrentKb"><el-icon><Upload /></el-icon>上传文档</el-button>
            <el-button type="primary" @click="askInCurrentKb"><el-icon><ChatDotRound /></el-icon>基于此库提问</el-button>
          </div>
        </div>
      </div>

      <div class="section-grid detail-grid">
        <section class="soft-card document-panel">
          <div class="soft-card-body">
            <div class="section-head">
              <h3 class="section-title">知识库文档</h3>
              <el-button plain :loading="docLoading" @click="loadDocuments"><el-icon><Refresh /></el-icon>刷新解析状态</el-button>
            </div>
            <el-table :data="documents" v-loading="docLoading" empty-text="暂无文档" size="large">
              <el-table-column label="文档名称" min-width="240" show-overflow-tooltip>
                <template #default="{ row }">{{ documentNameOf(row) }}</template>
              </el-table-column>
              <el-table-column label="类型" width="90"><template #default="{ row }">{{ fileTypeOf(row) }}</template></el-table-column>
              <el-table-column label="大小" width="110"><template #default="{ row }">{{ fileSizeOf(row) }}</template></el-table-column>
              <el-table-column label="解析状态" width="120">
                <template #default="{ row }"><el-tag :type="statusTagType(row.parseStatus)">{{ row.parseStatus || '-' }}</el-tag></template>
              </el-table-column>
              <el-table-column label="向量状态" width="120">
                <template #default="{ row }"><el-tag :type="statusTagType(row.embeddingStatus)" effect="plain">{{ row.embeddingStatus || '-' }}</el-tag></template>
              </el-table-column>
              <el-table-column label="失败原因" min-width="170" show-overflow-tooltip>
                <template #default="{ row }">{{ documentErrorOf(row) || '-' }}</template>
              </el-table-column>
              <el-table-column label="更新时间" width="170"><template #default="{ row }">{{ timeOf(row) }}</template></el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="router.push(`/app/documents/${row.id}`)">详情</el-button>
                  <el-button v-if="row.parseStatus === 'FAILED'" link type="warning" @click="retryParse(row)">重试</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="pagination-row">
              <el-pagination
                v-model:current-page="docPager.pageNo"
                v-model:page-size="docPager.pageSize"
                layout="total, sizes, prev, pager, next"
                :page-sizes="[10, 20, 50]"
                :total="docPager.total"
                @size-change="docPager.pageNo = 1; loadDocuments()"
                @current-change="loadDocuments"
              />
            </div>
          </div>
        </section>

        <section class="soft-card">
          <div class="soft-card-body">
            <h3 class="section-title">最近问答</h3>
            <el-empty v-if="!recentSessions.length" description="暂无会话" />
            <div v-else class="question-stack">
              <div v-for="session in recentSessions" :key="session.id" class="question-card" @click="router.push(`/app/history/${session.id}`)">
                <strong>{{ session.latestQuestion || session.title }}</strong>
                <p>{{ session.title }}</p>
                <span>{{ timeOf(session) }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </template>

    <el-empty v-else-if="!loading" description="知识库不存在" />
  </div>
</template>

<style scoped lang="scss">
.detail-hero { margin-bottom: 16px; }
.hero-inner { display: grid; grid-template-columns: 76px 1fr auto; gap: 18px; align-items: center; }
.kb-mark { width: 76px; height: 76px; display: grid; place-items: center; border-radius: 22px; background: var(--color-primary-weak); font-size: 34px; }
h1 { margin: 12px 0 8px; font-size: 32px; }
.hero-content p { color: var(--color-text-muted); margin: 0; }
.hero-meta { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 14px; color: var(--color-text-muted); font-size: 13px; }
.hero-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; }
.detail-grid { grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.7fr); }
.section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.document-panel { min-width: 0; }
.pagination-row { display: flex; justify-content: flex-end; margin-top: 16px; }
.question-stack { display: grid; gap: 12px; }
.question-card { padding: 14px; border-radius: 12px; border: 1px solid var(--color-border); cursor: pointer; }
.question-card p, .question-card span { display: block; margin: 6px 0 0; color: var(--color-text-muted); font-size: 13px; }
@media (max-width: 1100px) { .hero-inner, .detail-grid { grid-template-columns: 1fr; } .hero-actions { justify-content: flex-start; } }
</style>
