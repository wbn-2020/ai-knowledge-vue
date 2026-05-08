<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { messages, sessions } from '@/mock/data'

const route = useRoute()
const router = useRouter()
const session = computed(() => sessions.find((item) => item.id === Number(route.params.id)) || sessions[0])
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">会话详情</h1>
        <div class="page-desc">{{ session.title }} · {{ session.knowledgeBaseName }}</div>
      </div>
      <el-button type="primary" @click="router.push('/app/chat')">继续追问</el-button>
    </div>

    <section class="soft-card">
      <div class="soft-card-body">
        <div class="message-stack">
          <article v-for="message in messages" :key="message.id" class="message-card" :class="message.role">
            <div class="role">{{ message.role === 'user' ? '用户提问' : 'AI 回答' }}</div>
            <p>{{ message.content }}</p>
            <div v-if="message.references?.length" class="refs">
              <el-tag v-for="ref in message.references" :key="ref" size="small" effect="plain">{{ ref }}</el-tag>
            </div>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
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

.role {
  font-weight: 800;
  color: var(--color-primary);
}

p {
  margin: 10px 0 0;
  line-height: 1.8;
}

.refs {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
