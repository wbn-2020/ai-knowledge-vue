<script setup lang="ts">
const users = [
  { id: 1, username: 'admin', email: 'admin@knowflow.ai', role: 'ADMIN', status: 'NORMAL', kbCount: 3, docCount: 21 },
  { id: 2, username: 'demo_user', email: 'demo@knowflow.ai', role: 'USER', status: 'NORMAL', kbCount: 4, docCount: 18 },
  { id: 3, username: 'disabled_user', email: 'disabled@knowflow.ai', role: 'USER', status: 'DISABLED', kbCount: 1, docCount: 2 },
]
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">用户管理</h1>
        <div class="page-desc">分页查看用户，支持禁用、启用和重置密码。</div>
      </div>
    </div>

    <div class="toolbar">
      <el-input placeholder="搜索用户名" style="max-width: 280px" />
      <el-select placeholder="账号状态" style="width: 160px">
        <el-option label="正常" value="NORMAL" />
        <el-option label="禁用" value="DISABLED" />
      </el-select>
    </div>

    <section class="soft-card">
      <div class="soft-card-body">
        <el-table :data="users" size="large">
          <el-table-column prop="username" label="用户名" min-width="160" />
          <el-table-column prop="email" label="邮箱" min-width="220" />
          <el-table-column prop="role" label="角色" width="100" />
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === 'NORMAL' ? 'success' : 'danger'">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="kbCount" label="知识库" width="100" />
          <el-table-column prop="docCount" label="文档" width="100" />
          <el-table-column label="操作" width="220">
            <template #default="{ row }">
              <el-button link type="primary" @click="$router.push(`/admin/users/${row.id}`)">详情</el-button>
              <el-button link :type="row.status === 'NORMAL' ? 'warning' : 'success'">
                {{ row.status === 'NORMAL' ? '禁用' : '启用' }}
              </el-button>
              <el-button link>重置密码</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>
  </div>
</template>
