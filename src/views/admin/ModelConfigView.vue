<script setup lang="ts">
const models = [
  { name: '默认大模型', provider: 'OpenAI Compatible', model: 'gpt-4.1-mini', enabled: true, scene: '知识库问答' },
  { name: 'Embedding 模型', provider: 'OpenAI Compatible', model: 'text-embedding-3-small', enabled: true, scene: '向量化' },
]
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">AI 模型配置</h1>
        <div class="page-desc">配置大模型和 Embedding 模型。API Key 仅后端保存，前端只做脱敏展示。</div>
      </div>
      <el-button type="primary">新增配置</el-button>
    </div>
    <section class="soft-card"><div class="soft-card-body">
      <el-table :data="models" size="large">
        <el-table-column prop="name" label="配置名称" min-width="180" />
        <el-table-column prop="provider" label="供应商" width="180" />
        <el-table-column prop="model" label="模型" min-width="220" />
        <el-table-column prop="scene" label="场景" width="140" />
        <el-table-column label="状态" width="120"><template #default="{ row }"><el-switch v-model="row.enabled" /></template></el-table-column>
        <el-table-column label="操作" width="180"><template #default><el-button link type="primary">编辑</el-button><el-button link>测试调用</el-button></template></el-table-column>
      </el-table>
    </div></section>
  </div>
</template>
