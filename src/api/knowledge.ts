import request from './request'
import type { PageResponse } from './request'
import type { AxiosProgressEvent } from 'axios'
import type {
  AdminAnnouncement,
  AiCallLog,
  ChatMessage,
  ChatSession,
  DocumentSummaryVO,
  DocumentItem,
  KeywordVO,
  KnowledgeBase,
  KnowledgeBaseSummaryVO,
  LogAlert,
  LoginLog,
  NotificationItem,
  OperationLog,
  SearchResult,
  UserInfo,
} from '@/types'

export interface SystemConfig {
  maxFileSize: number
  allowedTypes: string[]
  chunkSize: number
  chunkOverlap: number
  topK: number
  similarityThreshold: number
  platformName: string
  adminEmail: string
}

export interface PromptConfig {
  id?: number
  name: string
  type: 'QA' | 'SUMMARY' | 'KEYWORD' | 'TITLE' | string
  content: string
  enabled: boolean
  createdAt?: string
  updatedAt?: string
}

export interface KnowledgeBaseVO extends KnowledgeBase {}
export interface DocumentVO extends DocumentItem {}
export interface SummaryVO {
  summary?: string
  content?: string
}
export interface DocumentChunkVO {
  chunkId?: number
  id?: number
  chunkIndex?: number
  content?: string
  tokenCount?: number
  vectorId?: string
  createdAt?: string
  createTime?: string
}
export interface DocumentTaskVO {
  id: number
  status: string
  taskType?: string
  type?: string
  task_type?: string
  documentId?: number
  documentName?: string
  failureReason?: string
  reason?: string
  errorMessage?: string
  createTime?: string
  createdAt?: string
}
export interface AdminDashboardOverview {
  userCount?: number
  knowledgeBaseCount?: number
  documentCount?: number
  aiCallCount?: number
  chatSessionCount?: number
  recentUsers?: UserInfo[]
  recentDocuments?: DocumentVO[]
  recentFailedTasks?: DocumentTaskVO[]
  recentAiErrors?: Array<Record<string, any>>
}

export interface DashboardOverview {
  knowledgeBaseCount: number
  documentCount: number
  chatSessionCount: number
  recentKnowledgeBases: KnowledgeBase[]
  recentDocuments: DocumentItem[]
  recentSessions: ChatSession[]
}

export interface AskResponse {
  sessionId: number
  answer: string
  question?: string
  answerType?: 'RAG' | 'NO_CONTEXT' | 'GENERAL' | string
  canUseGeneralAnswer?: boolean
  found?: boolean
  basedOnKnowledgeBase?: boolean
  noAnswerReason?: string | null
  references: Array<{
    id: number
    documentId: number
    chunkId: number
    chunkIndex?: number
    documentName: string
    content: string
    score: number
    finalScore?: number
    snippet?: string
    hitReason?: string
    vectorId?: string
  }>
}

export function getDashboardOverview() {
  return request.get<any, DashboardOverview>('/dashboard/overview')
}

export function createKnowledgeBase(data: Partial<KnowledgeBase>) {
  return request.post<any, KnowledgeBase>('/knowledge-bases', data)
}

export function getKnowledgeBasePage(params: { keyword?: string; pageNo?: number; pageSize?: number; sortBy?: string }) {
  return request.get<any, PageResponse<KnowledgeBase>>('/knowledge-bases', { params })
}

export function getKnowledgeBase(id: number) {
  return request.get<any, KnowledgeBase>(`/knowledge-bases/${id}`)
}

export function getKnowledgeBaseDetail(id: number) {
  return request.get<any, { knowledgeBase: KnowledgeBase; recentDocuments: DocumentItem[]; recentSessions: ChatSession[]; processingStatus: string }>(`/knowledge-bases/${id}/detail`)
}

export function updateKnowledgeBase(id: number, data: Partial<KnowledgeBase>) {
  return request.put<any, KnowledgeBase>(`/knowledge-bases/${id}`, data)
}

export function deleteKnowledgeBase(id: number) {
  return request.delete(`/knowledge-bases/${id}`)
}

export function uploadDocument(knowledgeBaseId: number, file: File, onUploadProgress?: (event: AxiosProgressEvent) => void) {
  const formData = new FormData()
  formData.append('knowledgeBaseId', String(knowledgeBaseId))
  formData.append('file', file)
  return request.post<any, DocumentItem>('/documents/upload', formData, { onUploadProgress })
}

export function getDocumentPage(params: {
  knowledgeBaseId?: number
  keyword?: string
  parseStatus?: string
  embeddingStatus?: string
  vectorStatus?: string
  pageNo?: number
  pageSize?: number
}) {
  return request.get<any, PageResponse<DocumentItem>>('/documents', { params })
}

export function getDocument(id: number) {
  return request.get<any, DocumentItem>(`/documents/${id}`)
}

export function deleteDocument(id: number) {
  return request.delete(`/documents/${id}`)
}

export function renameDocument(id: number, name: string) {
  return request.put(`/documents/${id}/rename`, { name })
}

export function getDocumentPreview(id: number) {
  return request.get<any, string>(`/documents/${id}/preview`)
}

export function getDocumentChunks(documentId: number, params: { pageNo?: number; pageSize?: number }) {
  return request.get<any, PageResponse<DocumentChunkVO>>(`/documents/${documentId}/chunks`, { params })
}

export function downloadDocument(id: number) {
  return request.get(`/documents/${id}/download`, { responseType: 'blob' })
}

export function retryDocument(id: number) {
  return request.post<any, DocumentItem>(`/documents/${id}/retry`)
}

export interface AskRequest {
  knowledgeBaseId: number
  sessionId?: number | null
  question: string
  allowGeneralAnswer?: boolean
}

export interface DocumentAskRequest {
  sessionId?: number | null
  question: string
  allowGeneralAnswer?: boolean
  topK?: number
  similarityThreshold?: number
}

export function askKnowledgeBase(data: AskRequest) {
  return request.post<any, AskResponse>('/chat/ask', data)
}

export function chatWithDocument(documentId: number, data: DocumentAskRequest) {
  return request.post<any, AskResponse>(`/documents/${documentId}/chat`, data)
}

export function askDocument(data: { documentId: number; sessionId?: number | null; question: string }) {
  return request.post<any, AskResponse>('/chat/ask/document', data)
}

export function askMultiKnowledgeBase(data: { knowledgeBaseIds: number[]; sessionId?: number | null; question: string }) {
  return request.post<any, AskResponse>('/chat/ask/multi', data)
}

export function getChatSessionPage(params: { pageNo?: number; pageSize?: number }) {
  return request.get<any, PageResponse<ChatSession>>('/chat/sessions', { params })
}

export function getChatMessages(sessionId: number) {
  return request.get<any, ChatMessage[]>(`/chat/sessions/${sessionId}/messages`)
}

export function deleteChatSession(sessionId: number) {
  return request.delete(`/chat/sessions/${sessionId}`)
}

export function renameChatSession(sessionId: number, title: string) {
  return request.put(`/chat/sessions/${sessionId}/rename`, { title })
}

export function clearChatMessages(sessionId: number) {
  return request.delete(`/chat/sessions/${sessionId}/messages`)
}

export function regenerateAnswer(sessionId: number) {
  return request.post<any, AskResponse>(`/chat/sessions/${sessionId}/regenerate`)
}

export function sendFeedback(data: { messageId: number; feedbackType: string; reason?: string }) {
  return request.post('/chat/feedback', data)
}

export function exportChat(sessionId: number, type: 'markdown' | 'pdf' | 'word') {
  return request.get(`/chat/sessions/${sessionId}/export/${type}`, { responseType: 'blob' })
}

export function semanticSearch(params: { knowledgeBaseId: number; query: string; topK?: number }) {
  return request.get<any, SearchResult[]>('/search/semantic', { params })
}

export function keywordSearch(params: { knowledgeBaseId: number; keyword: string; topK?: number }) {
  return request.get<any, SearchResult[]>('/search/keyword', { params })
}

export function getDocumentSummary(id: number) {
  return request.get<any, DocumentSummaryVO | null>(`/documents/${id}/summary`)
}

export function generateDocumentSummary(id: number) {
  return request.post<any, DocumentSummaryVO | null>(`/documents/${id}/summary/generate`)
}

export function regenerateDocumentSummary(id: number) {
  return request.post<any, DocumentSummaryVO | null>(`/documents/${id}/summary/regenerate`)
}

export function summarizeDocument(documentId: number) {
  return generateDocumentSummary(documentId)
}

export function getKnowledgeBaseSummary(id: number) {
  return request.get<any, KnowledgeBaseSummaryVO | null>(`/knowledge-bases/${id}/summary`)
}

export function generateKnowledgeBaseSummary(id: number) {
  return request.post<any, KnowledgeBaseSummaryVO | null>(`/knowledge-bases/${id}/summary/generate`)
}

export function regenerateKnowledgeBaseSummary(id: number) {
  return request.post<any, KnowledgeBaseSummaryVO | null>(`/knowledge-bases/${id}/summary/regenerate`)
}

export function summarizeKnowledgeBase(knowledgeBaseId: number) {
  return generateKnowledgeBaseSummary(knowledgeBaseId)
}

export function getDocumentKeywords(id: number) {
  return request.get<any, KeywordVO[] | null>(`/documents/${id}/keywords`)
}

export function extractDocumentKeywords(id: number) {
  return request.post<any, KeywordVO[] | null>(`/documents/${id}/keywords/extract`)
}

export function reextractDocumentKeywords(id: number) {
  return request.post<any, KeywordVO[] | null>(`/documents/${id}/keywords/reextract`)
}

export function getKnowledgeBaseKeywords(id: number) {
  return request.get<any, KeywordVO[] | null>(`/knowledge-bases/${id}/keywords`)
}

export function extractKnowledgeBaseKeywords(id: number) {
  return request.post<any, KeywordVO[] | null>(`/knowledge-bases/${id}/keywords/extract`)
}

export function reextractKnowledgeBaseKeywords(id: number) {
  return request.post<any, KeywordVO[] | null>(`/knowledge-bases/${id}/keywords/reextract`)
}

export function getNotificationPage(params: { pageNo?: number; pageSize?: number }) {
  return request.get<any, PageResponse<NotificationItem>>('/notifications', { params })
}

export function getUnreadNotificationCount() {
  return request.get<any, number>('/notifications/unread-count')
}

export function markNotificationRead(id: number) {
  return request.put(`/notifications/${id}/read`)
}

export function markAllNotificationsRead() {
  return request.put('/notifications/read-all')
}

export function getAnnouncements(params: { pageNo?: number; pageSize?: number }) {
  return request.get<any, PageResponse<NotificationItem>>('/announcements', { params })
}

export function getAdminDashboardOverview() {
  return request.get<any, AdminDashboardOverview>('/admin/dashboard/overview')
}

export function getAdminUsers(params: { keyword?: string; status?: string; pageNo?: number; pageSize?: number }) {
  return request.get<any, PageResponse<UserInfo>>('/admin/users', { params })
}

export function getAdminUser(id: number) {
  return request.get<any, UserInfo>(`/admin/users/${id}`)
}

export function setAdminUserStatus(id: number, status: string) {
  return request.put(`/admin/users/${id}/status`, null, { params: { status } })
}

export function resetAdminUserPassword(id: number, password: string) {
  return request.put(`/admin/users/${id}/password`, { password })
}

export function getAdminKnowledgeBases(params: { keyword?: string; status?: 'NORMAL' | 'PROCESSING' | 'FAILED' | 'DISABLED' | string; pageNo?: number; pageSize?: number }) {
  return request.get<any, PageResponse<KnowledgeBase>>('/admin/knowledge-bases', { params })
}

export function getAdminKnowledgeBase(id: number) {
  return request.get<any, KnowledgeBase>(`/admin/knowledge-bases/${id}`)
}

export function setAdminKnowledgeBaseStatus(id: number, status: string) {
  return request.put(`/admin/knowledge-bases/${id}/status`, null, { params: { status } })
}

export function deleteAdminKnowledgeBase(id: number) {
  return request.delete(`/admin/knowledge-bases/${id}`)
}

export function getAdminDocuments(params: {
  keyword?: string
  knowledgeBaseId?: number
  parseStatus?: string
  embeddingStatus?: string
  vectorStatus?: string
  fileType?: string
  userId?: number
  username?: string
  pageNo?: number
  pageSize?: number
}) {
  return request.get<any, PageResponse<DocumentItem>>('/admin/documents', { params })
}

export function getAdminDocument(id: number) {
  return request.get<any, DocumentItem>(`/admin/documents/${id}`)
}

export function downloadAdminDocument(id: number) {
  return request.get(`/admin/documents/${id}/download`, { responseType: 'blob' })
}

export function getAdminDocumentChunks(documentId: number, params: { pageNo?: number; pageSize?: number }) {
  return request.get<any, PageResponse<DocumentChunkVO>>(`/admin/documents/${documentId}/chunks`, { params })
}

export function deleteAdminDocument(id: number) {
  return request.delete(`/admin/documents/${id}`)
}

export function retryAdminDocument(id: number) {
  return request.post(`/admin/documents/${id}/retry`)
}

export function getDocumentTasks(params: {
  status?: string
  taskType?: string
  keyword?: string
  documentId?: number
  pageNo?: number
  pageSize?: number
}) {
  return request.get<any, PageResponse<DocumentTaskVO>>('/admin/document-tasks', { params })
}

export function getDocumentTask(id: number) {
  if (!Number.isFinite(Number(id)) || Number(id) <= 0) {
    return Promise.reject(new Error('invalid task id'))
  }
  return request.get<any, DocumentTaskVO>(`/admin/document-tasks/${id}`)
}

export function retryDocumentTask(id: number) {
  return request.post(`/admin/document-tasks/${id}/retry`)
}

export function getModelConfigs() {
  return request.get('/admin/config/models')
}

export function createModelConfig(data: any) {
  return request.post('/admin/config/models', data)
}

export function updateModelConfig(id: number, data: any) {
  return request.put(`/admin/config/models/${id}`, data)
}

export function deleteModelConfig(id: number) {
  return request.delete(`/admin/config/models/${id}`)
}

export function testModelConfig(id: number, prompt: string) {
  return request.post(`/admin/config/models/${id}/test`, { prompt })
}

export function getPromptConfigs() {
  return request.get('/admin/config/prompts')
}

export function getPromptConfig(id: number) {
  return request.get(`/admin/config/prompts/${id}`)
}

export function createPromptConfig(data: PromptConfig) {
  return request.post('/admin/config/prompts', data)
}

export function updatePromptConfig(id: number, data: PromptConfig) {
  return request.put(`/admin/config/prompts/${id}`, data)
}

export function deletePromptConfig(id: number) {
  return request.delete(`/admin/config/prompts/${id}`)
}

export function setPromptEnabled(id: number, enabled: boolean) {
  return request.put(`/admin/config/prompts/${id}/enabled`, { enabled })
}

export function getSystemConfigs() {
  return request.get<any, SystemConfig | Array<any>>('/admin/config/system')
}

export function saveSystemConfig(data: SystemConfig) {
  return request.post('/admin/config/system', data)
}

export function deleteSystemConfig(id: number) {
  return request.delete(`/admin/config/system/${id}`)
}

export function getOperationLogs(params: any) {
  return request.get<any, PageResponse<OperationLog>>('/admin/logs/operations', { params })
}

export function getLoginLogs(params: any) {
  return request.get<any, PageResponse<LoginLog>>('/admin/logs/logins', { params })
}

export function getAiCallLogs(params: any) {
  return request.get<any, PageResponse<AiCallLog>>('/admin/logs/ai-calls', { params })
}

export function getAlerts() {
  return request.get<any, LogAlert[]>('/admin/logs/alerts')
}

export function exportAdminLog(type: 'operations' | 'logins' | 'ai-calls', params: any) {
  return request.get(`/admin/logs/${type}/export`, { params, responseType: 'blob' })
}

export function getAdminAnnouncements(params: { pageNo?: number; pageSize?: number }) {
  return request.get<any, PageResponse<AdminAnnouncement>>('/admin/announcements', { params })
}

export function createAdminAnnouncement(data: any) {
  return request.post<any, AdminAnnouncement>('/admin/announcements', data)
}

export function updateAdminAnnouncement(id: number, data: any) {
  return request.put<any, AdminAnnouncement>(`/admin/announcements/${id}`, data)
}

export function deleteAdminAnnouncement(id: number) {
  return request.delete(`/admin/announcements/${id}`)
}
