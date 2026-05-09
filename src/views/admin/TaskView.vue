<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDocumentTasks, retryDocumentTask } from '@/api/knowledge'
import { documentNameOf, statusTagType, textOf, timeOf } from '@/utils/view-adapters'

const loading = ref(false)
const tasks = ref<any[]>([])
const status = ref('')
const keyword = ref('')
const pager = reactive({ pageNo: 1, pageSize: 10, total: 0 })

function taskTypeOf(row: any) {
  return textOf(row?.taskType || row?.type || row?.task_type)
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
    const data: any = await getDocumentTasks({
      status: status.value,
      keyword: keyword.value,
      pageNo: pager.pageNo,
      pageSize: pager.pageSize,
    })
    tasks.value = data?.list || []
    pager.total = data?.total || 0
    pager.pageNo = data?.pageNo || pager.pageNo
    pager.pageSize = data?.pageSize || pager.pageSize
  } finally {
    loading.value = false
  }
}

async function retryTask(row: any) {
  const taskId = textOf(row?.id)
  await ElMessageBox.confirm(`确认重试任务 #${taskId} 吗？`, '重试任务', { type: 'warning' })
  await retryDocumentTask(row.id)
  ElMessage.success('已提交任务重试')
  await loadTasks()
}

watch([status, keyword], () => {
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
        <el-option label="待处理" value="PENDING" />
        <el-option label="处理中" value="PROCESSING" />
        <el-option label="成功" value="SUCCESS" />
        <el-option label="失败" value="FAILED" />
      </el-select>
    </div>

    <section class="soft-card">
      <div class="soft-card-body table-wrap">
        <el-table :data="tasks" v-loading="loading" size="large" empty-text="暂无任务" class="task-table">
          <el-table-column label="ID" width="80">
            <template #default="{ row }">{{ textOf(row?.id) }}</template>
          </el-table-column>
          <el-table-column label="任务类型" width="150">
            <template #default="{ row }">{{ taskTypeOf(row) }}</template>
          </el-table-column>
          <el-table-column label="关联文档" min-width="240" show-overflow-tooltip>
            <template #default="{ row }">{{ textOf(row?.documentName || documentNameOf(row?.document || row)) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="130">
            <template #default="{ row }"><el-tag :type="statusTagType(row?.status)">{{ textOf(row?.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="失败原因" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">{{ failReasonOf(row) }}</template>
          </el-table-column>
          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">{{ timeOf(row) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="170" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="$router.push(`/admin/tasks/${row.id}`)">详情</el-button>
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
  min-width: 1120px;
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
