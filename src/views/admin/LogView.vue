<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { exportAdminLog, getAiCallLogs, getAlerts, getLoginLogs, getOperationLogs } from '@/api/knowledge'
import type { AiCallLog, LogAlert, LoginLog, OperationLog } from '@/types'
import { textOf } from '@/utils/view-adapters'

type LogTab = 'operations' | 'logins' | 'ai-calls'

const activeTab = ref<LogTab>('operations')
const loading = ref(false)
const exporting = ref(false)
const errorMessage = ref('')
const alerts = ref<LogAlert[]>([])
const alertLoading = ref(false)
const rows = ref<Array<OperationLog | LoginLog | AiCallLog>>([])
const pager = reactive({ pageNo: 1, pageSize: 10, total: 0 })

const filters = reactive({
  action: '',
  userId: '',
  account: '',
  success: '',
  modelName: '',
  callType: '',
  startTime: '',
  endTime: '',
})

const tabTitle = computed(() => {
  if (activeTab.value === 'operations') return '操作日志'
  if (activeTab.value === 'logins') return '登录日志'
  return 'AI 调用日志'
})

function cleanParams(params: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null))
}

function queryParams(includePage = true) {
  const base = {
    startTime: filters.startTime,
    endTime: filters.endTime,
    ...(includePage ? { pageNo: pager.pageNo, pageSize: pager.pageSize } : {}),
  }

  if (activeTab.value === 'operations') return cleanParams({ ...base, action: filters.action, userId: filters.userId })
  if (activeTab.value === 'logins') return cleanParams({ ...base, account: filters.account, success: filters.success })
  return cleanParams({ ...base, modelName: filters.modelName, callType: filters.callType, success: filters.success })
}

async function loadAlerts() {
  alertLoading.value = true
  try {
    const data = await getAlerts()
    alerts.value = Array.isArray(data) ? data : []
  } finally {
    alertLoading.value = false
  }
}

async function loadLogs() {
  loading.value = true
  errorMessage.value = ''
  try {
    const params = queryParams()
    const data =
      activeTab.value === 'operations'
        ? await getOperationLogs(params)
        : activeTab.value === 'logins'
          ? await getLoginLogs(params)
          : await getAiCallLogs(params)
    rows.value = data?.list || []
    pager.total = data?.total || 0
    pager.pageNo = data?.pageNo || pager.pageNo
    pager.pageSize = data?.pageSize || pager.pageSize
  } catch (error) {
    rows.value = []
    pager.total = 0
    errorMessage.value = error instanceof Error ? error.message : '日志加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  Object.assign(filters, {
    action: '',
    userId: '',
    account: '',
    success: '',
    modelName: '',
    callType: '',
    startTime: '',
    endTime: '',
  })
  pager.pageNo = 1
  loadLogs()
}

function formatTime(row: any) {
  return textOf(row?.createTime || row?.createdAt || row?.time)
}

function resultType(row: any) {
  if (typeof row?.success === 'boolean') return row.success ? 'success' : 'danger'
  const value = String(row?.result || '').toUpperCase()
  return value === 'SUCCESS' || value === '成功' ? 'success' : 'warning'
}

function resultText(row: any) {
  if (typeof row?.success === 'boolean') return row.success ? '成功' : '失败'
  return textOf(row?.result)
}

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

async function exportCsv() {
  exporting.value = true
  try {
    const response = await exportAdminLog(activeTab.value, queryParams(false))
    downloadBlob(response, `${activeTab.value}-logs.csv`)
    ElMessage.success('日志已导出')
  } finally {
    exporting.value = false
  }
}

watch(activeTab, () => {
  pager.pageNo = 1
  loadLogs()
})

onMounted(() => {
  loadAlerts()
  loadLogs()
})
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">日志审计</h1>
        <div class="page-desc">查询登录、操作和 AI 调用链路，快速定位失败请求和异常趋势。</div>
      </div>
      <el-button :loading="exporting" type="primary" @click="exportCsv">
        <el-icon><Download /></el-icon>
        导出 CSV
      </el-button>
    </div>

    <section class="alert-grid" v-loading="alertLoading">
      <article v-for="item in alerts" :key="textOf(item.type)" class="soft-card alert-card">
        <div class="soft-card-body">
          <div class="alert-head">
            <span>{{ textOf(item.type) }}</span>
            <el-tag :type="item.level === 'OK' ? 'success' : item.level === 'WARN' ? 'warning' : 'danger'" effect="plain">
              {{ textOf(item.level) }}
            </el-tag>
          </div>
          <strong>{{ Number(item.failureRate || 0).toFixed(2) }}%</strong>
          <p>{{ textOf(item.message) }}</p>
          <div class="alert-meta">总数 {{ item.total || 0 }} / 失败 {{ item.failed || 0 }}</div>
        </div>
      </article>
      <article v-if="!alertLoading && !alerts.length" class="soft-card alert-card">
        <div class="soft-card-body">
          <div class="alert-head"><span>告警统计</span><el-tag type="info" effect="plain">暂无</el-tag></div>
          <strong>0.00%</strong>
          <p>暂无告警统计数据。</p>
          <div class="alert-meta">等待后端返回统计结果</div>
        </div>
      </article>
    </section>

    <section class="soft-card">
      <div class="soft-card-body">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="操作日志" name="operations" />
          <el-tab-pane label="登录日志" name="logins" />
          <el-tab-pane label="AI 调用日志" name="ai-calls" />
        </el-tabs>

        <div class="filter-bar">
          <template v-if="activeTab === 'operations'">
            <el-input v-model="filters.action" clearable placeholder="操作动作" />
            <el-input v-model="filters.userId" clearable placeholder="用户 ID" />
          </template>
          <template v-else-if="activeTab === 'logins'">
            <el-input v-model="filters.account" clearable placeholder="登录账号" />
            <el-select v-model="filters.success" clearable placeholder="登录结果">
              <el-option label="成功" value="true" />
              <el-option label="失败" value="false" />
            </el-select>
          </template>
          <template v-else>
            <el-input v-model="filters.modelName" clearable placeholder="模型名称" />
            <el-input v-model="filters.callType" clearable placeholder="调用类型" />
            <el-select v-model="filters.success" clearable placeholder="调用结果">
              <el-option label="成功" value="true" />
              <el-option label="失败" value="false" />
            </el-select>
          </template>
          <el-date-picker v-model="filters.startTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="开始时间" />
          <el-date-picker v-model="filters.endTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="结束时间" />
          <div class="filter-actions">
            <el-button type="primary" :loading="loading" @click="pager.pageNo = 1; loadLogs()">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </div>
        </div>

        <el-alert v-if="errorMessage" class="state-alert" type="error" show-icon :closable="false" :title="errorMessage" />

        <el-table :data="rows" v-loading="loading" size="large" :empty-text="`暂无${tabTitle}`">
          <template v-if="activeTab === 'operations'">
            <el-table-column label="ID" width="90"><template #default="{ row }">{{ textOf(row?.id) }}</template></el-table-column>
            <el-table-column label="用户" width="140"><template #default="{ row }">{{ textOf(row?.username || row?.userId) }}</template></el-table-column>
            <el-table-column label="模块" width="140"><template #default="{ row }">{{ textOf((row as any)?.module) }}</template></el-table-column>
            <el-table-column label="操作" min-width="180" show-overflow-tooltip><template #default="{ row }">{{ textOf((row as any)?.action) }}</template></el-table-column>
            <el-table-column label="路径" min-width="220" show-overflow-tooltip><template #default="{ row }">{{ textOf((row as any)?.path) }}</template></el-table-column>
            <el-table-column label="结果" width="110"><template #default="{ row }"><el-tag :type="resultType(row)" effect="plain">{{ resultText(row) }}</el-tag></template></el-table-column>
            <el-table-column label="时间" width="180"><template #default="{ row }">{{ formatTime(row) }}</template></el-table-column>
          </template>

          <template v-else-if="activeTab === 'logins'">
            <el-table-column label="ID" width="90"><template #default="{ row }">{{ textOf(row?.id) }}</template></el-table-column>
            <el-table-column label="账号" min-width="160"><template #default="{ row }">{{ textOf((row as any)?.account || (row as any)?.username) }}</template></el-table-column>
            <el-table-column label="IP" width="150"><template #default="{ row }">{{ textOf((row as any)?.ip) }}</template></el-table-column>
            <el-table-column label="设备" min-width="220" show-overflow-tooltip><template #default="{ row }">{{ textOf((row as any)?.userAgent) }}</template></el-table-column>
            <el-table-column label="结果" width="110"><template #default="{ row }"><el-tag :type="resultType(row)" effect="plain">{{ resultText(row) }}</el-tag></template></el-table-column>
            <el-table-column label="失败原因" min-width="180" show-overflow-tooltip><template #default="{ row }">{{ textOf((row as any)?.failReason) }}</template></el-table-column>
            <el-table-column label="时间" width="180"><template #default="{ row }">{{ formatTime(row) }}</template></el-table-column>
          </template>

          <template v-else>
            <el-table-column label="ID" width="90"><template #default="{ row }">{{ textOf(row?.id) }}</template></el-table-column>
            <el-table-column label="模型" min-width="180" show-overflow-tooltip><template #default="{ row }">{{ textOf((row as any)?.modelName) }}</template></el-table-column>
            <el-table-column label="类型" width="130"><template #default="{ row }">{{ textOf((row as any)?.callType) }}</template></el-table-column>
            <el-table-column label="Token" width="130"><template #default="{ row }">{{ (row as any)?.totalTokens ?? '-' }}</template></el-table-column>
            <el-table-column label="耗时" width="120"><template #default="{ row }">{{ (row as any)?.elapsedMs ? `${(row as any).elapsedMs}ms` : '-' }}</template></el-table-column>
            <el-table-column label="结果" width="110"><template #default="{ row }"><el-tag :type="resultType(row)" effect="plain">{{ resultText(row) }}</el-tag></template></el-table-column>
            <el-table-column label="失败原因" min-width="200" show-overflow-tooltip><template #default="{ row }">{{ textOf((row as any)?.failReason) }}</template></el-table-column>
            <el-table-column label="时间" width="180"><template #default="{ row }">{{ formatTime(row) }}</template></el-table-column>
          </template>
        </el-table>

        <div class="pagination-row">
          <el-pagination
            v-model:current-page="pager.pageNo"
            v-model:page-size="pager.pageSize"
            layout="total, sizes, prev, pager, next"
            :page-sizes="[10, 20, 50]"
            :total="pager.total"
            @size-change="pager.pageNo = 1; loadLogs()"
            @current-change="loadLogs"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.alert-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.alert-card strong {
  display: block;
  margin-top: 12px;
  font-size: 28px;
}

.alert-card p {
  margin: 8px 0;
  min-height: 42px;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.alert-head,
.alert-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.alert-head span {
  font-weight: 700;
}

.alert-meta {
  justify-content: flex-start;
  color: var(--color-text-muted);
  font-size: 13px;
}

.filter-bar {
  display: grid;
  grid-template-columns: repeat(5, minmax(140px, 1fr)) auto;
  gap: 12px;
  align-items: center;
  margin: 6px 0 16px;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.state-alert {
  margin-bottom: 12px;
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

@media (max-width: 1100px) {
  .alert-grid {
    grid-template-columns: 1fr;
  }

  .filter-bar {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 680px) {
  .filter-bar {
    grid-template-columns: 1fr;
  }
}
</style>
