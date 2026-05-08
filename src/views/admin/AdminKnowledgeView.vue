<script setup lang="ts">
import { knowledgeBases } from '@/mock/data'
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">后台知识库管理</h1>
        <div class="page-desc">管理员查看全平台知识库，可禁用、启用和处理违规数据。</div>
      </div>
    </div>

    <section class="soft-card">
      <div class="soft-card-body">
        <el-table :data="knowledgeBases" size="large">
          <el-table-column prop="name" label="知识库名称" min-width="220" />
          <el-table-column prop="category" label="分类" width="120" />
          <el-table-column prop="docCount" label="文档数量" width="100" />
          <el-table-column prop="updatedAt" label="更新时间" width="170" />
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === 'NORMAL' ? 'success' : row.status === 'FAILED' ? 'danger' : 'warning'">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button link type="primary" @click="$router.push(`/admin/knowledge-bases/${row.id}`)">详情</el-button>
              <el-button link type="warning">禁用</el-button>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>
  </div>
</template>
