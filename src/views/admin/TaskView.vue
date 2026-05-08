<script setup lang="ts">
const tasks = [
  { id: 1, type: 'PARSE', document: 'KnowFlow AI PRD.md', status: 'PROCESSING', createdAt: '2026-05-08 09:02', reason: '-' },
  { id: 2, type: 'EMBEDDING', document: 'Spring Boot 架构设计.pdf', status: 'SUCCESS', createdAt: '2026-05-08 08:40', reason: '-' },
  { id: 3, type: 'PARSE', document: 'RAG 方案说明.docx', status: 'FAILED', createdAt: '2026-05-07 23:45', reason: '文档格式异常' },
]
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">文档处理任务</h1>
        <div class="page-desc">查看解析、切片、向量化任务的状态和失败原因。</div>
      </div>
    </div>
    <section class="soft-card"><div class="soft-card-body">
      <el-table :data="tasks" size="large">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="type" label="任务类型" width="130" />
        <el-table-column prop="document" label="关联文档" min-width="240" />
        <el-table-column prop="status" label="状态" width="130" />
        <el-table-column prop="reason" label="失败原因" min-width="180" />
        <el-table-column prop="createdAt" label="创建时间" width="170" />
        <el-table-column label="操作" width="160">
          <template #default="{ row }"><el-button v-if="row.status === 'FAILED'" link type="warning">重试</el-button><el-button link type="primary" @click="$router.push(`/admin/tasks/${row.id}`)">详情</el-button></template>
        </el-table-column>
      </el-table>
    </div></section>
  </div>
</template>
