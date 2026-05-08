<script setup lang="ts">
import { ref } from 'vue'
import { knowledgeBases, messages } from '@/mock/data'
import type { ChatMessage } from '@/types'

const selectedKb = ref(knowledgeBases[0].id)
const question = ref('')
const chatMessages = ref<ChatMessage[]>([...messages])
const thinking = ref(false)

function ask() {
  if (!question.value.trim()) return
  chatMessages.value.push({ id: Date.now(), role: 'user', content: question.value })
  thinking.value = true
  const q = question.value
  question.value = ''
  window.setTimeout(() => {
    chatMessages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      content: `基于当前知识库，我找到了与「${q}」相关的文档片段。MVP 页面先展示 mock 回答，正式接入后会返回 answer、sessionId 和 references。`,
      references: ['KnowFlow AI PRD.md', 'Spring Boot 架构设计.pdf'],
    })
    thinking.value = false
  }, 600)
}
</script>

<template>
  <div class="chat-page">
    <aside class="chat-sidebar soft-card">
      <div class="soft-card-body">
        <h3 class="section-title">问答范围</h3>
        <el-select v-model="selectedKb" style="width: 100%" size="large">
          <el-option v-for="kb in knowledgeBases" :key="kb.id" :label="kb.name" :value="kb.id" />
        </el-select>

        <div class="chat-note">
          <el-icon><InfoFilled /></el-icon>
          <span>后端必须在检索时过滤 userId 和 knowledgeBaseId，避免跨用户召回。</span>
        </div>

        <div class="source-card">
          <strong>回答规则</strong>
          <p>只基于召回文档回答；无依据时明确说明当前知识库没有足够依据。</p>
        </div>
      </div>
    </aside>

    <section class="chat-main soft-card">
      <div class="chat-head">
        <div>
          <h1>智能问答</h1>
          <p>选择知识库后发起提问，展示回答与引用来源。</p>
        </div>
        <span class="subtle-badge">非流式 MVP</span>
      </div>

      <div class="message-list">
        <div v-for="message in chatMessages" :key="message.id" class="message" :class="message.role">
          <div class="avatar">{{ message.role === 'user' ? '我' : 'AI' }}</div>
          <div class="bubble">
            <p>{{ message.content }}</p>
            <div v-if="message.references?.length" class="references">
              <strong>引用来源</strong>
              <el-tag v-for="ref in message.references" :key="ref" size="small" effect="plain">{{ ref }}</el-tag>
            </div>
          </div>
        </div>
        <div v-if="thinking" class="message assistant">
          <div class="avatar">AI</div>
          <div class="bubble"><el-skeleton :rows="2" animated /></div>
        </div>
      </div>

      <div class="input-area">
        <el-input
          v-model="question"
          type="textarea"
          :rows="3"
          resize="none"
          placeholder="输入你的问题，例如：这个项目的 MVP 范围是什么？"
          @keyup.ctrl.enter="ask"
        />
        <div class="input-footer">
          <span>Ctrl + Enter 发送</span>
          <el-button type="primary" :loading="thinking" @click="ask">发送问题</el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.chat-page {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  min-height: calc(100vh - 124px);
}

.chat-note,
.source-card {
  margin-top: 16px;
  padding: 14px;
  border-radius: 12px;
  background: var(--color-surface-soft);
  color: var(--color-text-muted);
  line-height: 1.6;
}

.chat-note {
  display: flex;
  gap: 10px;
}

.source-card strong {
  color: var(--color-text);
}

.chat-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-head {
  padding: 22px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.chat-head h1 {
  margin: 0;
  font-size: 26px;
}

.chat-head p {
  margin: 8px 0 0;
  color: var(--color-text-muted);
}

.message-list {
  flex: 1;
  padding: 22px;
  overflow: auto;
  display: grid;
  align-content: start;
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
  grid-row: 1;
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
  max-width: 780px;
  padding: 14px 16px;
  border-radius: 16px;
  background: var(--color-surface-soft);
  line-height: 1.7;
}

.bubble p {
  margin: 0;
}

.references {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.input-area {
  padding: 18px;
  border-top: 1px solid var(--color-border);
}

.input-footer {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--color-text-muted);
  font-size: 13px;
}

@media (max-width: 960px) {
  .chat-page {
    grid-template-columns: 1fr;
  }
}
</style>
