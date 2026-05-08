<script setup lang="ts">
import { adminMetrics, documents, knowledgeBases } from '@/mock/data'
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">后台数据看板</h1>
        <div class="page-desc">展示平台用户、知识库、文档处理和 AI 调用的核心指标。</div>
      </div>
    </div>

    <div class="metric-grid">
      <div v-for="item in adminMetrics" :key="item.label" class="stat-tile">
        <div class="stat-label">{{ item.label }}</div>
        <div class="stat-value">{{ item.value }}</div>
        <div class="muted">{{ item.hint }}</div>
      </div>
    </div>

    <div class="section-grid admin-grid">
      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">处理状态统计</h3>
          <el-table :data="documents">
            <el-table-column prop="name" label="文档" min-width="220" />
            <el-table-column prop="parseStatus" label="解析" width="120" />
            <el-table-column prop="embeddingStatus" label="向量化" width="120" />
          </el-table>
        </div>
      </section>

      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">最近知识库</h3>
          <div v-for="kb in knowledgeBases" :key="kb.id" class="admin-row">
            <span>{{ kb.icon }}</span>
            <div>
              <strong>{{ kb.name }}</strong>
              <p>{{ kb.docCount }} 个文档 · {{ kb.status }}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.admin-grid {
  margin-top: 16px;
  grid-template-columns: 1.4fr 0.8fr;
}

.admin-row {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  margin-bottom: 10px;
}

.admin-row span {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--color-primary-weak);
}

.admin-row p {
  margin: 4px 0 0;
  color: var(--color-text-muted);
}
</style>
