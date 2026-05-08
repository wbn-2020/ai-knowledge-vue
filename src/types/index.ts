export interface R<T = any> {
  code: number
  msg: string
  data: T
  total?: number
}

export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar?: string
  email?: string
  role: 'USER' | 'ADMIN'
  status: 'NORMAL' | 'DISABLED'
}

export interface KnowledgeBase {
  id: number
  name: string
  description: string
  icon: string
  category: string
  docCount: number
  status: 'NORMAL' | 'PROCESSING' | 'FAILED' | 'DISABLED'
  updatedAt: string
  createdAt: string
}

export interface DocumentItem {
  id: number
  name: string
  type: string
  size: string
  parseStatus: 'PENDING' | 'PARSING' | 'SUCCESS' | 'FAILED'
  embeddingStatus: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED'
  knowledgeBaseName: string
  updatedAt: string
}

export interface NotificationItem {
  id: number
  title: string
  content: string
  type: '解析成功' | '解析失败' | '问答失败' | '系统公告'
  isRead: boolean
  createdAt: string
}

export interface ChatSession {
  id: number
  title: string
  knowledgeBaseName: string
  latestQuestion: string
  updatedAt: string
}

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  references?: string[]
}

export interface Metric {
  label: string
  value: string | number
  hint: string
}

export interface LoginForm {
  username: string
  password: string
}

export interface RegisterForm {
  username: string
  password: string
  confirmPassword: string
  nickname: string
}
