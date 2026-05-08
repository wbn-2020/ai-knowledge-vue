<script setup lang="ts">
const announcements = [
  { id: 1, title: 'MVP 功能已开放', status: '已发布', creator: 'admin', createdAt: '2026-05-08 09:20' },
  { id: 2, title: '系统维护通知', status: '草稿', creator: 'admin', createdAt: '2026-05-07 16:30' },
]
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">公告管理</h1>
        <div class="page-desc">查看、创建、编辑和下线系统公告。</div>
      </div>
      <el-button type="primary">新增公告</el-button>
    </div>

    <section class="soft-card">
      <div class="soft-card-body">
        <el-table :data="announcements" size="large">
          <el-table-column prop="title" label="标题" min-width="240" />
          <el-table-column prop="status" label="状态" width="120" />
          <el-table-column prop="creator" label="创建人" width="120" />
          <el-table-column prop="createdAt" label="发布时间" width="170" />
          <el-table-column label="操作" width="220">
            <template #default>
              <el-button link type="primary">编辑</el-button>
              <el-button link type="warning">发布 / 下线</el-button>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>
  </div>
</template>
