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
  bio?: string
  role: 'USER' | 'ADMIN'
  roles?: string[] | string
  isAdmin?: boolean
  userType?: string
  status: 'NORMAL' | 'ENABLED' | 'DISABLED'
  createTime?: string
  createdAt?: string
}

export interface KnowledgeBase {
  id: number
  name: string
  description: string
  icon: string
  category: string
  docCount: number
  status: 'NORMAL' | 'PROCESSING' | 'FAILED' | 'DISABLED'
  updatedAt?: string
  updateTime?: string
  createdAt?: string
  createTime?: string
}

export interface DocumentItem {
  id: number
  name: string
  type: string
  size: string
  parseStatus: 'PENDING' | 'PARSING' | 'SUCCESS' | 'FAILED'
  embeddingStatus: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED'
  knowledgeBaseName: string
  knowledgeBaseId?: number
  fileName?: string
  originalName?: string
  fileType?: string
  fileSize?: number
  errorMessage?: string
  failReason?: string
  parseError?: string
  chunkCount?: number
  segmentCount?: number
  updatedAt?: string
  updateTime?: string
  createdAt?: string
  createTime?: string
}

export interface NotificationItem {
  id: number
  title: string
  content: string
  type: string
  isRead?: boolean
  read?: boolean
  enabled?: boolean
  createdAt?: string
  createTime?: string
  updatedAt?: string
  updateTime?: string
}

export interface ChatSession {
  id: number
  title: string
  knowledgeBaseId?: number
  knowledgeBaseName?: string
  latestQuestion?: string
  messageCount?: number
  updatedAt?: string
  updateTime?: string
  createdAt?: string
  createTime?: string
}

export interface ChatReference {
  id?: number
  documentId?: number
  chunkId?: number
  chunkIndex?: number
  documentName?: string
  content?: string
  snippet?: string
  score?: number
  similarityScore?: number
  finalScore?: number
  hitReason?: string
  vectorId?: string
}

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  messageId?: number
  question?: string
  references?: Array<string | ChatReference>
  answerType?: 'RAG' | 'NO_CONTEXT' | 'GENERAL' | string
  canUseGeneralAnswer?: boolean
  found?: boolean
  basedOnKnowledgeBase?: boolean
  noAnswerReason?: string | null
  feedback?: ChatFeedbackVO | null
  createdAt?: string
  createTime?: string
  modelName?: string
  tokenCount?: number
}

export type FeedbackType = 'LIKE' | 'DISLIKE'

export type FeedbackReason = 'NOT_RELEVANT' | 'INCORRECT' | 'INCOMPLETE' | 'HALLUCINATION' | 'BAD_REFERENCE' | 'OTHER'

export interface ChatFeedbackVO {
  id: number
  messageId: number
  feedbackType: FeedbackType
  reason?: FeedbackReason | null
  remark?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface ChatFeedbackRequest {
  feedbackType: FeedbackType
  reason?: FeedbackReason
  remark?: string
}

export interface AdminFeedbackVO {
  feedbackId: number
  messageId: number
  sessionId: number
  userId: number
  username: string
  feedbackType: FeedbackType
  reason?: FeedbackReason | null
  remark?: string | null
  question?: string
  answer?: string
  answerType?: 'RAG' | 'NO_CONTEXT' | 'GENERAL' | string
  knowledgeBaseId?: number | null
  knowledgeBaseName?: string | null
  documentId?: number | null
  documentName?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface AdminFeedbackPageQuery {
  pageNo?: number
  pageSize?: number
  feedbackType?: FeedbackType
  reason?: FeedbackReason
  username?: string
  keyword?: string
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
  email?: string
  password: string
  confirmPassword: string
  nickname: string
}

export interface AdminAnnouncement {
  id: number
  title: string
  content: string
  enabled: boolean
  creator?: string
  createTime?: string
  updateTime?: string
  createdAt?: string
  updatedAt?: string
}

export interface OperationLog {
  id: number
  userId?: number
  username?: string
  action?: string
  module?: string
  method?: string
  path?: string
  ip?: string
  success?: boolean
  result?: string
  failReason?: string
  createTime?: string
  createdAt?: string
}

export interface LoginLog {
  id: number
  account?: string
  username?: string
  ip?: string
  userAgent?: string
  success?: boolean
  failReason?: string
  createTime?: string
  createdAt?: string
}

export interface AiCallLog {
  id: number
  userId?: number
  username?: string
  modelName?: string
  callType?: string
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  elapsedMs?: number
  success?: boolean
  failReason?: string
  knowledgeBaseId?: number
  question?: string
  sessionId?: number
  scene?: string
  modelType?: string
  provider?: string
  inputTokens?: number
  outputTokens?: number
  durationMs?: number
  retrieveCount?: number
  effectiveRetrieveCount?: number
  topK?: number
  similarityThreshold?: number
  maxSimilarityScore?: number
  llmCalled?: boolean
  errorMessage?: string
  createTime?: string
  createdAt?: string
}

export interface LogAlert {
  type: string
  level: string
  message: string
  total: number
  failed: number
  failureRate: number
}

export interface SearchResult {
  id?: number
  documentId?: number
  chunkId?: number
  documentName?: string
  name?: string
  title?: string
  content?: string
  summary?: string
  text?: string
  score?: number
  finalScore?: number
  similarityScore?: number
  similarity?: number
  snippet?: string
  chunkIndex?: number
}

export interface DocumentSummaryVO {
  documentId?: number
  documentName?: string
  knowledgeBaseId?: number
  summary?: string
  modelName?: string
  status?: string
  errorMessage?: string
  generatedAt?: string
}

export interface KnowledgeBaseSummaryVO {
  knowledgeBaseId?: number
  knowledgeBaseName?: string
  summary?: string
  coveredDocumentCount?: number
  modelName?: string
  status?: string
  errorMessage?: string
  generatedAt?: string
}

export interface KeywordVO {
  keyword?: string
  weight?: number
}
