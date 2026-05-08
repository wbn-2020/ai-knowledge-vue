<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

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
  { path: '/app/knowledge-share', label: '知识库分享', icon: 'Share' },
  { path: '/app/knowledge-collaboration', label: '知识库协作', icon: 'UserFilled' },
  { path: '/app/document-preview', label: '文档预览', icon: 'View' },
  { path: '/app/chat-advanced', label: '高级问答', icon: 'MagicStick' },
  { path: '/app/advanced-search', label: '高级搜索', icon: 'Filter' },
  { path: '/app/knowledge-tools', label: '知识工具', icon: 'Tools' },
]

const currentTitle = computed(() => (route.meta.title as string) || 'KnowFlow AI')

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">K</div>
        <div>
          <div class="brand-name">KnowFlow AI</div>
          <div class="brand-sub">个人知识库与问答平台</div>
        </div>
      </div>

      <el-menu
        class="menu"
        router
        :default-active="$route.path"
        background-color="transparent"
        text-color="#5f6b7a"
        active-text-color="#2563eb"
      >
        <el-menu-item v-for="menu in menus" :key="menu.path" :index="menu.path">
          <el-icon><component :is="menu.icon" /></el-icon>
          <span>{{ menu.label }}</span>
        </el-menu-item>
      </el-menu>
    </aside>

    <section class="main">
      <header class="topbar">
        <div>
          <div class="topbar-title">{{ currentTitle }}</div>
          <div class="topbar-desc">Modern SaaS style for knowledge management and RAG workflows</div>
        </div>
        <div class="topbar-actions">
          <el-tag type="info" effect="plain">{{ authStore.user?.role || 'USER' }}</el-tag>
          <el-avatar :size="36">{{ authStore.user?.nickname?.slice(0, 1) || 'K' }}</el-avatar>
          <el-button plain @click="logout">退出</el-button>
        </div>
      </header>

      <main class="content">
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
}

.sidebar {
  padding: 20px 16px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(18px);
  border-right: 1px solid var(--color-border);
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
}

.main {
  min-width: 0;
}

.topbar {
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  border-bottom: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(18px);
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
  gap: 12px;
}

.content {
  padding: 24px;
}

@media (max-width: 960px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
  }

  .topbar {
    padding: 0 16px;
    height: auto;
    min-height: 72px;
    align-items: flex-start;
    padding-top: 14px;
    padding-bottom: 14px;
    flex-direction: column;
    gap: 12px;
  }
}
</style>
