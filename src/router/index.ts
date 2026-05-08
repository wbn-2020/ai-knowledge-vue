import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/', redirect: '/app/dashboard' },
  { path: '/login', component: () => import('@/views/auth/LoginView.vue'), meta: { title: '登录' } },
  {
    path: '/app',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      { path: 'dashboard', component: () => import('@/views/app/DashboardView.vue'), meta: { title: '工作台' } },
      { path: 'knowledge', component: () => import('@/views/app/KnowledgeBaseListView.vue'), meta: { title: '知识库管理' } },
      { path: 'knowledge/:id', component: () => import('@/views/app/KnowledgeBaseDetailView.vue'), meta: { title: '知识库详情' } },
      { path: 'documents', component: () => import('@/views/app/DocumentManageView.vue'), meta: { title: '文档管理' } },
      { path: 'chat', component: () => import('@/views/app/ChatView.vue'), meta: { title: '智能问答' } },
      { path: 'history', component: () => import('@/views/app/HistoryView.vue'), meta: { title: '问答历史' } },
      { path: 'search', component: () => import('@/views/app/SearchView.vue'), meta: { title: '语义搜索' } },
      { path: 'settings', component: () => import('@/views/app/SettingsView.vue'), meta: { title: '用户设置' } },
    ],
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      { path: 'dashboard', component: () => import('@/views/admin/DashboardView.vue'), meta: { title: '后台看板' } },
      { path: 'users', component: () => import('@/views/admin/UserManageView.vue'), meta: { title: '用户管理' } },
      { path: 'knowledge-bases', component: () => import('@/views/admin/AdminKnowledgeView.vue'), meta: { title: '知识库管理' } },
      { path: 'documents', component: () => import('@/views/admin/AdminDocumentView.vue'), meta: { title: '文档管理' } },
      { path: 'tasks', component: () => import('@/views/admin/TaskView.vue'), meta: { title: '任务管理' } },
      { path: 'ai-models', component: () => import('@/views/admin/ModelConfigView.vue'), meta: { title: 'AI 配置' } },
      { path: 'prompts', component: () => import('@/views/admin/PromptView.vue'), meta: { title: 'Prompt 模板' } },
      { path: 'logs', component: () => import('@/views/admin/LogView.vue'), meta: { title: '日志审计' } },
      { path: 'settings', component: () => import('@/views/admin/SystemSettingView.vue'), meta: { title: '系统参数' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/app/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const title = to.meta.title ? `${to.meta.title} - KnowFlow AI` : 'KnowFlow AI'
  document.title = title

  if (to.path === '/login') {
    if (authStore.isLoggedIn) return '/app/dashboard'
    return true
  }

  if (!authStore.isLoggedIn) {
    return '/login'
  }

  if (to.meta.requiresAdmin && authStore.user?.role !== 'ADMIN') {
    return '/app/dashboard'
  }

  return true
})

export default router
