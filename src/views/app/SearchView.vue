<script setup lang="ts">
import { ref } from 'vue'
import { documents } from '@/mock/data'

const query = ref('RAG 向量检索')
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">语义搜索</h1>
        <div class="page-desc">在当前知识库内检索相关文档片段，作为问答前的辅助入口。</div>
      </div>
    </div>

    <section class="search-box soft-card">
      <div class="soft-card-body">
        <el-input v-model="query" size="large" placeholder="输入关键词或自然语言问题">
          <template #prefix><el-icon><Search /></el-icon></template>
          <template #append><el-button type="primary">搜索</el-button></template>
        </el-input>
      </div>
    </section>

    <div class="result-list">
      <article v-for="(doc, index) in documents" :key="doc.id" class="result-card soft-card">
        <div class="soft-card-body">
          <div class="result-head">
            <h3>{{ doc.name }}</h3>
            <el-tag effect="plain">相似度 {{ (0.91 - index * 0.06).toFixed(2) }}</el-tag>
          </div>
          <p>
            这是从 {{ doc.knowledgeBaseName }} 中召回的相关片段。正式接入后将展示 chunk 摘要、文档名称、相似度和可点击的引用详情。
          </p>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped lang="scss">
.search-box {
  margin-bottom: 16px;
}

.result-list {
  display: grid;
  gap: 12px;
}

.result-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

h3 {
  margin: 0;
}

p {
  margin: 10px 0 0;
  color: var(--color-text-muted);
  line-height: 1.7;
}
</style>
