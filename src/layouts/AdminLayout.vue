<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const ADMIN_SIDEBAR_KEY = 'admin_sidebar_collapsed'

const router = useRouter()
const authStore = useAuthStore()
const collapsed = ref(localStorage.getItem(ADMIN_SIDEBAR_KEY) === '1')

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
]

function toggleSidebar() {
  collapsed.value = !collapsed.value
  localStorage.setItem(ADMIN_SIDEBAR_KEY, collapsed.value ? '1' : '0')
}

function goApp() {
  router.push('/app/dashboard')
}

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="admin-shell" :class="{ collapsed }">
    <aside class="admin-sidebar">
      <div class="admin-brand">
        <div class="admin-badge">A</div>
        <div v-show="!collapsed" class="admin-brand-text">
          <div class="admin-title">KnowFlow Admin</div>
          <div class="admin-sub">后台管理控制台</div>
        </div>
      </div>

      <el-menu
        class="menu"
        router
        :collapse="collapsed"
        :default-active="$route.path"
        background-color="transparent"
        text-color="#64748b"
        active-text-color="#2563eb"
      >
        <el-menu-item v-for="menu in menus" :key="menu.path" :index="menu.path">
          <el-icon><component :is="menu.icon" /></el-icon>
          <template #title>{{ menu.label }}</template>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer">
        <el-button class="collapse-btn" plain @click="toggleSidebar">
          <el-icon><component :is="collapsed ? 'Expand' : 'Fold'" /></el-icon>
          <span v-show="!collapsed">收起菜单</span>
        </el-button>
      </div>
    </aside>

    <section class="admin-main">
      <header class="admin-topbar">
        <div class="admin-topbar-left">
          <div class="admin-page-title">{{ $route.meta.title || '后台管理' }}</div>
          <div class="admin-page-desc">用于管理平台用户、知识库、文档和系统配置</div>
        </div>
        <div class="admin-actions">
          <el-button v-if="authStore.isAdmin" plain @click="goApp">去前台</el-button>
          <el-tag type="warning" effect="plain">{{ authStore.user?.role || 'ADMIN' }}</el-tag>
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
  transition: grid-template-columns 0.2s ease;
}

.admin-shell.collapsed {
  grid-template-columns: 76px 1fr;
}

.admin-sidebar {
  padding: 20px 10px 16px;
  background: rgba(255, 255, 255, 0.9);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
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
  flex-shrink: 0;
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

.sidebar-footer {
  padding: 8px 6px 0;
}

.menu {
  border-right: 0;
  flex: 1;
}

.collapse-btn {
  width: 100%;
}

.admin-main {
  min-width: 0;
}

.admin-topbar {
  min-height: 76px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 12px 28px;
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
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.admin-content {
  padding: 24px;
}

@media (max-width: 960px) {
  .admin-shell,
  .admin-shell.collapsed {
    grid-template-columns: 1fr;
  }

  .admin-topbar {
    padding: 14px 16px;
    align-items: flex-start;
    flex-direction: column;
  }

  .admin-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
