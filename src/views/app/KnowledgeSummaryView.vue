<script setup lang="ts">
import { ref } from 'vue'
import { documents, knowledgeBases } from '@/mock/data'

const selectedDocument = ref(documents[0].id)
const selectedKb = ref(knowledgeBases[0].id)
const summary = ref('这是一段由 AI 生成的文档摘要占位内容。正式接入后会展示摘要结果、关键词和重新生成时间。')

function generateSummary() {
  summary.value = '摘要已重新生成：该内容围绕 KnowFlow AI 的文档解析、切片、向量化和 RAG 问答闭环展开。'
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">知识整理</h1>
        <div class="page-desc">MVP 阶段先实现文档摘要和知识库摘要，作为 AI 应用亮点。</div>
      </div>
      <el-button type="primary" @click="generateSummary">生成摘要</el-button>
    </div>

    <div class="section-grid">
      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">文档摘要</h3>
          <el-select v-model="selectedDocument" placeholder="选择文档" style="width: 100%">
            <el-option v-for="doc in documents" :key="doc.id" :label="doc.name" :value="doc.id" />
          </el-select>
          <div class="summary-card">
            {{ summary }}
          </div>
          <el-tag effect="plain" type="info">当前为前端占位页面</el-tag>
        </div>
      </section>

      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">知识库摘要</h3>
          <el-select v-model="selectedKb" placeholder="选择知识库" style="width: 100%">
            <el-option v-for="kb in knowledgeBases" :key="kb.id" :label="kb.name" :value="kb.id" />
          </el-select>
          <div class="summary-card">
            这里展示知识库内所有文档的整体总结、核心主题和重要内容概览。
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.summary-card {
  margin-top: 16px;
  padding: 18px;
  border-radius: 14px;
  background: var(--color-surface-soft);
  color: var(--color-text-muted);
  line-height: 1.8;
}
</style>
