<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
import { messageCountOf, normalizeRole, referenceContentOf, referenceScoreOf, referenceTitleOf, timeOf } from '@/utils/view-adapters'

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

const canAsk = computed(() => !!session.value?.knowledgeBaseId && !!question.value.trim())

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

async function loadSessionMeta() {
  const data = await getChatSessionPage({ pageNo: 1, pageSize: 100 })
  session.value = data.list.find((item) => item.id === sessionId) || null
}

async function loadDetail() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [messageData] = await Promise.all([
      getChatMessages(sessionId),
      loadSessionMeta(),
    ])
    messages.value = messageData.map(normalizeMessage)
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
    messages.value.push({
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

async function askFollowUp() {
  if (!canAsk.value || thinking.value || !session.value?.knowledgeBaseId) return
  const q = question.value.trim()
  messages.value.push({ id: Date.now(), role: 'user', content: q })
  question.value = ''
  thinking.value = true
  try {
    const result = await askKnowledgeBase({ knowledgeBaseId: session.value.knowledgeBaseId, sessionId, question: q })
    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      content: result.answer,
      references: result.references || [],
    })
    await loadSessionMeta()
  } finally {
    thinking.value = false
  }
}

async function feedback(message: ChatMessage, feedbackType: 'LIKE' | 'DISLIKE') {
  await sendFeedback({ messageId: message.id, feedbackType })
  ElMessage.success(feedbackType === 'LIKE' ? '已记录有帮助反馈' : '已记录问题反馈')
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
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ session?.title || `会话 #${sessionId}` }}</h1>
        <div class="page-desc">
          {{ session?.knowledgeBaseName || '未关联知识库' }} · {{ messageCountOf(session) }} 条消息 · {{ timeOf(session) }}
        </div>
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

    <section class="soft-card">
      <div class="soft-card-body detail-body" v-loading="loading">
        <div class="message-stack">
          <article v-for="message in messages" :key="message.id" class="message-card" :class="message.role">
            <div class="role">{{ message.role === 'user' ? '用户提问' : 'AI 回答' }}</div>
            <p>{{ message.content }}</p>
            <div v-if="referenceList(message).length" class="refs">
              <strong>引用片段</strong>
              <article v-for="(ref, index) in referenceList(message)" :key="index" class="reference-card">
                <div>
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
          </article>

          <div v-if="thinking" class="message-card assistant">
            <div class="role">AI 回答</div>
            <el-skeleton :rows="2" animated />
          </div>

          <el-empty v-if="!messages.length && !loading && !thinking" description="暂无消息" />
        </div>

        <div class="footer-actions">
          <el-button plain :loading="thinking" @click="regenerate">重新生成最后回答</el-button>
        </div>
      </div>
    </section>

    <section class="soft-card follow-card">
      <div class="soft-card-body">
        <h3 class="section-title">继续追问</h3>
        <el-alert v-if="!session?.knowledgeBaseId" class="state-alert" type="warning" show-icon :closable="false" title="当前会话缺少 knowledgeBaseId，后端返回该字段后即可继续追问。" />
        <el-input v-model="question" type="textarea" :rows="3" resize="none" placeholder="输入追问内容，Ctrl + Enter 发送" @keyup.ctrl.enter="askFollowUp" />
        <div class="ask-row">
          <span class="muted">追问会沿用当前会话上下文。</span>
          <el-button type="primary" :disabled="!canAsk" :loading="thinking" @click="askFollowUp">发送追问</el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.header-actions,
.footer-actions,
.message-actions,
.ask-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.state-alert {
  margin-bottom: 16px;
}

.detail-body {
  min-height: 320px;
}

.message-stack {
  display: grid;
  gap: 14px;
}

.message-card {
  padding: 16px;
  border-radius: 16px;
  background: var(--color-surface-soft);
}

.message-card.assistant {
  border: 1px solid rgba(37, 99, 235, 0.18);
}

.message-card.user {
  background: #eef5ff;
}

.role {
  font-weight: 800;
  color: var(--color-primary);
}

.message-card > p {
  margin: 10px 0 0;
  line-height: 1.8;
  white-space: pre-wrap;
}

.refs {
  margin-top: 12px;
  display: grid;
  gap: 8px;
}

.reference-card {
  padding: 10px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid var(--color-border);
}

.reference-card div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-weight: 700;
}

.reference-card p {
  margin: 8px 0 0;
  color: var(--color-text-muted);
  white-space: pre-wrap;
}

.footer-actions {
  justify-content: flex-end;
  margin-top: 16px;
}

.follow-card {
  margin-top: 16px;
}

.ask-row {
  justify-content: space-between;
  margin-top: 12px;
}

@media (max-width: 760px) {
  .page-header,
  .ask-row {
    align-items: stretch;
  }

  .header-actions,
  .ask-row {
    flex-direction: column;
  }
}
</style>
