import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore, isAdminUser } from '@/stores/auth'

const extensionView = () => import('@/views/common/ExtensionFeatureView.vue')

const appExtensionRoutes = [
  'knowledge-share',
  'knowledge-collaboration',
  'knowledge-templates',
  'knowledge-archive',
  'document-batch-upload',
  'document-preview',
  'document-tags',
  'document-versions',
  'document-favorites',
  'document-advanced-parse',
  'chat-advanced',
  'advanced-search',
  'history-advanced',
  'knowledge-tools',
  'notification-advanced',
  'theme-settings',
].map((path) => ({ path, component: extensionView, meta: { title: '功能扩展' } }))

const adminExtensionRoutes = [
  'roles',
  'token-costs',
  'queue-monitor',
  'scheduled-tasks',
  'content-review',
  'storage-stats',
  'model-routing',
  'prompt-evaluation',
  'audit-advanced',
  'announcement-advanced',
].map((path) => ({ path, component: extensionView, meta: { title: '后台扩展' } }))

const routes = [
  { path: '/', redirect: '/app/dashboard' },
  { path: '/login', component: () => import('@/views/auth/LoginView.vue'), meta: { title: '登录' } },
  { path: '/register', component: () => import('@/views/auth/RegisterView.vue'), meta: { title: '注册' } },
  {
    path: '/app',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      { path: 'dashboard', component: () => import('@/views/app/DashboardView.vue'), meta: { title: '工作台' } },
      { path: 'knowledge', component: () => import('@/views/app/KnowledgeBaseListView.vue'), meta: { title: '知识库管理' } },
      { path: 'knowledge/create', component: () => import('@/views/app/KnowledgeBaseFormView.vue'), meta: { title: '创建知识库' } },
      { path: 'knowledge/:id', component: () => import('@/views/app/KnowledgeBaseDetailView.vue'), meta: { title: '知识库详情' } },
      { path: 'knowledge/:id/edit', component: () => import('@/views/app/KnowledgeBaseFormView.vue'), meta: { title: '编辑知识库' } },
      { path: 'documents', component: () => import('@/views/app/DocumentManageView.vue'), meta: { title: '文档管理' } },
      { path: 'documents/:id', component: () => import('@/views/app/DocumentDetailView.vue'), meta: { title: '文档详情' } },
      { path: 'chat', component: () => import('@/views/app/ChatView.vue'), meta: { title: '智能问答' } },
      { path: 'history', component: () => import('@/views/app/HistoryView.vue'), meta: { title: '问答历史' } },
      { path: 'history/:id', component: () => import('@/views/app/SessionDetailView.vue'), meta: { title: '会话详情' } },
      { path: 'search', component: () => import('@/views/app/SearchView.vue'), meta: { title: '语义搜索' } },
      { path: 'summary', component: () => import('@/views/app/KnowledgeSummaryView.vue'), meta: { title: '知识整理' } },
      { path: 'notifications', component: () => import('@/views/app/NotificationCenterView.vue'), meta: { title: '消息通知' } },
      { path: 'settings', component: () => import('@/views/app/SettingsView.vue'), meta: { title: '个人设置' } },
      ...appExtensionRoutes,
    ],
  },
  { path: '/admin/login', component: () => import('@/views/admin/AdminLoginView.vue'), meta: { title: '后台登录' } },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      { path: 'dashboard', component: () => import('@/views/admin/DashboardView.vue'), meta: { title: '后台首页' } },
      { path: 'users', component: () => import('@/views/admin/UserManageView.vue'), meta: { title: '用户管理' } },
      { path: 'users/:id', component: () => import('@/views/admin/UserDetailView.vue'), meta: { title: '用户详情' } },
      { path: 'knowledge-bases', component: () => import('@/views/admin/AdminKnowledgeView.vue'), meta: { title: '知识库管理' } },
      { path: 'knowledge-bases/:id', component: () => import('@/views/admin/KnowledgeDetailView.vue'), meta: { title: '知识库详情' } },
      { path: 'documents', component: () => import('@/views/admin/AdminDocumentView.vue'), meta: { title: '文档管理' } },
      { path: 'documents/:id', component: () => import('@/views/admin/DocumentDetailView.vue'), meta: { title: '文档详情' } },
      { path: 'tasks', component: () => import('@/views/admin/TaskView.vue'), meta: { title: '任务管理' } },
      { path: 'tasks/:id', component: () => import('@/views/admin/TaskDetailView.vue'), meta: { title: '任务详情' } },
      { path: 'ai-models', component: () => import('@/views/admin/ModelConfigView.vue'), meta: { title: 'AI 配置' } },
      { path: 'prompts', component: () => import('@/views/admin/PromptView.vue'), meta: { title: 'Prompt 模板' } },
      { path: 'feedbacks', component: () => import('@/views/admin/FeedbackManageView.vue'), meta: { title: '回答反馈管理' } },
      { path: 'logs', component: () => import('@/views/admin/LogView.vue'), meta: { title: '日志审计' } },
      { path: 'logs/:id', component: () => import('@/views/admin/LogDetailView.vue'), meta: { title: '日志详情' } },
      { path: 'settings', component: () => import('@/views/admin/SystemSettingView.vue'), meta: { title: '系统参数' } },
      { path: 'announcements', component: () => import('@/views/admin/AnnouncementView.vue'), meta: { title: '公告管理' } },
      ...adminExtensionRoutes,
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

  if (!to.meta.layout) {
    to.meta.layout = to.path.startsWith('/admin') ? 'admin' : 'front'
  }

  if (to.path === '/app/dashboard' || to.path === '/admin/dashboard') {
    to.meta.affix = true
  }

  document.title = to.meta.title ? `${to.meta.title} - KnowFlow AI` : 'KnowFlow AI'

  if (to.path === '/login' || to.path === '/register') {
    if (authStore.isLoggedIn) {
      return isAdminUser(authStore.user)
        ? { path: '/admin/dashboard', replace: true }
        : { path: '/app/dashboard', replace: true }
    }
    return true
  }

  if (to.path === '/admin/login') {
    if (authStore.isLoggedIn && isAdminUser(authStore.user)) {
      return { path: '/admin/dashboard', replace: true }
    }
    return true
  }

  if (!authStore.isLoggedIn) {
    return { path: '/login', replace: true }
  }

  if (to.path.startsWith('/admin') && !isAdminUser(authStore.user)) {
    ElMessage.warning('无权限访问后台')
    return { path: '/app/dashboard', replace: true }
  }

  return true
})

export default router
