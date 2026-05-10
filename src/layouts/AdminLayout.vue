<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import TagsView from '@/components/TagsView.vue'

const ADMIN_SIDEBAR_KEY = 'knowflow-admin-sidebar-collapsed'

const router = useRouter()
const authStore = useAuthStore()
const collapsed = ref(localStorage.getItem(ADMIN_SIDEBAR_KEY) === 'true')

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
  localStorage.setItem(ADMIN_SIDEBAR_KEY, String(collapsed.value))
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
        <div v-show="!collapsed">
          <div class="admin-title">KnowFlow Admin</div>
          <div class="admin-sub">后台管理控制台</div>
        </div>
      </div>

      <el-menu
        class="menu"
        router
        :collapse="collapsed"
        :collapse-transition="false"
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
    </aside>

    <section class="admin-main">
      <header class="admin-topbar">
        <div class="admin-topbar-left">
          <el-button text class="collapse-btn" @click="toggleSidebar">
            <el-icon><component :is="collapsed ? 'Expand' : 'Fold'" /></el-icon>
          </el-button>
          <div>
            <div class="admin-page-title">{{ $route.meta.title || '后台管理' }}</div>
            <div class="admin-page-desc">用于管理平台用户、知识库、文档和系统配置</div>
          </div>
        </div>
        <div class="admin-actions">
          <el-button v-if="authStore.isAdmin" plain @click="goApp">去前台</el-button>
          <el-tag type="warning" effect="plain">{{ authStore.user?.role || 'ADMIN' }}</el-tag>
          <el-button plain @click="logout">退出</el-button>
        </div>
      </header>

      <main class="admin-content">
        <TagsView />
        <div class="view-wrap">
          <router-view />
        </div>
      </main>
    </section>
  </div>
</template>

<style scoped lang="scss">
.admin-shell {
  --sidebar-width: 250px;
  height: 100vh;
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  overflow: hidden;
}

.admin-shell.collapsed {
  --sidebar-width: 72px;
}

.admin-sidebar {
  width: var(--sidebar-width);
  overflow: hidden;
  transition: width 0.2s ease;
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

.admin-shell.collapsed .admin-brand {
  justify-content: center;
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

.menu {
  border-right: 0;
  flex: 1;
}

.admin-main {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.admin-topbar {
  min-height: 76px;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 12px 28px;
  border-bottom: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(18px);
}

.admin-topbar-left {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapse-btn {
  font-size: 18px;
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
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.view-wrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
}

@media (max-width: 960px) {
  .admin-shell,
  .admin-shell.collapsed {
    grid-template-columns: 1fr;
  }

  .admin-sidebar {
    width: 100%;
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
  }

  .admin-topbar {
    padding: 14px 16px;
    align-items: flex-start;
    flex-direction: column;
  }

  .admin-topbar-left {
    width: 100%;
  }

  .admin-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
