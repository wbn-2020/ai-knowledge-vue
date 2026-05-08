import type { ChatMessage, ChatSession, DocumentItem, KnowledgeBase, Metric, NotificationItem, UserInfo } from '@/types'

export const currentUser: UserInfo = {
  id: 1001,
  username: 'knowflow_admin',
  nickname: 'KnowFlow 管理员',
  email: 'admin@knowflow.ai',
  role: 'ADMIN',
  status: 'NORMAL',
}

export const metrics: Metric[] = [
  { label: '知识库数量', value: 12, hint: '近 7 天新增 3 个' },
  { label: '文档总数', value: 86, hint: 'PDF / DOCX / TXT / MD' },
  { label: '问答次数', value: 328, hint: '引用来源已展示' },
  { label: '今日待处理', value: 5, hint: '3 个解析中，2 个失败' },
]

export const knowledgeBases: KnowledgeBase[] = [
  {
    id: 1,
    name: '技术学习资料库',
    description: '沉淀前后端、架构、面试题与学习笔记。',
    icon: '📘',
    category: '技术学习',
    docCount: 28,
    status: 'NORMAL',
    createdAt: '2026-05-01 10:12',
    updatedAt: '2026-05-08 09:18',
  },
  {
    id: 2,
    name: '项目资料中心',
    description: '存放需求、设计稿、接口说明和项目文档。',
    icon: '🗂️',
    category: '项目资料',
    docCount: 19,
    status: 'PROCESSING',
    createdAt: '2026-05-03 14:20',
    updatedAt: '2026-05-08 08:02',
  },
  {
    id: 3,
    name: '论文阅读仓库',
    description: '用于论文摘录、引用与知识点归纳。',
    icon: '📄',
    category: '论文资料',
    docCount: 12,
    status: 'FAILED',
    createdAt: '2026-05-05 18:45',
    updatedAt: '2026-05-07 22:10',
  },
]

export const documents: DocumentItem[] = [
  { id: 1, name: 'Spring Boot 架构设计.pdf', type: 'PDF', size: '8.2 MB', parseStatus: 'SUCCESS', embeddingStatus: 'SUCCESS', knowledgeBaseName: '技术学习资料库', updatedAt: '2026-05-08 09:18' },
  { id: 2, name: 'KnowFlow AI PRD.md', type: 'MD', size: '236 KB', parseStatus: 'PARSING', embeddingStatus: 'PROCESSING', knowledgeBaseName: '项目资料中心', updatedAt: '2026-05-08 09:02' },
  { id: 3, name: 'RAG 方案说明.docx', type: 'DOCX', size: '1.4 MB', parseStatus: 'FAILED', embeddingStatus: 'FAILED', knowledgeBaseName: '技术学习资料库', updatedAt: '2026-05-07 23:45' },
  { id: 4, name: '论文摘要笔记.txt', type: 'TXT', size: '56 KB', parseStatus: 'SUCCESS', embeddingStatus: 'SUCCESS', knowledgeBaseName: '论文阅读仓库', updatedAt: '2026-05-07 17:22' },
]

export const sessions: ChatSession[] = [
  { id: 1, title: '知识库问答：RAG 设计', knowledgeBaseName: '技术学习资料库', latestQuestion: '向量检索怎么做？', updatedAt: '2026-05-08 09:06' },
  { id: 2, title: '项目文档整理', knowledgeBaseName: '项目资料中心', latestQuestion: 'PRD 的 MVP 范围是什么？', updatedAt: '2026-05-08 08:48' },
  { id: 3, title: '论文理解辅助', knowledgeBaseName: '论文阅读仓库', latestQuestion: '这篇文章的核心贡献是什么？', updatedAt: '2026-05-07 21:12' },
]

export const messages: ChatMessage[] = [
  { id: 1, role: 'user', content: '请解释一下文档解析和向量化的区别。' },
  { id: 2, role: 'assistant', content: '文档解析负责提取文本，向量化负责把文本转成可检索的向量。', references: ['Spring Boot 架构设计.pdf', 'KnowFlow AI PRD.md'] },
]

export const adminMetrics: Metric[] = [
  { label: '平台用户', value: 1240, hint: '其中管理员 3 人' },
  { label: '知识库总数', value: 388, hint: '正常 361，异常 27' },
  { label: '待解析任务', value: 16, hint: '最近 1 小时新增 4 个' },
  { label: 'AI 调用次数', value: 9821, hint: '今日成功率 98.2%' },
]

export const notifications: NotificationItem[] = [
  { id: 1, title: '文档解析完成', content: 'Spring Boot 架构设计.pdf 已成功解析并完成向量化。', type: '解析成功', isRead: false, createdAt: '2026-05-08 09:12' },
  { id: 2, title: '文档解析失败', content: 'RAG 方案说明.docx 在解析时发生格式异常。', type: '解析失败', isRead: false, createdAt: '2026-05-07 23:50' },
  { id: 3, title: '系统公告', content: '平台已开启 MVP 版知识库问答功能。', type: '系统公告', isRead: true, createdAt: '2026-05-07 10:18' },
]
