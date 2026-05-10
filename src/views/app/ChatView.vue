<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  askKnowledgeBase,
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
import { normalizeRole, referenceContentOf, referenceScoreOf, referenceTitleOf, timeOf } from '@/utils/view-adapters'

const MAX_QUESTION_LENGTH = 1000
const route = useRoute()
const router = useRouter()

const selectedKb = ref<number>()
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
const messageListRef = ref<HTMLElement>()

const currentSession = computed(() => sessions.value.find((item) => item.id === sessionId.value) || null)
const canUseSessionActions = computed(() => !!sessionId.value)
const questionLength = computed(() => question.value.trim().length)
const selectedKnowledgeBase = computed(() => knowledgeBases.value.find((item) => item.id === selectedKb.value) || null)
const selectedKbDocCount = computed(() => Number((selectedKnowledgeBase.value as any)?.documentCount ?? selectedKnowledgeBase.value?.docCount ?? 0))
const canAsk = computed(() => !!selectedKb.value && selectedKbDocCount.value > 0 && questionLength.value > 0 && questionLength.value <= MAX_QUESTION_LENGTH && !thinking.value)

function normalizeMessage(item: any): ChatMessage {
  return {
    ...item,
    role: normalizeRole(item.role),
    references: item.references || [],
    found: item?.found,
    basedOnKnowledgeBase: item?.basedOnKnowledgeBase,
    noAnswerReason: item?.noAnswerReason,
  }
}

function referenceList(message: ChatMessage): Array<string | ChatReference> {
  return message.references || []
}

function isNoAnswerMessage(message: ChatMessage) {
  return message.role === 'assistant' && (message.found === false || message.noAnswerReason === 'LOW_SIMILARITY')
}

function isGeneralAnswer(message: ChatMessage) {
  return message.role === 'assistant' && message.basedOnKnowledgeBase === false
}

function shouldShowGeneralAnswerButton(message: ChatMessage) {
  return isNoAnswerMessage(message)
}

function getNoAnswerText(message: ChatMessage) {
  if (message.noAnswerReason === 'LOW_SIMILARITY') return '当前知识库未找到足够相关的资料'
  if (message.found === false) return '当前知识库未找到可用答案'
  return ''
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

async function loadKnowledgeBases() {
  const data = await getKnowledgeBasePage({ pageNo: 1, pageSize: 100, sortBy: 'updateTime' })
  knowledgeBases.value = data.list || []
  const queryKb = Number(route.query.knowledgeBaseId || 0)
  selectedKb.value = data.list?.find((item) => item.id === queryKb)?.id || data.list?.[0]?.id
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
  if (row.knowledgeBaseId) selectedKb.value = row.knowledgeBaseId
  await loadMessages(row.id)
}

function newSession() {
  sessionId.value = null
  chatMessages.value = []
  question.value = ''
  askError.value = ''
  retryGeneralLoading.value = {}
}

async function doAsk(allowGeneralAnswer = false, overrideQuestion?: string) {
  const q = (overrideQuestion ?? question.value).trim()
  if (!selectedKb.value) return ElMessage.warning('请先选择知识库')
  if (selectedKbDocCount.value <= 0) return ElMessage.warning('当前知识库暂无可问答文档，请先上传并等待解析完成')
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
    const result = await askKnowledgeBase({
      knowledgeBaseId: selectedKb.value,
      sessionId: sessionId.value,
      question: q,
      allowGeneralAnswer,
    })
    sessionId.value = result.sessionId
    const assistantMessage: ChatMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: result.answer || '',
      references: result.references || [],
      found: result.found,
      basedOnKnowledgeBase: result.basedOnKnowledgeBase,
      noAnswerReason: result.noAnswerReason,
    }
    chatMessages.value.push(assistantMessage)
    await loadSessions()
    await scrollToBottom(true)
  } catch (error) {
    askError.value = error instanceof Error ? error.message : '问答请求失败，请稍后重试'
  } finally {
    thinking.value = false
  }
}

async function ask() {
  await doAsk(false)
}

async function askGeneralForMessage(message: ChatMessage, index: number) {
  if (!selectedKb.value || !sessionId.value) return ElMessage.warning('请先选择知识库并开始会话')
  if (isRetryLoading(message.id)) return
  const originalQuestion = findPreviousUserQuestion(index)
  if (!originalQuestion) return ElMessage.warning('未找到该回复对应的问题')
  setRetryLoading(message.id, true)
  try {
    const result = await askKnowledgeBase({
      knowledgeBaseId: selectedKb.value,
      sessionId: sessionId.value,
      question: originalQuestion,
      allowGeneralAnswer: true,
    })
    sessionId.value = result.sessionId
    chatMessages.value[index] = {
      ...message,
      content: result.answer || message.content,
      references: result.references || [],
      found: result.found,
      basedOnKnowledgeBase: result.basedOnKnowledgeBase ?? false,
      noAnswerReason: result.noAnswerReason ?? null,
    }
    ElMessage.success('已生成通用回答')
    await loadSessions()
    await scrollToBottom(true)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '通用回答生成失败，请稍后重试')
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
    chatMessages.value.push({
      id: Date.now(),
      role: 'assistant',
      content: result.answer,
      references: result.references || [],
      found: result.found,
      basedOnKnowledgeBase: result.basedOnKnowledgeBase,
      noAnswerReason: result.noAnswerReason,
    })
    ElMessage.success('已重新生成回答')
    await scrollToBottom(true)
  } finally {
    thinking.value = false
  }
}

async function feedback(message: ChatMessage, feedbackType: 'LIKE' | 'DISLIKE') {
  await sendFeedback({ messageId: message.id, feedbackType })
  ElMessage.success(feedbackType === 'LIKE' ? '已记录有帮助反馈' : '已记录问题反馈')
}

function openReference(ref: string | ChatReference) {
  const title = referenceTitleOf(ref)
  const content = referenceContentOf(ref) || (typeof ref === 'string' ? ref : '后端未返回引用片段内容')
  const meta =
    typeof ref === 'string'
      ? ''
      : `文档：${ref.documentName || '-'}\n切片序号：${ref.chunkIndex ?? '-'}\n相似度：${ref.score ?? '-'}\n\n`
  ElMessageBox.alert(`${meta}${content}`, title, {
    confirmButtonText: typeof ref !== 'string' && ref.documentId ? '查看文档详情' : '知道了',
    callback: () => {
      if (typeof ref !== 'string' && ref.documentId) router.push(`/app/documents/${ref.documentId}`)
    },
  })
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

onMounted(async () => {
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
        <el-select v-model="selectedKb" style="width: 100%" placeholder="选择知识库">
          <el-option v-for="kb in knowledgeBases" :key="kb.id" :label="kb.name" :value="kb.id" />
        </el-select>
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

      <div ref="messageListRef" class="message-list" v-loading="loadingMessages">
        <el-alert v-if="askError" type="error" show-icon :closable="false" :title="askError" />
        <el-empty v-if="!chatMessages.length && !thinking && !loadingMessages" description="开始一次知识库问答" />
        <div v-for="(message, index) in chatMessages" :key="message.id" class="message" :class="message.role">
          <div class="avatar">{{ message.role === 'user' ? '我' : 'AI' }}</div>
          <div class="bubble">
            <div v-if="isNoAnswerMessage(message)" class="no-answer-tip">{{ getNoAnswerText(message) }}</div>
            <el-tag v-if="isGeneralAnswer(message)" type="info" size="small">该回答未基于当前知识库资料生成</el-tag>
            <p>{{ message.content }}</p>

            <div v-if="message.role === 'assistant' && shouldShowGeneralAnswerButton(message)" class="inline-general-action">
              <el-button type="warning" plain size="small" :loading="isRetryLoading(message.id)" @click="askGeneralForMessage(message, index)">
                允许 AI 基于通用知识回答
              </el-button>
            </div>

            <div v-if="message.role === 'assistant' && !isGeneralAnswer(message)" class="references">
              <strong>引用来源</strong>
              <div v-if="!referenceList(message).length" class="empty-reference">暂无引用来源</div>
              <article v-for="(ref, refIndex) in referenceList(message)" v-else :key="refIndex" class="reference-card" @click="openReference(ref)">
                <div class="reference-head">
                  <span>{{ referenceTitleOf(ref, refIndex) }}</span>
                  <el-tag v-if="referenceScoreOf(ref)" size="small" effect="plain">相似度 {{ referenceScoreOf(ref) }}</el-tag>
                </div>
                <p>切片序号：{{ typeof ref === 'string' ? '-' : (ref.chunkIndex ?? '-') }}</p>
                <p v-if="referenceContentOf(ref)">{{ referenceContentOf(ref) }}</p>
              </article>
            </div>
            <div v-if="message.role === 'assistant' && isGeneralAnswer(message)" class="empty-reference">通用回答不提供知识库引用来源</div>
            <div v-if="message.role === 'assistant'" class="message-actions">
              <el-button link type="primary" @click="feedback(message, 'LIKE')">有帮助</el-button>
              <el-button link type="warning" @click="feedback(message, 'DISLIKE')">不准确</el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="input-area">
        <el-input v-model="question" type="textarea" :rows="3" resize="none" maxlength="1000" show-word-limit placeholder="输入你的问题，Ctrl + Enter 发送" @keyup.ctrl.enter="ask" />
        <div class="input-footer">
          <div class="input-actions">
            <el-button plain :disabled="!sessionId" :loading="thinking" @click="regenerate">重新生成</el-button>
            <el-button type="primary" :disabled="!canAsk" :loading="thinking" @click="ask">发送问题</el-button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.chat-page {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 16px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.sidebar-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
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
  border-radius: 12px;
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
  min-width: 0;
  height: 100%;
  min-height: 0;
}

.chat-head {
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
}

.message-list {
  flex: 1;
  min-height: 0;
  padding: 22px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.message {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 12px;
}

.message.user {
  grid-template-columns: minmax(0, 1fr) 42px;
}

.message.user .avatar {
  grid-column: 2;
}

.message.user .bubble {
  grid-column: 1;
  justify-self: end;
  background: var(--color-primary);
  color: #fff;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: var(--color-primary-weak);
  color: var(--color-primary);
  font-weight: 800;
}

.bubble {
  max-width: 820px;
  padding: 14px 16px;
  border-radius: 16px;
  background: var(--color-surface-soft);
  line-height: 1.7;
  display: grid;
  gap: 10px;
}

.bubble > p {
  margin: 0;
  white-space: pre-wrap;
}

.no-answer-tip {
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fde68a;
}

.inline-general-action {
  margin-top: 2px;
}

.references {
  margin-top: 10px;
  display: grid;
  gap: 8px;
}

.reference-card {
  padding: 10px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid var(--color-border);
  cursor: pointer;
}

.reference-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-weight: 700;
}

.reference-card p {
  margin: 4px 0 0;
  color: var(--color-text-muted);
  white-space: pre-wrap;
}

.reference-card p:last-child {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.empty-reference {
  color: var(--color-text-muted);
  font-size: 13px;
}

.message-actions {
  margin-top: 6px;
}

.message-list :deep(.el-empty) {
  margin: auto 0;
  align-self: center;
}

.input-area {
  padding: 18px;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

.input-footer {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1080px) {
  .chat-page {
    grid-template-columns: 1fr;
    height: 100%;
  }

  .chat-main {
    min-height: 560px;
  }

  .chat-head {
    flex-direction: column;
  }
}
</style>
