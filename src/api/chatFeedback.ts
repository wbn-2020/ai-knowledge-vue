import request from './request'
import type { PageResponse } from './request'
import type { AdminFeedbackPageQuery, AdminFeedbackVO, ChatFeedbackRequest, ChatFeedbackVO } from '@/types'

export function submitMessageFeedback(messageId: number, data: ChatFeedbackRequest) {
  return request.post<any, ChatFeedbackVO>(`/chat/messages/${messageId}/feedback`, data)
}

export function getMessageFeedback(messageId: number) {
  return request.get<any, ChatFeedbackVO | null>(`/chat/messages/${messageId}/feedback`)
}

export function deleteMessageFeedback(messageId: number) {
  return request.delete(`/chat/messages/${messageId}/feedback`)
}

export function getAdminFeedbackPage(params: AdminFeedbackPageQuery) {
  return request.get<any, PageResponse<AdminFeedbackVO>>('/admin/feedbacks', { params })
}
