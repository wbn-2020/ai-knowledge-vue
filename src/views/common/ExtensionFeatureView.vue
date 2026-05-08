<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const title = computed(() => (route.meta.title as string) || '扩展功能')
const description = computed(() => (route.meta.description as string) || '该页面用于承载 PRD 中的扩展能力。')
const category = computed(() => (route.meta.category as string) || '扩展模块')
const features = computed(() => (route.meta.features as string[]) || [])
const workflows = computed(() => (route.meta.workflows as string[]) || ['配置参数', '预览效果', '保存变更'])

const placeholderRows = computed(() => [
  { name: `${title.value}示例一`, status: '待配置', owner: '当前用户', updatedAt: '2026-05-08 10:12' },
  { name: `${title.value}示例二`, status: '已启用', owner: '管理员', updatedAt: '2026-05-07 18:30' },
  { name: `${title.value}示例三`, status: '草稿', owner: '系统', updatedAt: '2026-05-06 14:45' },
])
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ title }}</h1>
        <div class="page-desc">{{ description }}</div>
      </div>
      <div class="actions">
        <el-button plain>导出</el-button>
        <el-button type="primary">新增配置</el-button>
      </div>
    </div>

    <section class="hero-panel soft-card">
      <div class="soft-card-body">
        <span class="subtle-badge">{{ category }}</span>
        <h2>{{ title }}工作台</h2>
        <p>{{ description }} 当前页面先完成产品级前端结构和交互占位，后续接入后端 API 后替换 mock 数据。</p>
        <div class="workflow">
          <template v-for="(item, index) in workflows" :key="item">
            <span>{{ item }}</span>
            <i v-if="index < workflows.length - 1" />
          </template>
        </div>
      </div>
    </section>

    <div class="content-grid">
      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">功能项</h3>
          <div class="feature-list">
            <div v-for="feature in features" :key="feature" class="feature-item">
              <el-icon><CircleCheck /></el-icon>
              <span>{{ feature }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">配置表单</h3>
          <el-form label-position="top">
            <el-form-item label="名称"><el-input :placeholder="`请输入${title}名称`" /></el-form-item>
            <el-form-item label="状态">
              <el-segmented :options="['草稿', '启用', '停用']" model-value="启用" />
            </el-form-item>
            <el-form-item label="说明"><el-input type="textarea" :rows="4" placeholder="填写配置说明" /></el-form-item>
            <el-button type="primary">保存配置</el-button>
          </el-form>
        </div>
      </section>
    </div>

    <section class="soft-card table-section">
      <div class="soft-card-body">
        <h3 class="section-title">数据列表</h3>
        <el-table :data="placeholderRows" size="large">
          <el-table-column prop="name" label="名称" min-width="220" />
          <el-table-column prop="status" label="状态" width="120" />
          <el-table-column prop="owner" label="负责人" width="120" />
          <el-table-column prop="updatedAt" label="更新时间" width="170" />
          <el-table-column label="操作" width="180">
            <template #default>
              <el-button link type="primary">编辑</el-button>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.actions {
  display: flex;
  gap: 10px;
}

.hero-panel {
  margin-bottom: 16px;
}

h2 {
  margin: 14px 0 8px;
  font-size: 28px;
}

p {
  max-width: 880px;
  color: var(--color-text-muted);
  line-height: 1.8;
}

.workflow {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-top: 18px;
}

.workflow span {
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-surface-soft);
  font-weight: 700;
  font-size: 13px;
}

.workflow i {
  width: 22px;
  height: 1px;
  background: var(--color-border);
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.feature-list {
  display: grid;
  gap: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  background: var(--color-surface-soft);
}

.feature-item .el-icon {
  color: var(--color-success);
}

.table-section {
  margin-top: 16px;
}

@media (max-width: 900px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
