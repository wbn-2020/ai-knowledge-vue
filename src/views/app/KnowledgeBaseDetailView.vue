<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  deleteKnowledgeBase,
  extractKnowledgeBaseKeywords,
  generateKnowledgeBaseSummary,
  getDocumentPage,
  getKnowledgeBaseDetail,
  getKnowledgeBaseKeywords,
  getKnowledgeBaseSummary,
  reextractKnowledgeBaseKeywords,
  regenerateKnowledgeBaseSummary,
  retryDocument,
} from '@/api/knowledge'
import type { ChatSession, DocumentItem, KnowledgeBase, KeywordVO, KnowledgeBaseSummaryVO } from '@/types'
import { docCountOf, documentErrorOf, documentNameOf, fileSizeOf, fileTypeOf, formatDateTimeValue, statusTagType, textOf, timeOf } from '@/utils/view-adapters'

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

const kbSummaryLoading = ref(false)
const kbSummaryActionLoading = ref(false)
const kbKeywordLoading = ref(false)
const kbKeywordActionLoading = ref(false)
const kbSummary = ref<KnowledgeBaseSummaryVO | null>(null)
const kbKeywords = ref<KeywordVO[]>([])

const kbId = computed(() => Number(route.params.id))
const isValidKbId = computed(() => Number.isFinite(kbId.value) && kbId.value > 0)
const hasKbSummary = computed(() => Boolean(String(kbSummary.value?.summary || '').trim()))
const hasKbKeywords = computed(() => kbKeywords.value.length > 0)

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

async function loadKbUnderstanding() {
  if (!isValidKbId.value) {
    kbSummary.value = null
    kbKeywords.value = []
    return
  }
  kbSummaryLoading.value = true
  kbKeywordLoading.value = true
  try {
    const [summary, keywords] = await Promise.all([
      getKnowledgeBaseSummary(kbId.value).catch(() => null),
      getKnowledgeBaseKeywords(kbId.value).catch(() => [] as KeywordVO[]),
    ])
    kbSummary.value = summary || null
    kbKeywords.value = normalizeKeywords(keywords || [])
  } finally {
    kbSummaryLoading.value = false
    kbKeywordLoading.value = false
  }
}

async function refreshAll() {
  await Promise.all([loadDetail(), loadDocuments(), loadKbUnderstanding()])
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
  await ElMessageBox.confirm(`确认删除知识库“${kb.value.name}”吗？删除后不可恢复。`, '删除确认', { type: 'warning' })
  await deleteKnowledgeBase(kb.value.id)
  ElMessage.success('知识库已删除')
  router.push('/app/knowledge')
}

async function retryParse(row: DocumentItem) {
  await retryDocument(row.id)
  ElMessage.success('已提交重新解析任务')
  await loadDocuments()
}

async function handleGenerateKbSummary(regenerate = false) {
  if (!isValidKbId.value) return
  kbSummaryActionLoading.value = true
  try {
    if (regenerate) {
      await regenerateKnowledgeBaseSummary(kbId.value)
      ElMessage.success('已提交重新生成知识库摘要')
    } else {
      await generateKnowledgeBaseSummary(kbId.value)
      ElMessage.success('已提交生成知识库摘要')
    }
    kbSummary.value = await getKnowledgeBaseSummary(kbId.value)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '知识库摘要操作失败，请稍后重试')
  } finally {
    kbSummaryActionLoading.value = false
  }
}

async function handleExtractKbKeywords(reextract = false) {
  if (!isValidKbId.value) return
  kbKeywordActionLoading.value = true
  try {
    const list = reextract ? await reextractKnowledgeBaseKeywords(kbId.value) : await extractKnowledgeBaseKeywords(kbId.value)
    ElMessage.success(reextract ? '已重新提取知识库关键词' : '已提取知识库关键词')
    kbKeywords.value = normalizeKeywords(list || [])
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '知识库关键词操作失败，请稍后重试')
  } finally {
    kbKeywordActionLoading.value = false
  }
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

      <div class="understanding-grid">
        <section class="soft-card">
          <div class="soft-card-body" v-loading="kbSummaryLoading">
            <div class="section-head">
              <h3 class="section-title">知识库理解 · 摘要</h3>
              <el-button type="primary" plain :loading="kbSummaryActionLoading" @click="handleGenerateKbSummary(hasKbSummary)">
                {{ hasKbSummary ? '重新生成' : '生成知识库摘要' }}
              </el-button>
            </div>
            <div class="meta-line">
              <span>状态：{{ textOf(kbSummary?.status) }}</span>
              <span>覆盖文档数：{{ textOf(kbSummary?.coveredDocumentCount, '0') }}</span>
              <span>模型：{{ textOf(kbSummary?.modelName) }}</span>
              <span>生成时间：{{ formatDateTimeValue(kbSummary?.generatedAt) }}</span>
            </div>
            <el-alert
              v-if="kbSummary?.errorMessage"
              type="error"
              show-icon
              :closable="false"
              :title="textOf(kbSummary?.errorMessage, '知识库摘要生成失败')"
            />
            <div class="summary-content">{{ textOf(kbSummary?.summary, '暂无知识库摘要') }}</div>
          </div>
        </section>

        <section class="soft-card">
          <div class="soft-card-body" v-loading="kbKeywordLoading">
            <div class="section-head">
              <h3 class="section-title">知识库理解 · 关键词</h3>
              <el-button type="primary" plain :loading="kbKeywordActionLoading" @click="handleExtractKbKeywords(hasKbKeywords)">
                {{ hasKbKeywords ? '重新提取' : '提取关键词' }}
              </el-button>
            </div>
            <el-empty v-if="!kbKeywords.length" description="暂无关键词" :image-size="80" />
            <div v-else class="keyword-tags">
              <el-tag v-for="(item, index) in kbKeywords" :key="`${item.keyword || 'keyword'}-${index}`" round>
                {{ textOf(item.keyword, '-') }}
                <template v-if="weightText(item.weight)"> {{ weightText(item.weight) }} </template>
              </el-tag>
            </div>
          </div>
        </section>
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
.understanding-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 16px; }
.detail-grid { grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.7fr); }
.section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.meta-line { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; color: var(--color-text-muted); font-size: 13px; }
.summary-content { white-space: pre-wrap; word-break: break-word; line-height: 1.8; color: var(--color-text-main); min-height: 64px; }
.keyword-tags { display: flex; flex-wrap: wrap; gap: 10px; }
.document-panel { min-width: 0; }
.pagination-row { display: flex; justify-content: flex-end; margin-top: 16px; }
.question-stack { display: grid; gap: 12px; }
.question-card { padding: 14px; border-radius: 12px; border: 1px solid var(--color-border); cursor: pointer; }
.question-card p, .question-card span { display: block; margin: 6px 0 0; color: var(--color-text-muted); font-size: 13px; }
@media (max-width: 1100px) {
  .hero-inner,
  .understanding-grid,
  .detail-grid { grid-template-columns: 1fr; }
  .hero-actions { justify-content: flex-start; }
}
</style>
