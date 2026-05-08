<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { knowledgeBases, documents, metrics, sessions } from '@/mock/data'

const router = useRouter()
const loading = ref(false)
</script>

<template>
  <div class="dashboard">
    <div class="page-header">
      <div>
        <h1 class="page-title">知识库工作台</h1>
        <div class="page-desc">集中管理个人资料、文档解析状态和最近的 AI 问答记录。</div>
      </div>
      <div class="header-actions">
        <el-button plain @click="router.push('/app/documents')">
          <el-icon><Upload /></el-icon>
          上传文档
        </el-button>
        <el-button type="primary" @click="router.push('/app/chat')">
          <el-icon><ChatDotRound /></el-icon>
          开始问答
        </el-button>
      </div>
    </div>

    <div class="metric-grid">
      <div v-for="item in metrics" :key="item.label" class="stat-tile">
        <div class="stat-label">{{ item.label }}</div>
        <div class="stat-value">{{ item.value }}</div>
        <div class="muted">{{ item.hint }}</div>
      </div>
    </div>

    <div class="dashboard-grid">
      <section class="soft-card feature-card">
        <div class="soft-card-body">
          <span class="subtle-badge">RAG 主链路</span>
          <h2>上传文档后自动解析、切片、向量化，再基于知识库提问。</h2>
          <p>当前版本使用 mock 数据展示页面结构，接口对接时按 SOP 冻结 API 契约。</p>
          <div class="pipeline">
            <span>上传</span>
            <i />
            <span>解析</span>
            <i />
            <span>切片</span>
            <i />
            <span>检索</span>
            <i />
            <span>问答</span>
          </div>
        </div>
      </section>

      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">最近知识库</h3>
          <div class="kb-list">
            <div v-for="kb in knowledgeBases" :key="kb.id" class="kb-row" @click="router.push(`/app/knowledge/${kb.id}`)">
              <span class="kb-icon">{{ kb.icon }}</span>
              <div>
                <strong>{{ kb.name }}</strong>
                <p>{{ kb.docCount }} 个文档 · {{ kb.updatedAt }}</p>
              </div>
              <el-tag size="small" :type="kb.status === 'NORMAL' ? 'success' : kb.status === 'FAILED' ? 'danger' : 'warning'">
                {{ kb.status }}
              </el-tag>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="section-grid">
      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">文档处理状态</h3>
          <el-table :data="documents" v-loading="loading" size="large">
            <el-table-column prop="name" label="文档名称" min-width="220" show-overflow-tooltip />
            <el-table-column prop="knowledgeBaseName" label="知识库" width="160" />
            <el-table-column label="解析状态" width="110">
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
          <div class="session-list">
            <div v-for="session in sessions" :key="session.id" class="session-item">
              <strong>{{ session.title }}</strong>
              <p>{{ session.latestQuestion }}</p>
              <span>{{ session.knowledgeBaseName }} · {{ session.updatedAt }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.header-actions {
  display: flex;
  gap: 10px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  margin: 16px 0;
}

.feature-card h2 {
  max-width: 720px;
  margin: 16px 0 10px;
  font-size: 28px;
  line-height: 1.25;
}

.feature-card p {
  color: var(--color-text-muted);
  line-height: 1.7;
}

.pipeline {
  margin-top: 22px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.pipeline span {
  padding: 9px 14px;
  border-radius: 999px;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  font-size: 13px;
  font-weight: 700;
}

.pipeline i {
  width: 24px;
  height: 1px;
  background: var(--color-border);
}

.kb-list,
.session-list {
  display: grid;
  gap: 12px;
}

.kb-row {
  display: grid;
  grid-template-columns: 42px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.kb-row:hover,
.session-item:hover {
  background: var(--color-surface-soft);
}

.kb-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--color-primary-weak);
}

.kb-row p,
.session-item p,
.session-item span {
  margin: 4px 0 0;
  color: var(--color-text-muted);
  font-size: 13px;
}

.session-item {
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
}

@media (max-width: 1100px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
