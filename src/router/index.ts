import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { isAdminUser } from '@/stores/auth'

const extensionView = () => import('@/views/common/ExtensionFeatureView.vue')

const appExtensionRoutes = [
  {
    path: 'knowledge-share',
    component: extensionView,
    meta: {
      title: '知识库分享',
      category: '知识库扩展',
      description: '生成分享链接、设置有效期，并控制他人是否可提问或查看原文。',
      features: ['生成分享链接', '设置分享有效期', '允许他人提问', '允许查看原文'],
      workflows: ['选择知识库', '配置权限', '生成链接', '复制分享'],
    },
  },
  {
    path: 'knowledge-collaboration',
    component: extensionView,
    meta: {
      title: '知识库协作',
      category: '知识库扩展',
      description: '邀请成员加入知识库，设置成员角色并查看协作操作记录。',
      features: ['邀请成员', '只读/可编辑/管理员角色', '移除成员', '协作记录'],
      workflows: ['邀请成员', '分配角色', '协作编辑', '审计记录'],
    },
  },
  {
    path: 'knowledge-templates',
    component: extensionView,
    meta: {
      title: '知识库模板',
      category: '知识库扩展',
      description: '提供技术学习、项目文档、论文阅读、面试资料等知识库模板。',
      features: ['技术学习模板', '项目文档模板', '论文阅读模板', '面试资料模板'],
      workflows: ['选择模板', '预览结构', '创建知识库'],
    },
  },
  {
    path: 'knowledge-archive',
    component: extensionView,
    meta: {
      title: '知识库归档',
      category: '知识库扩展',
      description: '归档不常用知识库，并支持恢复归档。',
      features: ['归档知识库', '归档列表', '恢复归档', '归档筛选'],
      workflows: ['选择知识库', '确认归档', '隐藏列表', '恢复使用'],
    },
  },
  {
    path: 'document-batch-upload',
    component: extensionView,
    meta: {
      title: '批量上传',
      category: '文档扩展',
      description: '一次选择多个文件，展示批量上传进度和解析状态。',
      features: ['多文件选择', '批量上传进度', '批量解析状态', '失败重试'],
      workflows: ['选择知识库', '选择文件', '上传队列', '状态跟踪'],
    },
  },
  {
    path: 'document-preview',
    component: extensionView,
    meta: {
      title: '文档在线预览',
      category: '文档扩展',
      description: '支持 PDF、Markdown、TXT、DOCX 的在线查看。',
      features: ['PDF 预览', 'Markdown 渲染', 'TXT 查看', 'DOCX 转 HTML 预览'],
      workflows: ['选择文档', '加载预览', '查看内容'],
    },
  },
  {
    path: 'document-tags',
    component: extensionView,
    meta: {
      title: '文档标签',
      category: '文档扩展',
      description: '给文档添加标签，并按标签筛选文档。',
      features: ['添加标签', '删除标签', '标签筛选', '标签统计'],
      workflows: ['选择文档', '维护标签', '筛选文档'],
    },
  },
  {
    path: 'document-versions',
    component: extensionView,
    meta: {
      title: '文档版本管理',
      category: '文档扩展',
      description: '上传新版本文档，查看历史版本并对比差异。',
      features: ['上传新版本', '历史版本', '版本对比', '回滚版本'],
      workflows: ['上传版本', '记录历史', '对比差异', '回滚'],
    },
  },
  {
    path: 'document-favorites',
    component: extensionView,
    meta: {
      title: '文档收藏',
      category: '文档扩展',
      description: '收藏常用文档，快速查看收藏文档列表。',
      features: ['收藏文档', '取消收藏', '收藏列表', '快速访问'],
      workflows: ['选择文档', '加入收藏', '收藏筛选'],
    },
  },
  {
    path: 'document-advanced-parse',
    component: extensionView,
    meta: {
      title: '高级文档解析',
      category: '解析扩展',
      description: '覆盖 OCR、表格解析、结构化解析和索引重建能力。',
      features: ['OCR 识别', '表格解析', '标题层级识别', '索引重建'],
      workflows: ['选择文档', '选择解析策略', '执行任务', '查看结果'],
    },
  },
  {
    path: 'chat-advanced',
    component: extensionView,
    meta: {
      title: '高级问答',
      category: '问答扩展',
      description: '支持流式输出、多知识库问答、指定文档问答、回答反馈、导出和 Prompt 模式。',
      features: ['流式输出', '多知识库问答', '指定文档问答', '回答反馈', '问答导出', 'Prompt 模式'],
      workflows: ['选择范围', '选择模式', '提问', '反馈/导出'],
    },
  },
  {
    path: 'advanced-search',
    component: extensionView,
    meta: {
      title: '高级搜索',
      category: '搜索扩展',
      description: '支持全局搜索、高级筛选、关键词和向量混合检索。',
      features: ['全局搜索', '高级搜索', '混合检索', 'Rerank 重排序'],
      workflows: ['输入查询', '选择筛选', '混合召回', '重排序'],
    },
  },
  {
    path: 'history-advanced',
    component: extensionView,
    meta: {
      title: '会话整理',
      category: '历史扩展',
      description: '支持会话收藏、标签和归档。',
      features: ['会话收藏', '会话标签', '会话归档', '归档恢复'],
      workflows: ['选择会话', '添加标签', '收藏/归档', '筛选查看'],
    },
  },
  {
    path: 'knowledge-tools',
    component: extensionView,
    meta: {
      title: '知识工具',
      category: '知识整理扩展',
      description: '自动生成思维导图、学习卡片、待办事项和关键词。',
      features: ['思维导图', '学习卡片', '待办事项', '关键词提取'],
      workflows: ['选择文档', '选择工具', '生成结果', '编辑导出'],
    },
  },
  {
    path: 'notification-advanced',
    component: extensionView,
    meta: {
      title: '高级通知',
      category: '通知扩展',
      description: '支持邮件通知和 WebSocket 实时通知配置。',
      features: ['邮件通知', 'WebSocket 实时通知', '解析进度推送', '问答状态推送'],
      workflows: ['配置渠道', '订阅事件', '接收通知'],
    },
  },
  {
    path: 'theme-settings',
    component: extensionView,
    meta: {
      title: '界面偏好',
      category: '用户设置扩展',
      description: '支持深色模式、主题色切换和布局密度设置。',
      features: ['深色模式', '主题色切换', '布局密度', '模型偏好'],
      workflows: ['选择主题', '调整密度', '保存偏好'],
    },
  },
]

const adminExtensionRoutes = [
  {
    path: 'roles',
    component: extensionView,
    meta: {
      title: '角色权限',
      category: '后台扩展',
      description: '复杂 RBAC 权限模型，管理角色、菜单、权限点和用户授权。',
      features: ['角色管理', '菜单管理', '权限点管理', '用户分配角色', '角色分配权限'],
      workflows: ['创建角色', '配置权限', '绑定用户', '审计变更'],
    },
  },
  {
    path: 'token-costs',
    component: extensionView,
    meta: {
      title: 'Token 成本统计',
      category: '后台扩展',
      description: '统计输入输出 Token、模型调用费用和用户成本。',
      features: ['输入 Token', '输出 Token', '调用费用', '按用户统计'],
      workflows: ['采集日志', '聚合成本', '生成报表'],
    },
  },
  {
    path: 'queue-monitor',
    component: extensionView,
    meta: {
      title: '队列监控',
      category: '后台扩展',
      description: '查看任务队列积压、平均耗时和失败率。',
      features: ['队列积压', '平均耗时', '失败率', '实时刷新'],
      workflows: ['查看队列', '定位失败', '重试任务'],
    },
  },
  {
    path: 'scheduled-tasks',
    component: extensionView,
    meta: {
      title: '定时任务',
      category: '后台扩展',
      description: '管理临时文件清理、平台数据统计和失败任务检测。',
      features: ['临时文件清理', '平台数据统计', '失败任务检测', '任务启停'],
      workflows: ['创建任务', '设置周期', '执行记录'],
    },
  },
  {
    path: 'content-review',
    component: extensionView,
    meta: {
      title: '内容审核',
      category: '后台扩展',
      description: '审核公开知识库和文档内容，冻结违规内容。',
      features: ['知识库审核', '文档内容审核', '敏感标记', '冻结使用'],
      workflows: ['查看内容', '审核判断', '填写意见', '处理结果'],
    },
  },
  {
    path: 'storage-stats',
    component: extensionView,
    meta: {
      title: '存储空间统计',
      category: '后台扩展',
      description: '按用户和文件类型统计存储占用，清理无效文件。',
      features: ['用户存储统计', '文件类型统计', '无效文件清理', '空间趋势'],
      workflows: ['统计扫描', '查看占用', '清理文件'],
    },
  },
  {
    path: 'model-routing',
    component: extensionView,
    meta: {
      title: '模型路由策略',
      category: '后台扩展',
      description: '支持多模型路由、降级策略和不同场景模型选择。',
      features: ['多模型路由', '模型降级', '场景选择', '失败重试'],
      workflows: ['配置模型', '设置策略', '测试降级'],
    },
  },
  {
    path: 'prompt-evaluation',
    component: extensionView,
    meta: {
      title: 'Prompt 效果评估',
      category: '后台扩展',
      description: '管理 Prompt 版本，对比效果并支持回滚。',
      features: ['Prompt 版本管理', '版本对比', '效果评估', '回滚版本'],
      workflows: ['创建版本', '对比测试', '选择版本'],
    },
  },
  {
    path: 'audit-advanced',
    component: extensionView,
    meta: {
      title: '高级审计',
      category: '后台扩展',
      description: '支持审计查询、导出和异常告警。',
      features: ['按用户查询', '按操作类型查询', '时间范围筛选', '导出审计', '异常告警'],
      workflows: ['筛选日志', '导出结果', '配置告警'],
    },
  },
  {
    path: 'announcement-advanced',
    component: extensionView,
    meta: {
      title: '公告高级能力',
      category: '后台扩展',
      description: '支持公告定时发布和触达统计。',
      features: ['定时发布', '阅读人数', '未读人数', '触达统计'],
      workflows: ['编辑公告', '设置时间', '发布跟踪'],
    },
  },
]

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
      { path: 'settings', component: () => import('@/views/app/SettingsView.vue'), meta: { title: '用户设置' } },
      ...appExtensionRoutes,
    ],
  },
  { path: '/admin/login', component: () => import('@/views/admin/AdminLoginView.vue'), meta: { title: '后台登录' } },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      { path: 'dashboard', component: () => import('@/views/admin/DashboardView.vue'), meta: { title: '后台看板' } },
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
  const title = to.meta.title ? `${to.meta.title} - KnowFlow AI` : 'KnowFlow AI'
  document.title = title

  if (to.path === '/login' || to.path === '/register') {
    if (authStore.isLoggedIn) return isAdminUser(authStore.user) ? '/admin/dashboard' : '/app/dashboard'
    return true
  }

  if (to.path === '/admin/login') {
    if (authStore.isLoggedIn && isAdminUser(authStore.user)) return '/admin/dashboard'
    return true
  }

  if (!authStore.isLoggedIn) {
    return '/login'
  }

  if (to.meta.requiresAdmin && !isAdminUser(authStore.user)) {
    ElMessage.warning('无权限访问后台')
    return '/app/dashboard'
  }

  return true
})

export default router
