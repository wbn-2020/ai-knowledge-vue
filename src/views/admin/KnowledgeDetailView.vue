<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { knowledgeBases, documents } from '@/mock/data'

const route = useRoute()
const kb = computed(() => knowledgeBases.find((item) => item.id === Number(route.params.id)) || knowledgeBases[0])
const relatedDocuments = computed(() => documents.filter((item) => item.knowledgeBaseName === kb.value.name))
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">后台知识库详情</h1>
        <div class="page-desc">查看平台知识库基础信息、文档列表和处理状态。</div>
      </div>
    </div>

    <div class="detail-grid">
      <section class="soft-card">
        <div class="soft-card-body">
          <span class="subtle-badge">{{ kb.category }}</span>
          <h2>{{ kb.name }}</h2>
          <p class="desc">{{ kb.description }}</p>
          <div class="meta-grid">
            <div><span>文档数量</span><strong>{{ kb.docCount }}</strong></div>
            <div><span>状态</span><strong>{{ kb.status }}</strong></div>
            <div><span>更新时间</span><strong>{{ kb.updatedAt }}</strong></div>
            <div><span>创建时间</span><strong>{{ kb.createdAt }}</strong></div>
            <div><span>创建人</span><strong>demo_user</strong></div>
            <div><span>问答次数</span><strong>56</strong></div>
          </div>
        </div>
      </section>

      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">操作</h3>
          <div class="action-list">
            <el-button type="warning">禁用知识库</el-button>
            <el-button type="success">启用知识库</el-button>
            <el-button type="danger">删除违规知识库</el-button>
          </div>
        </div>
      </section>
    </div>

    <section class="soft-card" style="margin-top: 16px;">
      <div class="soft-card-body">
        <h3 class="section-title">关联文档</h3>
        <el-table :data="relatedDocuments" size="large">
          <el-table-column prop="name" label="文档名称" min-width="220" />
          <el-table-column prop="parseStatus" label="解析状态" width="120" />
          <el-table-column prop="embeddingStatus" label="向量状态" width="120" />
        </el-table>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.detail-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 16px;
}

h2 {
  margin: 14px 0 10px;
  font-size: 28px;
}

.desc {
  color: var(--color-text-muted);
  line-height: 1.7;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
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
