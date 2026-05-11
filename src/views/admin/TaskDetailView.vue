<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDocumentTask, retryDocumentTask } from '@/api/knowledge'
import { statusTagType, textOf } from '@/utils/view-adapters'
import { taskStatusLabel, taskTypeLabel } from '@/utils/enumLabel'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const retrying = ref(false)
const task = ref<any>(null)

const displayTaskId = computed(() => task.value?.id ?? task.value?.taskId ?? null)

const displayDocumentName = computed(
  () => task.value?.documentName ?? task.value?.document?.name ?? task.value?.document?.originalName ?? '未命名文档',
)
const displayStartedAt = computed(() => textOf(task.value?.startedAt || task.value?.startTime || task.value?.createdAt || task.value?.createTime))
const displayFinishedAt = computed(() => textOf(task.value?.finishedAt || task.value?.endTime || task.value?.updatedAt || task.value?.updateTime))

const logLines = computed<string[]>(() => {
  const logs = task.value?.logs
  if (Array.isArray(logs) && logs.length) return logs.map((x: any) => String(x))

  const executionLogs = task.value?.executionLogs
  if (Array.isArray(executionLogs) && executionLogs.length) return executionLogs.map((x: any) => String(x))

  const logsJson = task.value?.logsJson
  if (typeof logsJson === 'string' && logsJson.trim()) {
    try {
      const parsed = JSON.parse(logsJson)
      if (Array.isArray(parsed) && parsed.length) return parsed.map((x: any) => String(x))
    } catch {
      // ignore JSON parse error and fallback to plain text split
      return logsJson.split('\n').map((x: string) => x.trim()).filter(Boolean)
    }
  }

  const logSummary = task.value?.logSummary
  if (typeof logSummary === 'string' && logSummary.trim()) {
    return logSummary
      .split('\n')
      .map((x: string) => x.trim())
      .filter(Boolean)
  }
  return []
})

const canRetry = computed(() => String(task.value?.status || '').toUpperCase() === 'FAILED')

function taskTypeOf(row: any) {
  return taskTypeLabel(row?.taskType ?? row?.type)
}

function taskStatusOf(row: any) {
  return taskStatusLabel(row?.status)
}

function failReasonOf(row: any) {
  return textOf(row?.failureReason || row?.reason || row?.errorMessage || row?.failReason)
}

function resolveTaskId() {
  const rawId = route.params.id ?? route.query.id
  const taskId = Number(rawId)
  if (!Number.isFinite(taskId) || taskId <= 0) {
    ElMessage.error('任务 ID 无效')
    router.replace('/admin/tasks')
    return null
  }
  return taskId
}

async function loadTask() {
  const validTaskId = resolveTaskId()
  if (!validTaskId) return
  loading.value = true
  try {
    task.value = await getDocumentTask(validTaskId)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '任务详情加载失败')
  } finally {
    loading.value = false
  }
}

async function retryTask() {
  const id = Number(displayTaskId.value)
  if (!Number.isFinite(id) || id <= 0 || !canRetry.value) return
  await ElMessageBox.confirm(`确认重试任务 #${id} 吗？`, '重试任务', { type: 'warning' })
  retrying.value = true
  try {
    await retryDocumentTask(id)
    ElMessage.success('已提交任务重试')
    await loadTask()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '任务重试失败')
  } finally {
    retrying.value = false
  }
}

onMounted(loadTask)
</script>

<template>
  <div v-loading="loading">
    <div class="page-header">
      <div>
        <h1 class="page-title">任务详情</h1>
        <div class="page-desc">查看任务类型、关联文档、状态、耗时和执行日志。</div>
      </div>
      <el-button v-if="canRetry" type="warning" :loading="retrying" @click="retryTask">重试</el-button>
    </div>

    <div v-if="task" class="detail-grid">
      <section class="soft-card">
        <div class="soft-card-body">
          <div class="meta-grid">
            <div><span>ID</span><strong>#{{ displayTaskId ?? '-' }}</strong></div>
            <div><span>类型</span><strong>{{ taskTypeOf(task) }}</strong></div>
            <div><span>文档</span><strong>{{ displayDocumentName }}</strong></div>
            <div>
              <span>状态</span>
              <strong><el-tag :type="statusTagType(task.status)">{{ taskStatusOf(task) }}</el-tag></strong>
            </div>
            <div><span>耗时</span><strong>{{ textOf(task.durationMs, '-') }} ms</strong></div>
            <div><span>开始时间</span><strong>{{ displayStartedAt }}</strong></div>
            <div><span>结束时间</span><strong>{{ displayFinishedAt }}</strong></div>
            <div><span>失败原因</span><strong>{{ failReasonOf(task) }}</strong></div>
          </div>
        </div>
      </section>

      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">执行日志</h3>
          <ol v-if="logLines.length" class="log-list">
            <li v-for="(line, idx) in logLines" :key="`${idx}-${line}`">{{ line }}</li>
          </ol>
          <div v-else class="log-empty">暂无执行日志</div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.meta-grid {
  display: grid;
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

.log-list {
  margin: 0;
  padding-left: 20px;
  color: var(--color-text);
  line-height: 1.8;
  max-height: 420px;
  overflow-y: auto;
}

.log-empty {
  padding: 16px;
  border-radius: 12px;
  background: var(--color-surface-soft);
  color: var(--color-text-muted);
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
