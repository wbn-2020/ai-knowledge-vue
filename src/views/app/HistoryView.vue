<script setup lang="ts">
import { useRouter } from 'vue-router'
import { sessions } from '@/mock/data'

const router = useRouter()
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">问答历史</h1>
        <div class="page-desc">查看历史会话、所属知识库、最近问题和更新时间。</div>
      </div>
      <el-button plain>批量整理</el-button>
    </div>

    <section class="soft-card">
      <div class="soft-card-body">
        <el-table :data="sessions" size="large">
          <el-table-column prop="title" label="会话标题" min-width="220" />
          <el-table-column prop="knowledgeBaseName" label="知识库" width="180" />
          <el-table-column prop="latestQuestion" label="最近问题" min-width="260" show-overflow-tooltip />
          <el-table-column prop="updatedAt" label="更新时间" width="170" />
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button link type="primary" @click="router.push(`/app/history/${row.id}`)">查看</el-button>
              <el-button link type="primary">继续追问</el-button>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>
  </div>
</template>
