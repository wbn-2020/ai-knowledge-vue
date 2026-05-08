<script setup lang="ts">
const task = {
  id: 3,
  type: 'PARSE',
  document: 'RAG 方案说明.docx',
  status: 'FAILED',
  reason: '文档格式异常',
  log: '解析器在读取 Word 文件时检测到非法格式结构，建议重新上传或转换格式后再试。',
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">任务详情</h1>
        <div class="page-desc">查看任务类型、关联文档、日志摘要和失败原因。</div>
      </div>
    </div>

    <div class="detail-grid">
      <section class="soft-card">
        <div class="soft-card-body">
          <div class="meta-grid">
            <div><span>ID</span><strong>#{{ task.id }}</strong></div>
            <div><span>类型</span><strong>{{ task.type }}</strong></div>
            <div><span>文档</span><strong>{{ task.document }}</strong></div>
            <div><span>状态</span><strong>{{ task.status }}</strong></div>
            <div><span>失败原因</span><strong>{{ task.reason }}</strong></div>
          </div>
        </div>
      </section>

      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">执行日志</h3>
          <div class="log-box">{{ task.log }}</div>
          <el-button type="warning" style="margin-top: 12px;">重试任务</el-button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.meta-grid {
  display: grid;
  gap: 14px;
}

.meta-grid span {
  display: block;
  color: var(--color-text-muted);
  font-size: 13px;
}

.meta-grid strong {
  display: block;
  margin-top: 6px;
}

.log-box {
  padding: 16px;
  border-radius: 14px;
  background: var(--color-surface-soft);
  color: var(--color-text-muted);
  line-height: 1.8;
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
