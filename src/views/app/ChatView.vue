<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  askKnowledgeBase,
  chatWithDocument,
  clearChatMessages,
  deleteChatSession,
  exportChat,
  getChatMessages,
  getChatSessionPage,
  getKnowledgeBasePage,
  regenerateAnswer,
  renameChatSession,
  sendFeedback,
} from '@/api/knowledge'
import type { ChatMessage, ChatReference, ChatSession, KnowledgeBase } from '@/types'
import { normalizeRole, timeOf } from '@/utils/view-adapters'
import { renderMarkdownSafe } from '@/utils/markdown'
import { asBizCode, BusinessError, friendlyRagMessage, isRagFriendlyCode } from '@/utils/business-error'

const MAX_QUESTION_LENGTH = 1000
const route = useRoute()
const router = useRouter()

const selectedKb = ref<number>()
const currentDocumentId = ref<number | null>(null)
const currentDocumentName = ref('')
const question = ref('')
const knowledgeBases = ref<KnowledgeBase[]>([])
const chatMessages = ref<ChatMessage[]>([])
const sessions = ref<ChatSession[]>([])
const thinking = ref(false)
const loadingSessions = ref(false)
const loadingMessages = ref(false)
const exporting = ref(false)
const askError = ref('')
const sessionId = ref<number | null>(null)
const sessionPager = reactive({ pageNo: 1, pageSize: 12, total: 0 })
const retryGeneralLoading = ref<Record<number, boolean>>({})
const showAllRefsMap = ref<Record<number, boolean>>({})
const messageListRef = ref<HTMLElement>()

const referenceDialogVisible = ref(false)
const currentReference = ref<ChatReference | null>(null)
const missingRefNameWarned = ref<Record<number, boolean>>({})

const currentSession = computed(() => sessions.value.find((item) => item.id === sessionId.value) || null)
const canUseSessionActions = computed(() => !!sessionId.value)
const questionLength = computed(() => question.value.trim().length)
const selectedKnowledgeBase = computed(() => knowledgeBases.value.find((item) => item.id === selectedKb.value) || null)
const selectedKbDocCount = computed(() => Number((selectedKnowledgeBase.value as any)?.documentCount ?? selectedKnowledgeBase.value?.docCount ?? 0))
const isDocumentMode = computed(() => route.query.scope === 'document')
const canAsk = computed(() => {
  if (isDocumentMode.value) {
    return !!currentDocumentId.value && questionLength.value > 0 && questionLength.value <= MAX_QUESTION_LENGTH && !thinking.value
  }
  return !!selectedKb.value && selectedKbDocCount.value > 0 && questionLength.value > 0 && questionLength.value <= MAX_QUESTION_LENGTH && !thinking.value
})

function normalizeMessage(item: any): ChatMessage {
  return {
    ...item,
    role: normalizeRole(item.role),
    question: String(item?.question ?? ''),
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
  const fallback = friendlyRagMessage(message.noAnswerReason)
  return message.noAnswerReason ? friendlyRagMessage(message.noAnswerReason, fallback) : fallback
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
    console.warn('[Chat] reference documentId exists but documentName is missing.', ref)
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
  const value = Number((ref as any).similarityScore ?? (ref as any).finalScore ?? (ref as any).score)
  if (!Number.isFinite(value)) return '-'
  const percent = value <= 1 ? value * 100 : value
  return `${percent.toFixed(2)}%`
}

function validReferences(message: ChatMessage): ChatReference[] {
  if (!isRagAnswer(message)) return []
  const refs = Array.isArray(message.references) ? message.references : []
  return refs.filter((item): item is ChatReference => typeof item === 'object' && !!item)
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
    const m = chatMessages.value[i]
    if (m?.role === 'user' && m?.content?.trim()) return m.content.trim()
  }
  return ''
}

function assistantHtml(message: ChatMessage) {
  return renderMarkdownSafe(message.content || '')
}

function referenceDialogHtml(ref: ChatReference | null) {
  const content =
    (ref as any)?.snippet ||
    (ref as any)?.chunkContent ||
    ref?.content ||
    (ref as any)?.text ||
    (ref as any)?.summary ||
    ''
  const safe = String(content || '').trim()
  return renderMarkdownSafe(safe || '暂无片段内容')
}

function appendFriendlyAssistantMessage(code: unknown, message?: string) {
  chatMessages.value.push(
    normalizeMessage({
      id: Date.now() + 1,
      role: 'assistant',
      answerType: 'NO_CONTEXT',
      content: message || friendlyRagMessage(code),
      noAnswerReason: asBizCode(code),
      references: [],
      found: false,
      basedOnKnowledgeBase: true,
    }),
  )
}

function applyScopeFromQuery() {
  const docId = Number(route.query.documentId || 0)
  if (route.query.scope === 'document' && Number.isFinite(docId) && docId > 0) {
    currentDocumentId.value = docId
    currentDocumentName.value = String(route.query.documentName || '').trim()
  } else {
    currentDocumentId.value = null
    currentDocumentName.value = ''
  }
}

function ensureKnowledgeBaseSelected() {
  if (isDocumentMode.value) return
  if (selectedKb.value && knowledgeBases.value.some((item) => item.id === selectedKb.value)) return
  const queryKb = Number(route.query.knowledgeBaseId || 0)
  selectedKb.value = knowledgeBases.value.find((item) => item.id === queryKb)?.id || knowledgeBases.value[0]?.id
}

async function loadKnowledgeBases() {
  const data = await getKnowledgeBasePage({ pageNo: 1, pageSize: 100, sortBy: 'updateTime' })
  knowledgeBases.value = data.list || []
  ensureKnowledgeBaseSelected()
}

async function loadSessions() {
  loadingSessions.value = true
  try {
    const data = await getChatSessionPage({ pageNo: sessionPager.pageNo, pageSize: sessionPager.pageSize })
    sessions.value = data.list || []
    sessionPager.total = data.total || 0
    sessionPager.pageNo = data.pageNo || sessionPager.pageNo
    sessionPager.pageSize = data.pageSize || sessionPager.pageSize
  } finally {
    loadingSessions.value = false
  }
}

async function loadMessages(id: number) {
  loadingMessages.value = true
  try {
    chatMessages.value = (await getChatMessages(id)).map(normalizeMessage)
    await scrollToBottom()
  } finally {
    loadingMessages.value = false
  }
}

async function selectSession(row: ChatSession) {
  sessionId.value = row.id
  if (!isDocumentMode.value && row.knowledgeBaseId) selectedKb.value = row.knowledgeBaseId
  await loadMessages(row.id)
}

function newSession() {
  sessionId.value = null
  chatMessages.value = []
  question.value = ''
  askError.value = ''
  retryGeneralLoading.value = {}
}

function switchToKnowledgeBaseMode() {
  newSession()
  currentDocumentId.value = null
  currentDocumentName.value = ''
  const query: Record<string, string> = {}
  if (selectedKb.value) query.knowledgeBaseId = String(selectedKb.value)
  router.replace({ path: '/app/chat', query })
}

async function doAsk(allowGeneralAnswer = false, overrideQuestion?: string) {
  const q = (overrideQuestion ?? question.value).trim()
  if (isDocumentMode.value) {
    if (!currentDocumentId.value) return ElMessage.warning('缺少 documentId，无法发起指定文档问答')
  } else {
    if (!selectedKb.value) return ElMessage.warning('请先选择知识库')
    if (selectedKbDocCount.value <= 0) return ElMessage.warning('当前知识库暂无可问答文档，请先上传并等待解析完成')
  }
  if (!q) return ElMessage.warning('请输入问题')
  if (q.length > MAX_QUESTION_LENGTH) return ElMessage.warning(`问题不能超过 ${MAX_QUESTION_LENGTH} 个字符`)
  if (thinking.value) return

  if (!allowGeneralAnswer) {
    chatMessages.value.push({ id: Date.now(), role: 'user', content: q })
    question.value = ''
  }
  thinking.value = true
  askError.value = ''
  try {
    const result = isDocumentMode.value
      ? await chatWithDocument(currentDocumentId.value as number, {
          sessionId: sessionId.value,
          question: q,
          allowGeneralAnswer,
        })
      : await askKnowledgeBase({
          knowledgeBaseId: selectedKb.value as number,
          sessionId: sessionId.value,
          question: q,
          allowGeneralAnswer,
        })
    sessionId.value = result.sessionId
    chatMessages.value.push(normalizeMessage({ id: Date.now() + 1, role: 'assistant', ...result, content: result.answer }))
    await loadSessions()
    await scrollToBottom(true)
  } catch (error) {
    if (error instanceof BusinessError && isRagFriendlyCode(error.bizCode)) {
      appendFriendlyAssistantMessage(error.bizCode, error.message)
      await scrollToBottom(true)
    } else {
      askError.value = error instanceof Error ? error.message : '问答请求失败，请稍后重试'
    }
  } finally {
    thinking.value = false
  }
}

async function ask() {
  await doAsk(false)
}

async function askGeneralForMessage(message: ChatMessage, index: number) {
  if (!isDocumentMode.value && !selectedKb.value) return ElMessage.warning('请先选择知识库')
  if (isDocumentMode.value && !currentDocumentId.value) return ElMessage.warning('缺少 documentId，无法生成通用回答')
  if (isRetryLoading(message.id)) return
  const originalQuestion = String((message as any).question || '').trim() || findPreviousUserQuestion(index)
  if (!originalQuestion) return ElMessage.warning('未找到该回复对应的用户问题')
  const retrySessionId = Number((message as any).sessionId ?? sessionId.value)
  const normalizedRetrySessionId = Number.isFinite(retrySessionId) && retrySessionId > 0 ? retrySessionId : null
  setRetryLoading(message.id, true)
  try {
    const result = isDocumentMode.value
      ? await chatWithDocument(currentDocumentId.value as number, {
          sessionId: normalizedRetrySessionId,
          question: originalQuestion,
          allowGeneralAnswer: true,
        })
      : await askKnowledgeBase({
          knowledgeBaseId: selectedKb.value as number,
          sessionId: normalizedRetrySessionId,
          question: originalQuestion,
          allowGeneralAnswer: true,
        })
    if (Number.isFinite(Number(result.sessionId)) && Number(result.sessionId) > 0) {
      sessionId.value = Number(result.sessionId)
    }
    chatMessages.value[index] = normalizeMessage({ ...message, ...result, content: result.answer })
    ElMessage.success('已生成通用回答')
    await loadSessions()
    await scrollToBottom(true)
  } catch (error) {
    if (error instanceof BusinessError && isRagFriendlyCode(error.bizCode)) {
      chatMessages.value[index] = normalizeMessage({ ...message, content: error.message || friendlyRagMessage(error.bizCode), references: [] })
      ElMessage.warning(error.message || friendlyRagMessage(error.bizCode))
      await scrollToBottom(true)
    } else {
      ElMessage.error(error instanceof Error ? error.message : '通用回答生成失败，请稍后重试')
    }
  } finally {
    setRetryLoading(message.id, false)
  }
}

async function removeSession(row = currentSession.value) {
  if (!row) return
  await ElMessageBox.confirm(`确认删除会话「${row.title || row.id}」吗？`, '删除确认', { type: 'warning' })
  await deleteChatSession(row.id)
  ElMessage.success('会话已删除')
  if (sessionId.value === row.id) newSession()
  await loadSessions()
}

async function renameSession(row = currentSession.value) {
  if (!row) return
  const result = await ElMessageBox.prompt('请输入新的会话标题', '重命名会话', {
    inputValue: row.title || '',
    inputValidator: (value) => !!value.trim() || '标题不能为空',
  })
  await renameChatSession(row.id, result.value.trim())
  ElMessage.success('会话已重命名')
  await loadSessions()
}

async function clearCurrentMessages() {
  if (!sessionId.value) return
  await ElMessageBox.confirm('确认清空当前会话消息吗？', '清空确认', { type: 'warning' })
  await clearChatMessages(sessionId.value)
  chatMessages.value = []
  ElMessage.success('会话消息已清空')
}

async function regenerate() {
  if (!sessionId.value || thinking.value) return
  thinking.value = true
  try {
    const result = await regenerateAnswer(sessionId.value)
    chatMessages.value.push(normalizeMessage({ id: Date.now(), role: 'assistant', ...result, content: result.answer }))
    ElMessage.success('已重新生成回答')
    await scrollToBottom(true)
  } finally {
    thinking.value = false
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
  if (!sessionId.value) return
  exporting.value = true
  try {
    const response = await exportChat(sessionId.value, type)
    const ext = type === 'word' ? 'docx' : type === 'markdown' ? 'md' : 'pdf'
    downloadBlob(response, `chat-session-${sessionId.value}.${ext}`)
  } finally {
    exporting.value = false
  }
}

watch(
  () => chatMessages.value.length,
  async () => {
    await scrollToBottom()
  },
)

watch(
  () => route.query,
  () => {
    applyScopeFromQuery()
    ensureKnowledgeBaseSelected()
  },
  { immediate: true },
)

onMounted(async () => {
  applyScopeFromQuery()
  await Promise.all([loadKnowledgeBases(), loadSessions()])
})
</script>

<template>
  <div class="chat-page">
    <aside class="chat-sidebar soft-card">
      <div class="soft-card-body sidebar-body">
        <div class="sidebar-head">
          <h3 class="section-title">会话</h3>
          <el-button type="primary" size="small" @click="newSession"><el-icon><Plus /></el-icon>新建</el-button>
        </div>
        <el-select v-if="!isDocumentMode" v-model="selectedKb" style="width: 100%" placeholder="选择知识库">
          <el-option v-for="kb in knowledgeBases" :key="kb.id" :label="kb.name" :value="kb.id" />
        </el-select>
        <el-alert
          v-else
          type="info"
          :closable="false"
          show-icon
          :title="`指定文档模式：${currentDocumentName || `文档 #${currentDocumentId}`}`"
        />
        <div class="session-list" v-loading="loadingSessions">
          <button v-for="item in sessions" :key="item.id" class="session-item" :class="{ active: item.id === sessionId }" @click="selectSession(item)">
            <strong>{{ item.title || `会话 #${item.id}` }}</strong>
            <span>{{ item.knowledgeBaseName || '未关联知识库' }}</span>
            <small>{{ timeOf(item) }}</small>
          </button>
          <el-empty v-if="!loadingSessions && !sessions.length" description="暂无历史会话" />
        </div>
      </div>
    </aside>

    <section class="chat-main soft-card">
      <div class="chat-head">
        <div><h1>{{ currentSession?.title || '智能问答' }}</h1></div>
        <div class="head-actions">
          <el-button v-if="isDocumentMode" plain type="primary" @click="switchToKnowledgeBaseMode">切换回知识库问答</el-button>
          <el-button plain :disabled="!canUseSessionActions" @click="renameSession()">重命名</el-button>
          <el-button plain :disabled="!canUseSessionActions" @click="clearCurrentMessages">清空</el-button>
          <el-button plain :disabled="!canUseSessionActions" @click="removeSession()">删除</el-button>
          <el-dropdown :disabled="!canUseSessionActions || exporting" @command="exportSession">
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

      <el-alert
        v-if="isDocumentMode"
        class="scope-alert"
        type="warning"
        :closable="false"
        show-icon
        :title="`当前范围：指定文档 - ${currentDocumentName || `文档 #${currentDocumentId}`}`"
      />

      <div ref="messageListRef" class="message-list" v-loading="loadingMessages">
        <el-alert v-if="askError" type="error" show-icon :closable="false" :title="askError" />
        <el-empty v-if="!chatMessages.length && !thinking && !loadingMessages" description="开始一次知识库问答" />
        <div v-for="(message, index) in chatMessages" :key="message.id" class="message-row" :class="message.role">
          <div v-if="message.role === 'assistant'" class="avatar ai">AI</div>

          <div class="bubble" :class="message.role === 'user' ? 'user-bubble' : 'assistant-bubble'">
            <p v-if="message.role === 'user'" class="user-text">{{ message.content }}</p>
            <div v-else-if="isNoContextMessage(message)" class="no-context-box">
              <div class="no-context-title">当前知识库未找到足够相关资料</div>
              <div class="no-context-body">{{ getNoContextBody(message) }}</div>
              <div v-if="shouldShowGeneralAnswerButton(message)" class="no-context-action">
                <el-button type="warning" plain size="small" :loading="isRetryLoading(message.id)" @click="askGeneralForMessage(message, index)">
                  允许 AI 基于通用知识回答
                </el-button>
              </div>
              <div class="no-context-hint">通用回答不提供知识库引用来源。</div>
            </div>
            <div v-else class="assistant-content markdown-body" v-html="assistantHtml(message)" />

            <div v-if="isGeneralAnswer(message)" class="general-hint">通用回答不提供知识库引用来源。</div>

            <div v-if="isRagAnswer(message) && validReferences(message).length" class="reference-box">
              <strong>引用来源 {{ validReferences(message).length }} 条</strong>
              <div
                v-for="(ref, refIndex) in visibleReferences(message)"
                :key="`${message.id}-${refIndex}`"
                class="reference-item"
                @click="openReferenceDialog(ref)"
              >
                <div>[{{ refIndex + 1 }}] {{ getReferenceDocumentName(ref) }} · 切片 {{ getReferenceChunkLabel(ref) }} · 相似度：{{ referenceScore(ref) }}</div>
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
          placeholder="输入你的问题（Enter 发送，Shift + Enter 换行）"
          @keydown.enter.exact.prevent="ask"
        />
        <div class="input-footer">
          <div v-if="!isDocumentMode && !selectedKb" class="input-hint">请先选择知识库后再提问。</div>
          <div class="input-actions">
            <el-button plain :disabled="!sessionId" :loading="thinking" @click="regenerate">重新生成</el-button>
            <el-button type="primary" :disabled="!canAsk" :loading="thinking" @click="ask">发送</el-button>
          </div>
        </div>
      </div>
    </section>

    <el-dialog v-model="referenceDialogVisible" title="引用来源详情" width="760px" @close="closeReferenceDialog">
      <div v-if="currentReference" class="reference-dialog-content">
        <p><strong>文档：</strong>{{ getReferenceDocumentName(currentReference) }}</p>
        <p><strong>切片序号：</strong>{{ getReferenceChunkLabel(currentReference) }}</p>
        <p><strong>相似度：</strong>{{ referenceScore(currentReference) }}</p>
        <p v-if="(currentReference as any).hitReason"><strong>命中原因：</strong>{{ (currentReference as any).hitReason }}</p>
        <div class="reference-dialog-body markdown-body" v-html="referenceDialogHtml(currentReference)" />
      </div>
      <template #footer>
        <el-button @click.stop="closeReferenceDialog">关闭</el-button>
        <el-button type="primary" @click.stop="goDocumentDetail(currentReference)">查看文档详情</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.chat-page {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.chat-sidebar,
.chat-main {
  min-height: 0;
}

.sidebar-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
}

.sidebar-head,
.head-actions,
.input-actions,
.message-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sidebar-head {
  justify-content: space-between;
}

.session-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  align-content: start;
  gap: 8px;
}

.session-item {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-soft);
  text-align: left;
  cursor: pointer;
}

.session-item.active {
  border-color: var(--color-primary);
  background: var(--color-primary-weak);
}

.session-item strong,
.session-item span,
.session-item small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.chat-head {
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
}

.scope-alert {
  margin: 12px 20px 0;
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

.message-list :deep(.el-empty) {
  margin: auto 0;
  align-self: center;
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
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.input-hint {
  color: #92400e;
  font-size: 13px;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 4px 10px;
}

.input-actions {
  margin-left: auto;
  justify-content: flex-end;
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

@media (max-width: 1080px) {
  .chat-page {
    grid-template-columns: 1fr;
  }

  .chat-head {
    flex-direction: column;
  }
}
</style>
