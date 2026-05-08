<script setup lang="ts">
import { adminMetrics, documents, knowledgeBases } from '@/mock/data'

const extensionLinks = [
  { label: '定时任务', path: '/admin/scheduled-tasks' },
  { label: '存储统计', path: '/admin/storage-stats' },
  { label: 'Prompt 评估', path: '/admin/prompt-evaluation' },
  { label: '高级审计', path: '/admin/audit-advanced' },
  { label: '公告高级能力', path: '/admin/announcement-advanced' },
]
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

    <div class="toolbar">
      <el-button plain @click="$router.push('/admin/announcements')">公告管理</el-button>
      <el-button plain @click="$router.push('/admin/tasks')">任务管理</el-button>
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

    <section class="soft-card extension-panel">
      <div class="soft-card-body">
        <h3 class="section-title">后台扩展入口</h3>
        <div class="extension-grid">
          <button v-for="item in extensionLinks" :key="item.path" class="extension-link" @click="$router.push(item.path)">
            {{ item.label }}
          </button>
        </div>
      </div>
    </section>
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

.extension-panel {
  margin-top: 16px;
}

.extension-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.extension-link {
  border: 1px solid var(--color-border);
  background: var(--color-surface-soft);
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
}

.extension-link:hover {
  border-color: rgba(37, 99, 235, 0.35);
  color: var(--color-primary);
}
</style>
