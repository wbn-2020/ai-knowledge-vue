<script setup lang="ts">
const logs = [
  { id: 1, type: 'LOGIN', user: 'admin', action: '登录后台', result: '成功', time: '2026-05-08 09:12' },
  { id: 2, type: 'AI_CALL', user: 'demo_user', action: '知识库问答', result: '成功', time: '2026-05-08 09:06' },
  { id: 3, type: 'OPERATION', user: 'admin', action: '重试解析任务', result: '失败', time: '2026-05-07 23:50' },
]
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">日志审计</h1>
        <div class="page-desc">记录登录日志、操作日志和 AI 调用日志，便于定位问题。</div>
      </div>
    </div>
    <section class="soft-card"><div class="soft-card-body">
      <el-table :data="logs" size="large">
        <el-table-column prop="type" label="日志类型" width="130" />
        <el-table-column prop="user" label="用户" width="140" />
        <el-table-column prop="action" label="操作" min-width="220" />
        <el-table-column prop="result" label="结果" width="120" />
        <el-table-column prop="time" label="时间" width="170" />
        <el-table-column label="操作" width="100"><template #default><el-button link type="primary">详情</el-button></template></el-table-column>
      </el-table>
    </div></section>
  </div>
</template>
