<script setup lang="ts">
import { documents } from '@/mock/data'
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">后台文档管理</h1>
        <div class="page-desc">查看平台文档、解析状态、向量化状态和失败重试入口。</div>
      </div>
    </div>

    <section class="soft-card">
      <div class="soft-card-body">
        <el-table :data="documents" size="large">
          <el-table-column prop="name" label="文档名称" min-width="240" />
          <el-table-column prop="knowledgeBaseName" label="知识库" width="180" />
          <el-table-column prop="type" label="类型" width="90" />
          <el-table-column prop="parseStatus" label="解析状态" width="120" />
          <el-table-column prop="embeddingStatus" label="向量状态" width="120" />
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button link type="primary" @click="$router.push(`/admin/documents/${row.id}`)">详情</el-button>
              <el-button v-if="row.parseStatus === 'FAILED'" link type="warning">重新解析</el-button>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>
  </div>
</template>
