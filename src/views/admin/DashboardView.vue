<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getAdminDashboardOverview } from '@/api/knowledge'
import { documentNameOf, textOf, timeDisplayOf } from '@/utils/view-adapters'

const loading = ref(false)
const overview = ref<any>({})

const recentUsers = computed(() => {
  const list = overview.value?.recentUsers ?? overview.value?.latestUsers ?? overview.value?.recentUserList
  return Array.isArray(list) ? list : []
})

const recentDocuments = computed(() => {
  const list = overview.value?.recentDocuments ?? overview.value?.latestDocuments ?? overview.value?.recentDocumentList
  return Array.isArray(list) ? list : []
})

const recentFailedTasks = computed(() => {
  const list = overview.value?.recentFailedTasks ?? overview.value?.failedTasks ?? overview.value?.latestFailedTasks
  return Array.isArray(list) ? list : []
})

const recentAiErrors = computed(() => {
  const list = overview.value?.recentAiErrors ?? overview.value?.aiErrors ?? overview.value?.latestAiErrors
  return Array.isArray(list) ? list : []
})

const recentKnowledgeBases = computed(() => {
  const list =
    overview.value?.recentKnowledgeBases ??
    overview.value?.recentKnowledgeBasesList ??
    overview.value?.latestKnowledgeBases
  return Array.isArray(list) ? list : []
})

const aiCallTotal = computed(() =>
  Number(
    overview.value?.aiCallCount ??
      overview.value?.aiCalls ??
      overview.value?.totalAiCalls ??
      overview.value?.aiCallTotal ??
      overview.value?.qaCount ??
      0,
  ),
)

const userTotal = computed(() => Number(overview.value?.userCount ?? overview.value?.totalUsers ?? 0))
const knowledgeBaseTotal = computed(
  () => Number(overview.value?.knowledgeBaseCount ?? overview.value?.kbCount ?? overview.value?.totalKnowledgeBases ?? 0),
)
const documentTotal = computed(() => Number(overview.value?.documentCount ?? overview.value?.totalDocuments ?? 0))

const metrics = computed(() => [
  { label: '平台用户', value: userTotal.value, hint: '已注册用户总数' },
  { label: '知识库总数', value: knowledgeBaseTotal.value, hint: '全平台知识库' },
  { label: '文档总数', value: documentTotal.value, hint: '上传文档规模' },
  { label: 'AI 调用次数', value: aiCallTotal.value, hint: '问答与摘要调用' },
])

function failedTaskMessageOf(row: any) {
  return textOf(row?.message ?? row?.info ?? row?.failureReason ?? row?.reason ?? row?.documentName)
}

async function loadOverview() {
  loading.value = true
  try {
    overview.value = (await getAdminDashboardOverview()) || {}
  } finally {
    loading.value = false
  }
}

onMounted(loadOverview)
</script>

<template>
  <div v-loading="loading">
    <div class="page-header">
      <div>
        <h1 class="page-title">后台数据看板</h1>
        <div class="page-desc">展示平台用户、知识库、文档处理和 AI 调用的核心指标。</div>
      </div>
    </div>

    <div class="metric-grid">
      <div v-for="item in metrics" :key="item.label" class="stat-tile">
        <div class="stat-label">{{ item.label }}</div>
        <div class="stat-value">{{ item.value }}</div>
        <div class="muted">{{ item.hint }}</div>
      </div>
    </div>

    <div class="section-grid admin-grid">
      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">最近文档</h3>
          <el-table :data="recentDocuments" empty-text="暂无文档">
            <el-table-column label="文档" min-width="220" show-overflow-tooltip>
              <template #default="{ row }">{{ documentNameOf(row) }}</template>
            </el-table-column>
            <el-table-column prop="parseStatus" label="解析" width="120" />
            <el-table-column prop="embeddingStatus" label="向量化" width="120" />
            <el-table-column label="时间" width="180">
              <template #default="{ row }">{{ timeDisplayOf(row) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </section>

      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">最近知识库</h3>
          <div v-for="kb in recentKnowledgeBases" :key="kb.id || kb.knowledgeBaseId || kb.name" class="admin-row">
            <span>{{ kb.icon || 'K' }}</span>
            <div>
              <strong>{{ kb.name || kb.knowledgeBaseName || '-' }}</strong>
              <p>{{ kb.status || '-' }} · {{ timeDisplayOf(kb) }}</p>
            </div>
          </div>
          <el-empty v-if="!recentKnowledgeBases.length" description="暂无知识库" />
        </div>
      </section>

      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">最近用户</h3>
          <el-table :data="recentUsers" empty-text="暂无用户">
            <el-table-column prop="username" label="账号" min-width="140" />
            <el-table-column prop="role" label="角色" width="100" />
            <el-table-column label="时间" width="180">
              <template #default="{ row }">{{ timeDisplayOf(row, ['lastLoginTime', 'updatedAt', 'updateTime', 'createdAt', 'createTime']) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </section>

      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">失败任务与 AI 异常</h3>
          <el-table :data="[...recentFailedTasks, ...recentAiErrors]" empty-text="暂无异常">
            <el-table-column prop="taskType" label="类型" min-width="140" />
            <el-table-column label="信息" min-width="220" show-overflow-tooltip>
              <template #default="{ row }">{{ failedTaskMessageOf(row) }}</template>
            </el-table-column>
            <el-table-column label="时间" width="180">
              <template #default="{ row }">{{ timeDisplayOf(row) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.admin-grid {
  margin-top: 16px;
  grid-template-columns: 1fr 1fr;
}

.admin-row {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  margin-bottom: 10px;
}

.admin-row span {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--color-primary-weak);
}

.admin-row p {
  margin: 4px 0 0;
  color: var(--color-text-muted);
}
</style>
