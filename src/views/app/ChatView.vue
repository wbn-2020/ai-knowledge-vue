<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
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
import { kbNameOf, normalizeRole, referenceContentOf, referenceScoreOf, referenceTitleOf, timeOf } from '@/utils/view-adapters'

const MAX_QUESTION_LENGTH = 1000
type AskStatus = 'idle' | 'retrieving' | 'generating' | 'completed' | 'failed'

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
const askStatus = ref<AskStatus>('idle')
const askError = ref('')
const sessionId = ref<number | null>(null)
const sessionPager = reactive({ pageNo: 1, pageSize: 12, total: 0 })

const currentSession = computed(() => sessions.value.find((item) => item.id === sessionId.value) || null)
const canUseSessionActions = computed(() => !!sessionId.value)
const questionLength = computed(() => question.value.trim().length)
const selectedKnowledgeBase = computed(() => knowledgeBases.value.find((item) => item.id === selectedKb.value) || null)
const selectedKbDocCount = computed(() => Number((selectedKnowledgeBase.value as any)?.documentCount ?? selectedKnowledgeBase.value?.docCount ?? 0))
const canAsk = computed(() => !!selectedKb.value && selectedKbDocCount.value > 0 && questionLength.value > 0 && questionLength.value <= MAX_QUESTION_LENGTH && !thinking.value)

const statusText = computed(() => {
  if (askStatus.value === 'retrieving') return '正在检索知识库文档'
  if (askStatus.value === 'generating') return '正在生成回答'
  if (askStatus.value === 'completed') return '回答已完成'
  if (askStatus.value === 'failed') return '生成失败，请稍后重试'
  return '选择知识库后可开始提问'
})

const askGuardMessage = computed(() => {
  if (!selectedKb.value) return '请先选择知识库'
  if (selectedKbDocCount.value <= 0) return '当前知识库暂无可问答文档，请先上传并等待解析完成'
  return ''
})

function normalizeMessage(item: any): ChatMessage {
  return {
    ...item,
    role: normalizeRole(item.role),
    references: item.references || [],
  }
}

function referenceList(message: ChatMessage): Array<string | ChatReference> {
  return message.references || []
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

async function loadKnowledgeBases() {
  const data = await getKnowledgeBasePage({ pageNo: 1, pageSize: 100, sortBy: 'updateTime' })
  knowledgeBases.value = data.list || []
  const queryKb = Number(route.query.knowledgeBaseId || 0)
  const matchedKb = data.list?.find((item) => item.id === queryKb)
  selectedKb.value = matchedKb?.id || data.list?.[0]?.id
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
}

async function ask() {
  if (!selectedKb.value) {
    ElMessage.warning('请先选择知识库')
    return
  }
  if (selectedKbDocCount.value <= 0) {
    ElMessage.warning('当前知识库暂无可问答文档，请先上传并等待解析完成')
    return
  }
  if (!question.value.trim()) {
    ElMessage.warning('请输入问题')
    return
  }
  if (questionLength.value > MAX_QUESTION_LENGTH) {
    ElMessage.warning(`问题不能超过 ${MAX_QUESTION_LENGTH} 个字符`)
    return
  }
  if (thinking.value) return

  const q = question.value.trim()
  const pendingUserMessage: ChatMessage = { id: Date.now(), role: 'user', content: q }
  chatMessages.value.push(pendingUserMessage)
  question.value = ''
  thinking.value = true
  askStatus.value = 'retrieving'
  askError.value = ''

  try {
    const result = await askKnowledgeBase({ knowledgeBaseId: selectedKb.value, sessionId: sessionId.value, question: q })
    askStatus.value = 'generating'
    sessionId.value = result.sessionId
    chatMessages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      content: result.answer || '',
      references: result.references || [],
    })
    askStatus.value = 'completed'
    await loadSessions()
  } catch (error) {
    chatMessages.value = chatMessages.value.filter((item) => item.id !== pendingUserMessage.id)
    askStatus.value = 'failed'
    askError.value = error instanceof Error ? error.message : '问答请求失败，请稍后重试'
  } finally {
    thinking.value = false
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
    })
    ElMessage.success('已重新生成回答')
  } finally {
    thinking.value = false
  }
}

async function feedback(message: ChatMessage, feedbackType: 'LIKE' | 'DISLIKE') {
  await sendFeedback({ messageId: message.id, feedbackType })
  ElMessage.success(feedbackType === 'LIKE' ? '已记录有帮助反馈' : '已记录问题反馈')
}

function openReference(ref: string | ChatReference) {
  if (typeof ref !== 'string' && ref.documentId) {
    router.push(`/app/documents/${ref.documentId}`)
    return
  }
  const title = referenceTitleOf(ref)
  const content = referenceContentOf(ref) || (typeof ref === 'string' ? ref : '后端未返回引用片段内容')
  ElMessageBox.alert(content, title, { confirmButtonText: '知道了' })
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

        <el-alert v-if="askGuardMessage" type="warning" show-icon :closable="false" :title="askGuardMessage" />

        <div class="session-list" v-loading="loadingSessions">
          <button v-for="item in sessions" :key="item.id" class="session-item" :class="{ active: item.id === sessionId }" @click="selectSession(item)">
            <strong>{{ item.title || `会话 #${item.id}` }}</strong>
            <span>{{ item.knowledgeBaseName || '未关联知识库' }}</span>
            <small>{{ timeOf(item) }}</small>
          </button>
          <el-empty v-if="!loadingSessions && !sessions.length" description="暂无历史会话" />
        </div>

        <el-pagination
          v-if="sessionPager.total > sessionPager.pageSize"
          v-model:current-page="sessionPager.pageNo"
          small
          layout="prev, pager, next"
          :total="sessionPager.total"
          :page-size="sessionPager.pageSize"
          @current-change="loadSessions"
        />
      </div>
    </aside>

    <section class="chat-main soft-card">
      <div class="chat-head">
        <div>
          <h1>{{ currentSession?.title || '智能问答' }}</h1>
          <p>{{ currentSession ? `${currentSession.knowledgeBaseName || kbNameOf({ knowledgeBaseName: '' })} · ${timeOf(currentSession)}` : statusText }}</p>
        </div>
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

      <div class="message-list" v-loading="loadingMessages">
        <el-alert v-if="askError" type="error" show-icon :closable="false" :title="askError" />
        <el-empty v-if="!chatMessages.length && !thinking && !loadingMessages" description="开始一次知识库问答" />

        <div v-for="message in chatMessages" :key="message.id" class="message" :class="message.role">
          <div class="avatar">{{ message.role === 'user' ? '我' : 'AI' }}</div>
          <div class="bubble">
            <p>{{ message.content }}</p>

            <div v-if="message.role === 'assistant'" class="references">
              <strong>引用来源</strong>
              <div v-if="!referenceList(message).length" class="empty-reference">暂无引用来源</div>
              <article v-for="(ref, index) in referenceList(message)" v-else :key="index" class="reference-card">
                <div class="reference-head" @click="openReference(ref)">
                  <span>{{ referenceTitleOf(ref, index) }}</span>
                  <el-tag v-if="referenceScoreOf(ref)" size="small" effect="plain">相似度 {{ referenceScoreOf(ref) }}</el-tag>
                </div>
                <p v-if="referenceContentOf(ref)">{{ referenceContentOf(ref) }}</p>
              </article>
            </div>

            <div v-if="message.role === 'assistant'" class="message-actions">
              <el-button link type="primary" @click="feedback(message, 'LIKE')">有帮助</el-button>
              <el-button link type="warning" @click="feedback(message, 'DISLIKE')">不准确</el-button>
            </div>
          </div>
        </div>

        <div v-if="thinking" class="message assistant">
          <div class="avatar">AI</div>
          <div class="bubble">
            <div class="thinking-state">{{ statusText }}</div>
            <el-skeleton :rows="2" animated />
          </div>
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
          placeholder="输入你的问题，Ctrl + Enter 发送"
          @keyup.ctrl.enter="ask"
        />
        <div class="input-footer">
          <span :class="{ danger: questionLength > MAX_QUESTION_LENGTH }">{{ sessionId ? '将作为当前会话的连续追问' : '首个问题会自动创建新会话' }} · {{ statusText }}</span>
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
.chat-page { display: grid; grid-template-columns: 340px 1fr; gap: 16px; min-height: calc(100vh - 124px); }
.sidebar-body { display: flex; flex-direction: column; gap: 14px; height: calc(100vh - 124px); }
.sidebar-head,.head-actions,.input-actions,.message-actions { display: flex; align-items: center; gap: 8px; }
.sidebar-head { justify-content: space-between; }
.session-list { flex: 1; overflow: auto; display: grid; align-content: start; gap: 8px; min-height: 180px; }
.session-item { width: 100%; padding: 12px; border: 1px solid var(--color-border); border-radius: 12px; background: var(--color-surface-soft); text-align: left; color: var(--color-text); cursor: pointer; }
.session-item.active { border-color: var(--color-primary); background: var(--color-primary-weak); }
.session-item strong,.session-item span,.session-item small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.session-item span,.session-item small { margin-top: 5px; color: var(--color-text-muted); }
.chat-main { display: flex; flex-direction: column; min-width: 0; }
.chat-head { padding: 20px; border-bottom: 1px solid var(--color-border); display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.chat-head h1 { margin: 0; font-size: 26px; }
.chat-head p { margin: 8px 0 0; color: var(--color-text-muted); }
.message-list { flex: 1; padding: 22px; overflow: auto; display: grid; align-content: start; gap: 18px; }
.message { display: grid; grid-template-columns: 42px minmax(0, 1fr); gap: 12px; }
.message.user { grid-template-columns: minmax(0, 1fr) 42px; }
.message.user .avatar { grid-column: 2; grid-row: 1; }
.message.user .bubble { grid-column: 1; justify-self: end; background: var(--color-primary); color: #fff; }
.avatar { width: 42px; height: 42px; border-radius: 14px; display: grid; place-items: center; background: var(--color-primary-weak); color: var(--color-primary); font-weight: 800; }
.bubble { max-width: 820px; padding: 14px 16px; border-radius: 16px; background: var(--color-surface-soft); line-height: 1.7; }
.bubble > p { margin: 0; white-space: pre-wrap; }
.references { margin-top: 12px; display: grid; gap: 8px; }
.empty-reference { color: var(--color-text-muted); font-size: 13px; }
.reference-card { padding: 10px; border-radius: 10px; background: #fff; border: 1px solid var(--color-border); color: var(--color-text); }
.reference-head { display: flex; justify-content: space-between; gap: 10px; font-weight: 700; cursor: pointer; }
.reference-head:hover { color: var(--color-primary); }
.reference-card p { margin: 8px 0 0; color: var(--color-text-muted); white-space: pre-wrap; }
.message-actions { margin-top: 8px; }
.input-area { padding: 18px; border-top: 1px solid var(--color-border); }
.input-footer { margin-top: 10px; display: flex; justify-content: space-between; align-items: center; gap: 12px; color: var(--color-text-muted); font-size: 13px; }
.thinking-state { margin-bottom: 10px; color: var(--color-text-muted); font-size: 13px; font-weight: 700; }
.danger { color: var(--el-color-danger); }
@media (max-width: 1080px) { .chat-page { grid-template-columns: 1fr; } .sidebar-body { height: auto; } .chat-head,.input-footer { flex-direction: column; align-items: stretch; } }
</style>
