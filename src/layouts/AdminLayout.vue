<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const menus = [
  { path: '/admin/dashboard', label: '数据看板', icon: 'DataBoard' },
  { path: '/admin/users', label: '用户管理', icon: 'User' },
  { path: '/admin/knowledge-bases', label: '知识库管理', icon: 'FolderOpened' },
  { path: '/admin/documents', label: '文档管理', icon: 'Document' },
  { path: '/admin/tasks', label: '任务管理', icon: 'List' },
  { path: '/admin/ai-models', label: 'AI 配置', icon: 'Cpu' },
  { path: '/admin/prompts', label: 'Prompt 模板', icon: 'DocumentCopy' },
  { path: '/admin/logs', label: '日志审计', icon: 'Tickets' },
  { path: '/admin/settings', label: '系统参数', icon: 'Setting' },
  { path: '/admin/announcements', label: '公告管理', icon: 'Notification' },
  { path: '/admin/roles', label: '角色权限', icon: 'Lock' },
  { path: '/admin/token-costs', label: 'Token 成本', icon: 'Coin' },
  { path: '/admin/queue-monitor', label: '队列监控', icon: 'TrendCharts' },
  { path: '/admin/content-review', label: '内容审核', icon: 'Checked' },
  { path: '/admin/model-routing', label: '模型路由', icon: 'Connection' },
]

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <div class="admin-brand">
        <div class="admin-badge">A</div>
        <div>
          <div class="admin-title">KnowFlow Admin</div>
          <div class="admin-sub">后台管理控制台</div>
        </div>
      </div>

      <el-menu
        router
        :default-active="$route.path"
        background-color="transparent"
        text-color="#64748b"
        active-text-color="#2563eb"
      >
        <el-menu-item v-for="menu in menus" :key="menu.path" :index="menu.path">
          <el-icon><component :is="menu.icon" /></el-icon>
          <span>{{ menu.label }}</span>
        </el-menu-item>
      </el-menu>
    </aside>

    <section class="admin-main">
      <header class="admin-topbar">
        <div>
          <div class="admin-page-title">{{ $route.meta.title || '后台管理' }}</div>
          <div class="admin-page-desc">用于管理平台用户、知识库、文档和系统配置</div>
        </div>
        <div class="admin-actions">
          <el-tag type="warning" effect="plain">{{ authStore.user?.role }}</el-tag>
          <el-button plain @click="logout">退出</el-button>
        </div>
      </header>

      <main class="admin-content">
        <router-view />
      </main>
    </section>
  </div>
</template>

<style scoped lang="scss">
.admin-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 250px 1fr;
}

.admin-sidebar {
  padding: 20px 16px;
  background: rgba(255, 255, 255, 0.9);
  border-right: 1px solid var(--color-border);
}

.admin-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 10px 20px;
}

.admin-badge {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 800;
  background: linear-gradient(135deg, #0f172a, #2563eb);
}

.admin-title {
  font-size: 18px;
  font-weight: 800;
}

.admin-sub {
  margin-top: 3px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.admin-main {
  min-width: 0;
}

.admin-topbar {
  height: 76px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 28px;
  border-bottom: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(18px);
}

.admin-page-title {
  font-size: 22px;
  font-weight: 800;
}

.admin-page-desc {
  margin-top: 4px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.admin-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-content {
  padding: 24px;
}

@media (max-width: 960px) {
  .admin-shell {
    grid-template-columns: 1fr;
  }
}
</style>
