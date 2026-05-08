<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminUsers, resetAdminUserPassword, setAdminUserStatus } from '@/api/knowledge'
import type { UserInfo } from '@/types'

const users = ref<UserInfo[]>([])
const keyword = ref('')
const status = ref('')
const loading = ref(false)
const pager = reactive({ pageNo: 1, pageSize: 10, total: 0 })

async function loadUsers() {
  loading.value = true
  try {
    const data = await getAdminUsers({
      keyword: keyword.value,
      status: status.value,
      pageNo: pager.pageNo,
      pageSize: pager.pageSize,
    })
    users.value = data.list || []
    pager.total = data.total || 0
    pager.pageNo = data.pageNo || pager.pageNo
    pager.pageSize = data.pageSize || pager.pageSize
  } finally {
    loading.value = false
  }
}

async function toggleStatus(row: UserInfo) {
  const nextStatus = row.status === 'DISABLED' ? 'ENABLED' : 'DISABLED'
  const action = nextStatus === 'DISABLED' ? '禁用' : '启用'
  await ElMessageBox.confirm(`确认${action}用户「${row.username}」吗？`, `${action}确认`, { type: nextStatus === 'DISABLED' ? 'warning' : 'info' })
  await setAdminUserStatus(row.id, nextStatus)
  ElMessage.success(`用户已${action}`)
  await loadUsers()
}

async function resetPassword(row: UserInfo) {
  const result = await ElMessageBox.prompt(`请输入 ${row.username} 的新密码`, '重置密码', {
    inputType: 'password',
    inputValidator: (value) => {
      const text = String(value || '')
      if (!text) return '请输入新密码'
      if (text.length < 8 || text.length > 32) return '密码长度应为 8-32 个字符'
      return true
    },
  })
  await ElMessageBox.confirm(`确认将用户「${row.username}」的密码重置为新密码吗？`, '二次确认', { type: 'warning' })
  await resetAdminUserPassword(row.id, result.value)
  ElMessage.success('密码已重置')
}

watch([keyword, status], () => {
  pager.pageNo = 1
  loadUsers()
})

onMounted(loadUsers)
</script>

<template>
  <div>
    <div class="page-header">
      <div><h1 class="page-title">用户管理</h1><div class="page-desc">分页查看用户，支持禁用、启用和重置密码。</div></div>
      <el-button plain :loading="loading" @click="loadUsers"><el-icon><Refresh /></el-icon>刷新</el-button>
    </div>
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="搜索用户名 / 邮箱" clearable style="max-width: 300px" />
      <el-select v-model="status" placeholder="账号状态" clearable style="width: 160px">
        <el-option label="正常" value="ENABLED" /><el-option label="禁用" value="DISABLED" />
      </el-select>
    </div>
    <section class="soft-card"><div class="soft-card-body">
      <el-table :data="users" v-loading="loading" size="large" empty-text="暂无用户">
        <el-table-column prop="username" label="用户名" min-width="160" />
        <el-table-column prop="email" label="邮箱" min-width="220" show-overflow-tooltip />
        <el-table-column prop="role" label="角色" width="100" />
        <el-table-column label="状态" width="120"><template #default="{ row }"><el-tag :type="row.status === 'DISABLED' ? 'danger' : 'success'">{{ row.status }}</el-tag></template></el-table-column>
        <el-table-column label="知识库" width="100"><template #default="{ row }">{{ row.kbCount || row.knowledgeBaseCount || 0 }}</template></el-table-column>
        <el-table-column label="文档" width="100"><template #default="{ row }">{{ row.docCount || row.documentCount || 0 }}</template></el-table-column>
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/admin/users/${row.id}`)">详情</el-button>
            <el-button link :type="row.status === 'DISABLED' ? 'success' : 'warning'" @click="toggleStatus(row)">{{ row.status === 'DISABLED' ? '启用' : '禁用' }}</el-button>
            <el-button link @click="resetPassword(row)">重置密码</el-button>
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
          @size-change="pager.pageNo = 1; loadUsers()"
          @current-change="loadUsers"
        />
      </div>
    </div></section>
  </div>
</template>

<style scoped lang="scss">
.pagination-row { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
