<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteAdminKnowledgeBase, getAdminKnowledgeBases, setAdminKnowledgeBaseStatus } from '@/api/knowledge'
import type { KnowledgeBase } from '@/types'
import { docCountOf, timeOf } from '@/utils/view-adapters'

const loading = ref(false)
const keyword = ref('')
const status = ref('')
const list = ref<KnowledgeBase[]>([])
const pager = reactive({ pageNo: 1, pageSize: 10, total: 0 })

async function loadList() {
  loading.value = true
  try {
    const data = await getAdminKnowledgeBases({
      keyword: keyword.value,
      status: status.value,
      pageNo: pager.pageNo,
      pageSize: pager.pageSize,
    })
    list.value = data.list || []
    pager.total = data.total || 0
    pager.pageNo = data.pageNo || pager.pageNo
    pager.pageSize = data.pageSize || pager.pageSize
  } finally {
    loading.value = false
  }
}

async function toggleStatus(row: KnowledgeBase) {
  const next = row.status === 'DISABLED' ? 'NORMAL' : 'DISABLED'
  const action = next === 'DISABLED' ? '禁用' : '启用'
  await ElMessageBox.confirm(`确认${action}知识库「${row.name}」吗？`, `${action}确认`, { type: next === 'DISABLED' ? 'warning' : 'info' })
  await setAdminKnowledgeBaseStatus(row.id, next)
  ElMessage.success(`知识库已${action}`)
  await loadList()
}

async function remove(row: KnowledgeBase) {
  await ElMessageBox.confirm(`确认删除知识库「${row.name}」吗？该操作会影响关联文档和问答记录。`, '删除确认', { type: 'warning' })
  await deleteAdminKnowledgeBase(row.id)
  ElMessage.success('知识库已删除')
  if (list.value.length === 1 && pager.pageNo > 1) pager.pageNo -= 1
  await loadList()
}

watch([keyword, status], () => {
  pager.pageNo = 1
  loadList()
})

onMounted(loadList)
</script>

<template>
  <div>
    <div class="page-header">
      <div><h1 class="page-title">后台知识库管理</h1><div class="page-desc">管理员查看全平台知识库，可禁用、启用和处理违规数据。</div></div>
      <el-button plain :loading="loading" @click="loadList"><el-icon><Refresh /></el-icon>刷新</el-button>
    </div>
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="搜索知识库名称 / 简介" clearable style="max-width: 320px" />
      <el-select v-model="status" placeholder="知识库状态" clearable style="width: 170px">
        <el-option label="正常" value="NORMAL" />
        <el-option label="处理中" value="PROCESSING" />
        <el-option label="解析失败" value="FAILED" />
        <el-option label="已禁用" value="DISABLED" />
      </el-select>
    </div>
    <section class="soft-card"><div class="soft-card-body">
      <el-table :data="list" v-loading="loading" size="large" empty-text="暂无知识库">
        <el-table-column prop="name" label="知识库名称" min-width="220" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column label="文档数量" width="100"><template #default="{ row }">{{ docCountOf(row) }}</template></el-table-column>
        <el-table-column label="更新时间" width="170"><template #default="{ row }">{{ timeOf(row) }}</template></el-table-column>
        <el-table-column label="状态" width="120"><template #default="{ row }"><el-tag :type="row.status === 'NORMAL' ? 'success' : row.status === 'FAILED' ? 'danger' : row.status === 'DISABLED' ? 'info' : 'warning'">{{ row.status }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/admin/knowledge-bases/${row.id}`)">详情</el-button>
            <el-button link :type="row.status === 'DISABLED' ? 'success' : 'warning'" @click="toggleStatus(row)">{{ row.status === 'DISABLED' ? '启用' : '禁用' }}</el-button>
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
          @size-change="pager.pageNo = 1; loadList()"
          @current-change="loadList"
        />
      </div>
    </div></section>
  </div>
</template>

<style scoped lang="scss">
.pagination-row { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
