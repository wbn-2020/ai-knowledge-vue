<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  askKnowledgeBase,
  clearChatMessages,
  exportChat,
  getChatMessages,
  getChatSessionPage,
  regenerateAnswer,
  sendFeedback,
} from '@/api/knowledge'
import type { ChatMessage, ChatReference, ChatSession } from '@/types'
import { messageCountOf, normalizeRole, timeOf } from '@/utils/view-adapters'

const MAX_QUESTION_LENGTH = 1000
const route = useRoute()
const router = useRouter()
const sessionId = Number(route.params.id)

const loading = ref(false)
const thinking = ref(false)
const exporting = ref(false)
const errorMessage = ref('')
const question = ref('')
const messages = ref<ChatMessage[]>([])
const session = ref<ChatSession | null>(null)
const messageListRef = ref<HTMLElement>()
const retryGeneralLoading = ref<Record<number, boolean>>({})
const showAllRefsMap = ref<Record<number, boolean>>({})
const missingRefNameWarned = ref<Record<number, boolean>>({})

const referenceDialogVisible = ref(false)
const currentReference = ref<ChatReference | null>(null)

const canAsk = computed(() => !!session.value?.knowledgeBaseId && !!question.value.trim() && question.value.trim().length <= MAX_QUESTION_LENGTH && !thinking.value)

function normalizeMessage(item: any): ChatMessage {
  return {
    ...item,
    role: normalizeRole(item.role),
    content: String(item?.content ?? item?.answer ?? ''),
    references: Array.isArray(item?.references) ? item.references : [],
    answerType: item?.answerType,
    canUseGeneralAnswer: item?.canUseGeneralAnswer,
    found: item?.found,
    basedOnKnowledgeBase: item?.basedOnKnowledgeBase,
    noAnswerReason: item?.noAnswerReason,
  }
}

function answerTypeOf(message: ChatMessage) {
  if (message.answerType) return String(message.answerType).toUpperCase()
  if (message.basedOnKnowledgeBase === false) return 'GENERAL'
  if (message.found === false) return 'NO_CONTEXT'
  return 'RAG'
}

function isNoContextMessage(message: ChatMessage) {
  return message.role === 'assistant' && answerTypeOf(message) === 'NO_CONTEXT'
}

function isGeneralAnswer(message: ChatMessage) {
  return message.role === 'assistant' && answerTypeOf(message) === 'GENERAL'
}

function isRagAnswer(message: ChatMessage) {
  return message.role === 'assistant' && answerTypeOf(message) === 'RAG'
}

function shouldShowGeneralAnswerButton(message: ChatMessage) {
  return isNoContextMessage(message) && message.canUseGeneralAnswer !== false
}

function getNoContextBody(message: ChatMessage) {
  if (message.content?.trim()) return message.content
  return '当前知识库未找到足够相关的资料，无法基于知识库回答。'
}

function getReferenceDocumentName(ref: ChatReference) {
  const name =
    ref.documentName ||
    (ref as any).name ||
    (ref as any).title ||
    (ref as any).fileName ||
    (ref as any).originalName ||
    (ref as any).document?.name ||
    (ref as any).document?.originalName
  if (name && String(name).trim()) return String(name).trim()
  if (ref.documentId && !missingRefNameWarned.value[ref.documentId]) {
    missingRefNameWarned.value = { ...missingRefNameWarned.value, [ref.documentId]: true }
    console.warn('[SessionDetail] reference documentId exists but documentName is missing.', ref)
  }
  return '未命名文档'
}

function getReferenceChunkLabel(ref: ChatReference) {
  const chunkIndex = (ref as any).chunkIndex ?? (ref as any).index
  if (chunkIndex !== undefined && chunkIndex !== null && chunkIndex !== '') return chunkIndex
  if ((ref as any).chunkId !== undefined && (ref as any).chunkId !== null && (ref as any).chunkId !== '') return (ref as any).chunkId
  return '-'
}

function referenceScore(ref: ChatReference) {
  const value = Number((ref as any).finalScore ?? (ref as any).score ?? 0)
  return Number.isFinite(value) ? value.toFixed(2) : '0.00'
}

function validReferences(message: ChatMessage): ChatReference[] {
  if (!isRagAnswer(message)) return []
  const refs = Array.isArray(message.references) ? message.references : []
  return refs
    .filter((item): item is ChatReference => typeof item === 'object' && !!item)
    .filter((ref) => Number((ref as any).finalScore ?? (ref as any).score ?? 0) >= 0.7)
}

function visibleReferences(message: ChatMessage) {
  const list = validReferences(message)
  if (showAllRefsMap.value[message.id]) return list
  return list.slice(0, 3)
}

function hasMoreReferences(message: ChatMessage) {
  return validReferences(message).length > 3
}

function toggleShowAllRefs(messageId: number) {
  showAllRefsMap.value = { ...showAllRefsMap.value, [messageId]: !showAllRefsMap.value[messageId] }
}

function setRetryLoading(messageId: number, loading: boolean) {
  retryGeneralLoading.value = { ...retryGeneralLoading.value, [messageId]: loading }
}

function isRetryLoading(messageId: number) {
  return !!retryGeneralLoading.value[messageId]
}

async function scrollToBottom(smooth = false) {
  await nextTick()
  const el = messageListRef.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
}

function findPreviousUserQuestion(targetIndex: number) {
  for (let i = targetIndex - 1; i >= 0; i -= 1) {
    const m = messages.value[i]
    if (m?.role === 'user' && m?.content?.trim()) return m.content.trim()
  }
  return ''
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function markdownToHtml(text: string) {
  let html = escapeHtml(text || '')
  html = html.replace(/```([\s\S]*?)```/g, (_m, p1) => `<pre><code>${p1.trim()}</code></pre>`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>')
  html = html.replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>')
  html = html.replace(/^####\s+(.*)$/gm, '<h4>$1</h4>')
  html = html.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
  html = html.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
  html = html.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
  const lines = html.split('\n')
  const out: string[] = []
  let inUl = false
  let inOl = false
  for (const raw of lines) {
    const line = raw.trim()
    if (/^[-*]\s+/.test(line)) {
      if (!inUl) {
        if (inOl) out.push('</ol>')
        out.push('<ul>')
        inUl = true
        inOl = false
      }
      out.push(`<li>${line.replace(/^[-*]\s+/, '')}</li>`)
      continue
    }
    if (/^\d+\.\s+/.test(line)) {
      if (!inOl) {
        if (inUl) out.push('</ul>')
        out.push('<ol>')
        inOl = true
        inUl = false
      }
      out.push(`<li>${line.replace(/^\d+\.\s+/, '')}</li>`)
      continue
    }
    if (inUl) {
      out.push('</ul>')
      inUl = false
    }
    if (inOl) {
      out.push('</ol>')
      inOl = false
    }
    out.push(line ? `<p>${line}</p>` : '<br />')
  }
  if (inUl) out.push('</ul>')
  if (inOl) out.push('</ol>')
  return out.join('')
}

function assistantHtml(message: ChatMessage) {
  return markdownToHtml(message.content || '')
}

async function loadSessionMeta() {
  const data = await getChatSessionPage({ pageNo: 1, pageSize: 100 })
  session.value = data.list.find((item) => item.id === sessionId) || null
}

async function loadDetail() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [messageData] = await Promise.all([getChatMessages(sessionId), loadSessionMeta()])
    messages.value = messageData.map(normalizeMessage)
    await scrollToBottom()
  } catch (error) {
    messages.value = []
    errorMessage.value = error instanceof Error ? error.message : '会话详情加载失败'
  } finally {
    loading.value = false
  }
}

async function clearMessages() {
  await ElMessageBox.confirm('确认清空该会话消息吗？', '清空确认', { type: 'warning' })
  await clearChatMessages(sessionId)
  messages.value = []
  ElMessage.success('会话消息已清空')
}

async function regenerate() {
  if (thinking.value) return
  thinking.value = true
  try {
    const result = await regenerateAnswer(sessionId)
    messages.value.push(normalizeMessage({ id: Date.now(), role: 'assistant', ...result, content: result.answer }))
    ElMessage.success('已重新生成回答')
    await scrollToBottom(true)
  } finally {
    thinking.value = false
  }
}

async function askFollowUp(allowGeneralAnswer = false, indexForRetry?: number) {
  const q = indexForRetry !== undefined ? findPreviousUserQuestion(indexForRetry) : question.value.trim()
  if (!q || thinking.value || !session.value?.knowledgeBaseId) return
  if (!allowGeneralAnswer) question.value = ''
  thinking.value = true
  try {
    if (!allowGeneralAnswer) messages.value.push({ id: Date.now(), role: 'user', content: q })
    const result = await askKnowledgeBase({ knowledgeBaseId: session.value.knowledgeBaseId, sessionId, question: q, allowGeneralAnswer })
    const msg = normalizeMessage({ id: Date.now() + 1, role: 'assistant', ...result, content: result.answer })
    if (allowGeneralAnswer && indexForRetry !== undefined) messages.value[indexForRetry] = msg
    else messages.value.push(msg)
    await loadSessionMeta()
    await scrollToBottom(true)
  } finally {
    thinking.value = false
  }
}

async function askGeneralForMessage(message: ChatMessage, index: number) {
  if (isRetryLoading(message.id)) return
  const q = findPreviousUserQuestion(index)
  if (!q) return ElMessage.warning('未找到该回复对应的用户问题')
  setRetryLoading(message.id, true)
  try {
    await askFollowUp(true, index)
    ElMessage.success('已生成通用回答')
  } finally {
    setRetryLoading(message.id, false)
  }
}

async function feedback(message: ChatMessage, feedbackType: 'LIKE' | 'DISLIKE') {
  await sendFeedback({ messageId: message.id, feedbackType })
  ElMessage.success(feedbackType === 'LIKE' ? '已记录有帮助反馈' : '已记录不准确反馈')
}

function openReferenceDialog(ref: ChatReference) {
  currentReference.value = ref
  referenceDialogVisible.value = true
}

function closeReferenceDialog() {
  referenceDialogVisible.value = false
}

function goDocumentDetail(ref: ChatReference | null) {
  if (!ref?.documentId) {
    ElMessage.warning('缺少文档 ID，无法跳转')
    return
  }
  router.push(`/app/documents/${ref.documentId}`)
}

function downloadBlob(response: any, fallbackName: string) {
  const blob = response?.data instanceof Blob ? response.data : new Blob([response?.data || ''])
  const disposition = response?.headers?.['content-disposition'] || ''
  const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i)
  const filename = match ? decodeURIComponent(match[1]) : fallbackName
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

async function exportSession(type: 'markdown' | 'pdf' | 'word') {
  exporting.value = true
  try {
    const response = await exportChat(sessionId, type)
    const ext = type === 'word' ? 'docx' : type === 'markdown' ? 'md' : 'pdf'
    downloadBlob(response, `chat-session-${sessionId}.${ext}`)
  } finally {
    exporting.value = false
  }
}

onMounted(loadDetail)
</script>

<template>
  <div class="session-detail-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ session?.title || `会话 #${sessionId}` }}</h1>
        <div class="page-desc">{{ session?.knowledgeBaseName || '未关联知识库' }} · {{ messageCountOf(session) }} 条消息 · {{ timeOf(session) }}</div>
      </div>
      <div class="header-actions">
        <el-button plain @click="router.push('/app/history')">返回历史</el-button>
        <el-button plain :loading="loading" @click="loadDetail">刷新</el-button>
        <el-button plain @click="clearMessages">清空</el-button>
        <el-dropdown :disabled="exporting" @command="exportSession">
          <el-button type="primary" plain :loading="exporting">导出</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="markdown">Markdown</el-dropdown-item>
              <el-dropdown-item command="pdf">PDF</el-dropdown-item>
              <el-dropdown-item command="word">Word</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <el-alert v-if="errorMessage" class="state-alert" type="error" show-icon :closable="false" :title="errorMessage" />

    <section class="soft-card chat-main" v-loading="loading">
      <div ref="messageListRef" class="message-list">
        <el-empty v-if="!messages.length && !thinking" description="暂无消息" />
        <div v-for="(message, index) in messages" :key="message.id" class="message-row" :class="message.role">
          <div v-if="message.role === 'assistant'" class="avatar ai">AI</div>

          <div class="bubble" :class="message.role === 'user' ? 'user-bubble' : 'assistant-bubble'">
            <p v-if="message.role === 'user'" class="user-text">{{ message.content }}</p>
            <div v-else class="assistant-content markdown-body" v-html="assistantHtml(message)" />

            <div v-if="isNoContextMessage(message)" class="no-context-box">
              <div class="no-context-title">当前知识库未找到足够相关资料</div>
              <div class="no-context-body">{{ getNoContextBody(message) }}</div>
              <div v-if="shouldShowGeneralAnswerButton(message)" class="no-context-action">
                <el-button type="warning" plain size="small" :loading="isRetryLoading(message.id)" @click="askGeneralForMessage(message, index)">
                  允许 AI 基于通用知识回答
                </el-button>
              </div>
              <div class="no-context-hint">通用回答不提供知识库引用来源。</div>
            </div>

            <div v-if="isGeneralAnswer(message)" class="general-hint">通用回答不提供知识库引用来源。</div>

            <div v-if="isRagAnswer(message) && validReferences(message).length" class="reference-box">
              <strong>引用来源 {{ validReferences(message).length }} 条</strong>
              <div
                v-for="(ref, refIndex) in visibleReferences(message)"
                :key="`${message.id}-${refIndex}`"
                class="reference-item"
                @click="openReferenceDialog(ref)"
              >
                [{{ refIndex + 1 }}] {{ getReferenceDocumentName(ref) }} · 切片 {{ getReferenceChunkLabel(ref) }} · 相似度 {{ referenceScore(ref) }}
              </div>
              <el-button v-if="hasMoreReferences(message)" link type="primary" @click="toggleShowAllRefs(message.id)">
                {{ showAllRefsMap[message.id] ? '收起引用' : `查看全部 ${validReferences(message).length} 条引用` }}
              </el-button>
            </div>

            <div v-if="isRagAnswer(message) && !validReferences(message).length" class="empty-reference">暂无引用来源</div>

            <div v-if="message.role === 'assistant'" class="message-actions">
              <el-button link type="primary" @click="feedback(message, 'LIKE')">有帮助</el-button>
              <el-button link type="warning" @click="feedback(message, 'DISLIKE')">不准确</el-button>
            </div>
          </div>

          <div v-if="message.role === 'user'" class="avatar me">我</div>
        </div>
      </div>

      <div class="input-area">
        <el-input
          v-model="question"
          type="textarea"
          :rows="3"
          resize="none"
          maxlength="1000"
          show-word-limit
          placeholder="输入追问内容（Enter 发送，Shift + Enter 换行）"
          @keydown.enter.exact.prevent="askFollowUp(false)"
        />
        <div class="input-footer">
          <el-button plain :loading="thinking" @click="regenerate">重新生成</el-button>
          <el-button type="primary" :disabled="!canAsk" :loading="thinking" @click="askFollowUp(false)">发送追问</el-button>
        </div>
      </div>
    </section>

    <el-dialog v-model="referenceDialogVisible" title="引用详情" width="760px" @close="closeReferenceDialog">
      <div v-if="currentReference" class="reference-dialog-content">
        <p><strong>文档：</strong>{{ getReferenceDocumentName(currentReference) }}</p>
        <p><strong>切片序号：</strong>{{ getReferenceChunkLabel(currentReference) }}</p>
        <p><strong>相似度：</strong>{{ referenceScore(currentReference) }}</p>
        <p v-if="(currentReference as any).hitReason"><strong>命中原因：</strong>{{ (currentReference as any).hitReason }}</p>
        <div class="reference-dialog-body">{{ currentReference.content || currentReference.snippet || '后端未返回引用片段内容' }}</div>
      </div>
      <template #footer>
        <el-button @click.stop="closeReferenceDialog">关闭</el-button>
        <el-button type="primary" @click.stop="goDocumentDetail(currentReference)">查看文档详情</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.session-detail-page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header-actions,
.message-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.chat-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.message-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f6f8fc;
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.message-row.user {
  justify-content: flex-end;
}

.message-row.assistant {
  justify-content: flex-start;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.avatar.ai {
  background: #e8eefc;
  color: #2563eb;
}

.avatar.me {
  background: #2563eb;
  color: #fff;
}

.bubble {
  border-radius: 16px;
  padding: 12px 16px;
  word-break: break-word;
}

.user-bubble {
  max-width: 70%;
  background: #2563eb;
  color: #fff;
  border-radius: 16px 16px 4px 16px;
}

.assistant-bubble {
  max-width: 75%;
  background: #fff;
  color: #1f2937;
  border: 1px solid #e5e7eb;
  border-radius: 16px 16px 16px 4px;
}

.user-text {
  margin: 0;
  white-space: pre-wrap;
}

.markdown-body :deep(p),
.markdown-body :deep(ul),
.markdown-body :deep(ol),
.markdown-body :deep(pre),
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin: 0 0 8px;
}

.markdown-body :deep(pre) {
  background: #111827;
  color: #f9fafb;
  border-radius: 8px;
  padding: 10px;
  overflow-x: auto;
}

.markdown-body :deep(code) {
  background: #f3f4f6;
  border-radius: 4px;
  padding: 1px 4px;
}

.no-context-box {
  padding: 8px 10px;
  border: 1px solid #fde68a;
  background: #fef3c7;
  border-radius: 8px;
  display: grid;
  gap: 6px;
  margin-top: 8px;
}

.no-context-title {
  font-size: 13px;
  color: #92400e;
  font-weight: 700;
}

.no-context-body,
.no-context-hint {
  font-size: 13px;
  color: #92400e;
}

.general-hint,
.empty-reference {
  margin-top: 8px;
  color: #6b7280;
  font-size: 13px;
}

.reference-box {
  margin-top: 12px;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 13px;
  display: grid;
  gap: 6px;
}

.reference-item {
  padding: 4px 6px;
  border-radius: 6px;
  cursor: pointer;
}

.reference-item:hover {
  background: #eff6ff;
}

.message-actions {
  margin-top: 8px;
}

.input-area {
  border-top: 1px solid var(--color-border);
  padding: 14px 16px;
  background: #fff;
  flex-shrink: 0;
}

.input-footer {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.reference-dialog-content {
  max-height: 56vh;
  overflow: auto;
}

.reference-dialog-content p {
  margin: 0 0 8px;
}

.reference-dialog-body {
  margin-top: 10px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 8px;
  padding: 10px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
