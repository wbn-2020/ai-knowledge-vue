<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { documents, knowledgeBases } from '@/mock/data'

const route = useRoute()
const doc = computed(() => documents.find((item) => item.id === Number(route.params.id)) || documents[0])
const kb = computed(() => knowledgeBases.find((item) => item.name === doc.value.knowledgeBaseName))
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">文档详情</h1>
        <div class="page-desc">查看文档基础信息、解析状态、向量化状态和关联知识库。</div>
      </div>
      <div class="header-actions">
        <el-button plain>重新解析</el-button>
        <el-button type="primary">下载原文件</el-button>
      </div>
    </div>

    <div class="detail-grid">
      <section class="soft-card">
        <div class="soft-card-body">
          <span class="subtle-badge">{{ doc.type }}</span>
          <h2>{{ doc.name }}</h2>
          <div class="meta-grid">
            <div><span>所属知识库</span><strong>{{ kb?.name }}</strong></div>
            <div><span>大小</span><strong>{{ doc.size }}</strong></div>
            <div><span>解析状态</span><strong>{{ doc.parseStatus }}</strong></div>
            <div><span>向量状态</span><strong>{{ doc.embeddingStatus }}</strong></div>
            <div><span>更新时间</span><strong>{{ doc.updatedAt }}</strong></div>
            <div><span>文档 ID</span><strong>#{{ doc.id }}</strong></div>
          </div>
        </div>
      </section>

      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">摘要与状态</h3>
          <el-alert type="info" :closable="false" show-icon title="MVP 仅展示摘要卡片，不做全文在线预览。" />
          <div class="summary-box">
            这份文档的摘要会在后端接入后由文档摘要模块生成，目前仅用作页面占位展示。
          </div>
          <div class="status-list">
            <div><span>解析</span><strong>{{ doc.parseStatus }}</strong></div>
            <div><span>向量化</span><strong>{{ doc.embeddingStatus }}</strong></div>
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

.detail-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 16px;
}

h2 {
  margin: 14px 0 0;
  font-size: 28px;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.meta-grid span,
.status-list span {
  display: block;
  color: var(--color-text-muted);
  font-size: 13px;
}

.meta-grid strong,
.status-list strong {
  display: block;
  margin-top: 6px;
}

.summary-box {
  margin-top: 16px;
  padding: 16px;
  border-radius: 14px;
  background: var(--color-surface-soft);
  color: var(--color-text-muted);
  line-height: 1.8;
}

.status-list {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
