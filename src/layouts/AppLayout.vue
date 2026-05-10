<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import TagsView from '@/components/TagsView.vue'

const APP_SIDEBAR_KEY = 'knowflow-sidebar-collapsed'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const collapsed = ref(localStorage.getItem(APP_SIDEBAR_KEY) === 'true')

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
  localStorage.setItem(APP_SIDEBAR_KEY, String(collapsed.value))
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
        <div v-show="!collapsed">
          <div class="brand-name">KnowFlow AI</div>
          <div class="brand-sub">个人知识库与问答平台</div>
        </div>
      </div>

      <el-menu
        class="menu"
        router
        :collapse="collapsed"
        :collapse-transition="false"
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
    </aside>

    <section class="main">
      <header class="topbar">
        <div class="topbar-left">
          <el-button text class="collapse-btn" @click="toggleSidebar">
            <el-icon><component :is="collapsed ? 'Expand' : 'Fold'" /></el-icon>
          </el-button>
          <div>
            <div class="topbar-title">{{ currentTitle }}</div>
            <div class="topbar-desc">Knowledge management and RAG workflows</div>
          </div>
        </div>
        <div class="topbar-actions">
          <el-button v-if="authStore.isAdmin" plain @click="goAdmin">去后台</el-button>
          <el-tag type="info" effect="plain">{{ authStore.user?.role || 'USER' }}</el-tag>
          <el-avatar :size="36">{{ authStore.user?.nickname?.slice(0, 1) || 'K' }}</el-avatar>
          <el-button plain @click="logout">退出</el-button>
        </div>
      </header>

      <main class="content">
        <TagsView />
        <div class="view-wrap">
          <router-view />
        </div>
      </main>
    </section>
  </div>
</template>

<style scoped lang="scss">
.app-shell {
  --sidebar-width: 260px;
  height: 100vh;
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  overflow: hidden;
}

.app-shell.collapsed {
  --sidebar-width: 72px;
}

.sidebar {
  width: var(--sidebar-width);
  overflow: hidden;
  transition: width 0.2s ease;
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

.app-shell.collapsed .brand {
  justify-content: center;
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

.main {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.topbar {
  min-height: 76px;
  flex-shrink: 0;
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapse-btn {
  font-size: 18px;
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
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.view-wrap {
  flex: 1;
  min-height: 0;
  padding: 24px;
  overflow-y: auto;
  overflow-x: hidden;
}

@media (max-width: 960px) {
  .app-shell,
  .app-shell.collapsed {
    grid-template-columns: 1fr;
  }

  .sidebar {
    width: 100%;
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
  }

  .topbar {
    padding: 14px 16px;
    align-items: flex-start;
    flex-direction: column;
  }

  .topbar-left {
    width: 100%;
  }

  .topbar-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
