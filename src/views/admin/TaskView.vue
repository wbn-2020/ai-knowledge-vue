<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { getDocumentTasks, retryDocumentTask } from '@/api/knowledge'
import { documentNameOf, statusTagType, textOf, timeOf } from '@/utils/view-adapters'
import { taskStatusLabel, taskTypeLabel } from '@/utils/enumLabel'

const router = useRouter()
const loading = ref(false)
const tasks = ref<any[]>([])
const status = ref('')
const taskType = ref('')
const keyword = ref('')
const documentId = ref<number>()
const pager = reactive({ pageNo: 1, pageSize: 10, total: 0 })

const taskTypeOptions = [
  { label: '文档解析', value: 'DOCUMENT_PARSE' },
  { label: '文档向量化（DOCUMENT_VECTORIZE）', value: 'DOCUMENT_VECTORIZE' },
  { label: '文档向量化（DOCUMENT_EMBEDDING）', value: 'DOCUMENT_EMBEDDING' },
  { label: '向量化（VECTORIZE）', value: 'VECTORIZE' },
  { label: '向量化（EMBEDDING）', value: 'EMBEDDING' },
]

function extractErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  const maybeAxios = error as any
  const backendMessage = maybeAxios?.response?.data?.message || maybeAxios?.response?.data?.msg
  return backendMessage ? String(backendMessage) : fallback
}

function taskIdOf(row: any) {
  const raw = row?.id ?? row?.taskId ?? row?.task_id
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

function taskTypeOf(row: any) {
  return taskTypeLabel(row?.taskType || row?.type || row?.task_type)
}

function failReasonOf(row: any) {
  return textOf(row?.failureReason || row?.reason || row?.errorMessage || row?.failReason || row?.logSummary)
}

function canRetry(row: any) {
  return String(row?.status || '').toUpperCase() === 'FAILED'
}

async function loadTasks() {
  loading.value = true
  try {
    const params: any = {
      status: status.value || undefined,
      taskType: taskType.value || undefined,
      documentId: documentId.value || undefined,
      keyword: keyword.value || undefined,
      pageNo: pager.pageNo,
      pageSize: pager.pageSize,
    }
    const data: any = await getDocumentTasks(params)
    tasks.value = data?.list || []
    pager.total = data?.total || 0
    pager.pageNo = data?.pageNo || pager.pageNo
    pager.pageSize = data?.pageSize || pager.pageSize
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, '任务列表加载失败'))
  } finally {
    loading.value = false
  }
}

async function retryTask(row: any) {
  const validTaskId = taskIdOf(row)
  if (!validTaskId) {
    ElMessage.error('任务 ID 无效')
    return
  }
  await ElMessageBox.confirm(`确认重试任务 #${validTaskId} 吗？`, '重试任务', { type: 'warning' })
  await retryDocumentTask(validTaskId)
  ElMessage.success('已提交任务重试')
  await loadTasks()
}

function goTaskDetail(row: any) {
  const id = taskIdOf(row)
  if (!id) {
    ElMessage.error('任务 ID 无效')
    return
  }
  router.push({ path: `/admin/tasks/${id}` })
}

watch([status, taskType, keyword, documentId], () => {
  pager.pageNo = 1
  loadTasks()
})

onMounted(loadTasks)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">文档处理任务</h1>
        <div class="page-desc">查看解析、切片、向量化任务状态和失败原因。</div>
      </div>
      <el-button plain :loading="loading" @click="loadTasks"><el-icon><Refresh /></el-icon>刷新</el-button>
    </div>

    <div class="toolbar">
      <el-input v-model="keyword" placeholder="搜索文档名称 / 任务信息" clearable style="max-width: 320px" />
      <el-select v-model="status" placeholder="任务状态" clearable style="width: 160px">
        <el-option label="待执行" value="PENDING" />
        <el-option label="执行中" value="PROCESSING" />
        <el-option label="成功" value="SUCCESS" />
        <el-option label="失败" value="FAILED" />
      </el-select>
      <el-select v-model="taskType" placeholder="任务类型（可选）" clearable style="width: 260px">
        <el-option v-for="item in taskTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-input-number v-model="documentId" :min="1" placeholder="关联文档ID" style="width: 150px" />
    </div>

    <section class="soft-card">
      <div class="soft-card-body table-wrap">
        <el-table :data="tasks" v-loading="loading" size="large" empty-text="暂无任务" class="task-table">
          <el-table-column label="ID" width="90">
            <template #default="{ row }">{{ textOf(taskIdOf(row) ?? row?.id) }}</template>
          </el-table-column>
          <el-table-column label="任务类型" width="180" show-overflow-tooltip>
            <template #default="{ row }"><span class="nowrap-cell">{{ taskTypeOf(row) }}</span></template>
          </el-table-column>
          <el-table-column label="关联文档" min-width="260" show-overflow-tooltip>
            <template #default="{ row }">{{ textOf(row?.documentName || documentNameOf(row?.document || row)) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="130">
            <template #default="{ row }"><el-tag :type="statusTagType(row?.status)">{{ taskStatusLabel(row?.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="失败原因" min-width="260" show-overflow-tooltip>
            <template #default="{ row }">{{ failReasonOf(row) }}</template>
          </el-table-column>
          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">{{ timeOf(row) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="170" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="goTaskDetail(row)">详情</el-button>
              <el-button v-if="canRetry(row)" link type="warning" @click="retryTask(row)">重试</el-button>
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
            @size-change="pager.pageNo = 1; loadTasks()"
            @current-change="loadTasks"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.table-wrap {
  overflow-x: auto;
}

.task-table {
  min-width: 1180px;
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.nowrap-cell {
  white-space: nowrap;
}
</style>
