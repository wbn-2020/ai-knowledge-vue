<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const APP_SIDEBAR_KEY = 'app_sidebar_collapsed'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const collapsed = ref(localStorage.getItem(APP_SIDEBAR_KEY) === '1')
const isChatRoute = computed(() => route.path.startsWith('/app/chat'))

const menus = [
  { path: '/app/dashboard', label: '工作台', icon: 'House' },
  { path: '/app/knowledge', label: '知识库', icon: 'Collection' },
  { path: '/app/documents', label: '文档管理', icon: 'Document' },
  { path: '/app/chat', label: '智能问答', icon: 'ChatDotRound' },
  { path: '/app/history', label: '问答历史', icon: 'Clock' },
  { path: '/app/search', label: '语义搜索', icon: 'Search' },
  { path: '/app/summary', label: '知识整理', icon: 'Notebook' },
  { path: '/app/notifications', label: '消息通知', icon: 'Bell' },
  { path: '/app/settings', label: '用户设置', icon: 'Setting' },
]

const currentTitle = computed(() => (route.meta.title as string) || 'KnowFlow AI')

function toggleSidebar() {
  collapsed.value = !collapsed.value
  localStorage.setItem(APP_SIDEBAR_KEY, collapsed.value ? '1' : '0')
}

function goAdmin() {
  router.push('/admin/dashboard')
}

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="app-shell" :class="{ collapsed }">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">K</div>
        <div v-show="!collapsed" class="brand-text">
          <div class="brand-name">KnowFlow AI</div>
          <div class="brand-sub">个人知识库与问答平台</div>
        </div>
      </div>

      <el-menu
        class="menu"
        router
        :collapse="collapsed"
        :default-active="$route.path"
        background-color="transparent"
        text-color="#5f6b7a"
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

    <section class="main">
      <header class="topbar">
        <div class="topbar-left">
          <div class="topbar-title">{{ currentTitle }}</div>
          <div class="topbar-desc">Knowledge management and RAG workflows</div>
        </div>
        <div class="topbar-actions">
          <el-button v-if="authStore.isAdmin" plain @click="goAdmin">去后台</el-button>
          <el-tag type="info" effect="plain">{{ authStore.user?.role || 'USER' }}</el-tag>
          <el-avatar :size="36">{{ authStore.user?.nickname?.slice(0, 1) || 'K' }}</el-avatar>
          <el-button plain @click="logout">退出</el-button>
        </div>
      </header>

      <main class="content" :class="{ 'content-chat': isChatRoute }">
        <router-view />
      </main>
    </section>
  </div>
</template>

<style scoped lang="scss">
.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 260px 1fr;
  transition: grid-template-columns 0.2s ease;
}

.app-shell.collapsed {
  grid-template-columns: 76px 1fr;
}

.sidebar {
  padding: 20px 10px 16px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(18px);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 10px 20px;
}

.brand-mark {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 800;
  background: linear-gradient(135deg, #2563eb, #14b8a6);
  box-shadow: var(--shadow-card);
  flex-shrink: 0;
}

.brand-name {
  font-size: 18px;
  font-weight: 800;
}

.brand-sub {
  margin-top: 3px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.menu {
  border-right: 0;
  flex: 1;
}

.sidebar-footer {
  padding: 8px 6px 0;
}

.collapse-btn {
  width: 100%;
}

.main {
  min-width: 0;
}

.topbar {
  min-height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 28px;
  border-bottom: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(18px);
}

.topbar-left {
  min-width: 0;
}

.topbar-title {
  font-size: 22px;
  font-weight: 800;
}

.topbar-desc {
  margin-top: 4px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.content {
  padding: 24px;
  min-height: 0;
}

.content-chat {
  padding: 16px;
  height: calc(100vh - 76px);
  overflow: hidden;
}

@media (max-width: 960px) {
  .app-shell,
  .app-shell.collapsed {
    grid-template-columns: 1fr;
  }

  .sidebar {
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
  }

  .topbar {
    padding: 14px 16px;
    align-items: flex-start;
    flex-direction: column;
  }

  .topbar-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
