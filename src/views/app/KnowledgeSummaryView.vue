<script setup lang="ts">
import { knowledgeBases } from '@/mock/data'
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">知识整理</h1>
        <div class="page-desc">MVP 阶段先实现文档摘要和知识库摘要，作为 AI 应用亮点。</div>
      </div>
      <el-button type="primary">生成摘要</el-button>
    </div>

    <div class="section-grid">
      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">文档摘要</h3>
          <div class="summary-card">
            这里展示选中文档生成的摘要内容。正式接入后由后端摘要接口返回结果。
          </div>
          <el-tag effect="plain" type="info">当前为前端占位页面</el-tag>
        </div>
      </section>

      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">知识库摘要</h3>
          <el-select placeholder="选择知识库" style="width: 100%">
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
