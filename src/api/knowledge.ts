import type { KnowledgeBase, DocumentItem, ChatMessage, ChatSession, Metric } from '@/types'
import { knowledgeBases, documents, messages, sessions, metrics, adminMetrics } from '@/mock/data'

const asyncWrap = <T>(data: T) =>
  Promise.resolve({
    code: 200,
    data,
    msg: 'ok',
  })

export function getDashboardMetrics() {
  return asyncWrap(metrics)
}

export function getKnowledgeBases() {
  return asyncWrap<KnowledgeBase[]>(knowledgeBases)
}

export function getKnowledgeBaseDetail(id: number) {
  return asyncWrap(knowledgeBases.find((item) => item.id === id) || knowledgeBases[0])
}

export function getDocuments() {
  return asyncWrap<DocumentItem[]>(documents)
}

export function getChatSessions() {
  return asyncWrap<ChatSession[]>(sessions)
}

export function getChatMessages() {
  return asyncWrap<ChatMessage[]>(messages)
}

export function getAdminMetrics() {
  return asyncWrap<Metric[]>(adminMetrics)
}
