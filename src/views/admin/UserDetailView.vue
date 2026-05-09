<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminUser, resetAdminUserPassword, setAdminUserStatus } from '@/api/knowledge'
import type { UserInfo } from '@/types'
import { timeOf } from '@/utils/view-adapters'

const route = useRoute()
const loading = ref(false)
const user = ref<UserInfo | null>(null)

function statusText(value: string) {
  const upper = String(value || '').toUpperCase()
  if (upper === 'ENABLED' || upper === 'NORMAL') return '正常'
  if (upper === 'DISABLED') return '禁用'
  return upper || '-'
}

async function loadUser() {
  loading.value = true
  try {
    user.value = await getAdminUser(Number(route.params.id))
  } finally {
    loading.value = false
  }
}

async function updateStatus(status: string) {
  if (!user.value) return
  await ElMessageBox.confirm(`确认将用户状态改为 ${statusText(status)} 吗？`, '状态更新', { type: 'warning' })
  await setAdminUserStatus(user.value.id, status)
  ElMessage.success('用户状态已更新')
  loadUser()
}

async function resetPassword() {
  if (!user.value) return
  const result = await ElMessageBox.prompt('请输入新密码', '重置密码', {
    inputType: 'password',
    inputValidator: (value) => {
      const text = String(value || '')
      if (!text) return '请输入新密码'
      if (text.length < 8 || text.length > 32) return '密码长度应为 8-32 个字符'
      return true
    },
  })
  await resetAdminUserPassword(user.value.id, result.value)
  ElMessage.success('密码已重置')
}

onMounted(loadUser)
</script>

<template>
  <div v-loading="loading">
    <div class="page-header"><div><h1 class="page-title">用户详情</h1><div class="page-desc">查看用户基础信息、统计和最近登录时间。</div></div></div>
    <div v-if="user" class="detail-grid">
      <section class="soft-card"><div class="soft-card-body">
        <div class="profile-head"><el-avatar :size="56">{{ user.username?.slice(0, 1).toUpperCase() }}</el-avatar><div><h2>{{ user.username }}</h2><p>{{ user.email || '-' }}</p></div></div>
        <div class="meta-grid">
          <div><span>角色</span><strong>{{ user.role || '-' }}</strong></div>
          <div><span>状态</span><strong>{{ statusText(user.status) }}</strong></div>
          <div><span>知识库</span><strong>{{ (user as any).kbCount || (user as any).knowledgeBaseCount || 0 }}</strong></div>
          <div><span>文档</span><strong>{{ (user as any).docCount || (user as any).documentCount || 0 }}</strong></div>
          <div><span>问答次数</span><strong>{{ (user as any).qaCount || (user as any).chatCount || 0 }}</strong></div>
          <div><span>最近登录</span><strong>{{ (user as any).lastLoginTime || '-' }}</strong></div>
          <div><span>注册时间</span><strong>{{ timeOf(user) }}</strong></div>
          <div><span>备注</span><strong>{{ (user as any).bio || '-' }}</strong></div>
        </div>
      </div></section>
      <section class="soft-card"><div class="soft-card-body">
        <h3 class="section-title">操作</h3>
        <div class="action-list">
          <el-button type="warning" @click="updateStatus('DISABLED')">禁用用户</el-button>
          <el-button type="success" @click="updateStatus('ENABLED')">启用用户</el-button>
          <el-button @click="resetPassword">重置密码</el-button>
        </div>
      </div></section>
    </div>
    <el-empty v-else-if="!loading" description="用户不存在" />
  </div>
</template>

<style scoped lang="scss">
.detail-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 16px; }
.profile-head { display: flex; align-items: center; gap: 14px; }
.meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 20px; }
.meta-grid span { display: block; color: var(--color-text-muted); font-size: 13px; }
.meta-grid strong { display: block; margin-top: 6px; }
.action-list { display: grid; gap: 10px; }
@media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }
</style>
