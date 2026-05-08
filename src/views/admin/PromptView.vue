<script setup lang="ts">
const prompts = [
  { id: 1, name: '知识库问答默认 Prompt', type: '问答', enabled: true, updatedAt: '2026-05-08 09:00' },
  { id: 2, name: '文档摘要 Prompt', type: '摘要', enabled: true, updatedAt: '2026-05-07 18:20' },
]
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Prompt 模板</h1>
        <div class="page-desc">管理问答和摘要场景的 Prompt 模板，MVP 暂不做版本管理。</div>
      </div>
      <el-button type="primary">新增模板</el-button>
    </div>
    <section class="soft-card"><div class="soft-card-body">
      <el-table :data="prompts" size="large">
        <el-table-column prop="name" label="模板名称" min-width="240" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column prop="updatedAt" label="更新时间" width="170" />
        <el-table-column label="启用" width="100"><template #default="{ row }"><el-switch v-model="row.enabled" /></template></el-table-column>
        <el-table-column label="操作" width="180"><template #default><el-button link type="primary">编辑</el-button><el-button link type="danger">删除</el-button></template></el-table-column>
      </el-table>
    </div></section>
  </div>
</template>
