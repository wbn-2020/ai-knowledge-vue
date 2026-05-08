<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { documents, knowledgeBases, sessions } from '@/mock/data'

const route = useRoute()
const router = useRouter()
const kb = computed(() => knowledgeBases.find((item) => item.id === Number(route.params.id)) || knowledgeBases[0])
const relatedDocuments = computed(() => documents.filter((item) => item.knowledgeBaseName === kb.value.name))
</script>

<template>
  <div>
    <div class="detail-hero soft-card">
      <div class="soft-card-body hero-inner">
        <div class="kb-mark">{{ kb.icon }}</div>
        <div class="hero-content">
          <span class="subtle-badge">{{ kb.category }}</span>
          <h1>{{ kb.name }}</h1>
          <p>{{ kb.description }}</p>
          <div class="hero-meta">
            <span>{{ kb.docCount }} 个文档</span>
            <span>状态：{{ kb.status }}</span>
            <span>更新：{{ kb.updatedAt }}</span>
          </div>
        </div>
        <div class="hero-actions">
          <el-button plain @click="router.push('/app/documents')">上传文档</el-button>
          <el-button type="primary" @click="router.push('/app/chat')">基于此库提问</el-button>
        </div>
      </div>
    </div>

    <div class="section-grid detail-grid">
      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">文档列表</h3>
          <el-table :data="relatedDocuments" empty-text="暂无文档">
            <el-table-column prop="name" label="文档名称" min-width="220" show-overflow-tooltip />
            <el-table-column prop="type" label="类型" width="90" />
            <el-table-column prop="size" label="大小" width="100" />
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-tag :type="row.parseStatus === 'SUCCESS' ? 'success' : row.parseStatus === 'FAILED' ? 'danger' : 'warning'">
                  {{ row.parseStatus }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </section>

      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">最近问答</h3>
          <div class="question-stack">
            <div v-for="session in sessions" :key="session.id" class="question-card">
              <strong>{{ session.latestQuestion }}</strong>
              <p>{{ session.title }}</p>
              <span>{{ session.updatedAt }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.detail-hero {
  margin-bottom: 16px;
}

.hero-inner {
  display: grid;
  grid-template-columns: 76px 1fr auto;
  gap: 18px;
  align-items: center;
}

.kb-mark {
  width: 76px;
  height: 76px;
  display: grid;
  place-items: center;
  border-radius: 22px;
  background: var(--color-primary-weak);
  font-size: 34px;
}

h1 {
  margin: 12px 0 8px;
  font-size: 32px;
}

.hero-content p {
  color: var(--color-text-muted);
  margin: 0;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 14px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.hero-actions {
  display: flex;
  gap: 10px;
}

.detail-grid {
  grid-template-columns: 1.4fr 0.8fr;
}

.question-stack {
  display: grid;
  gap: 12px;
}

.question-card {
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
}

.question-card p,
.question-card span {
  display: block;
  margin: 6px 0 0;
  color: var(--color-text-muted);
  font-size: 13px;
}

@media (max-width: 900px) {
  .hero-inner {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    flex-wrap: wrap;
  }
}
</style>
