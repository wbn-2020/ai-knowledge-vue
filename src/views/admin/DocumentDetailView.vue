<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { documents } from '@/mock/data'

const route = useRoute()
const doc = computed(() => documents.find((item) => item.id === Number(route.params.id)) || documents[0])
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">后台文档详情</h1>
        <div class="page-desc">查看文档元数据、失败原因、解析状态和重试入口。</div>
      </div>
    </div>

    <div class="detail-grid">
      <section class="soft-card">
        <div class="soft-card-body">
          <h2>{{ doc.name }}</h2>
          <div class="meta-grid">
            <div><span>知识库</span><strong>{{ doc.knowledgeBaseName }}</strong></div>
            <div><span>类型</span><strong>{{ doc.type }}</strong></div>
            <div><span>大小</span><strong>{{ doc.size }}</strong></div>
            <div><span>解析状态</span><strong>{{ doc.parseStatus }}</strong></div>
            <div><span>向量状态</span><strong>{{ doc.embeddingStatus }}</strong></div>
            <div><span>更新时间</span><strong>{{ doc.updatedAt }}</strong></div>
            <div><span>上传用户</span><strong>demo_user</strong></div>
            <div><span>切片数量</span><strong>{{ doc.parseStatus === 'SUCCESS' ? 24 : 0 }}</strong></div>
            <div><span>失败原因</span><strong>{{ doc.parseStatus === 'FAILED' ? '文档格式异常' : '-' }}</strong></div>
          </div>
        </div>
      </section>

      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">操作</h3>
          <div class="action-list">
            <el-button type="primary">查看原文件</el-button>
            <el-button type="warning">重新解析</el-button>
            <el-button type="danger">删除文档</el-button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.detail-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 16px;
}

h2 {
  margin: 0 0 18px;
  font-size: 28px;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
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

.action-list {
  display: grid;
  gap: 10px;
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
