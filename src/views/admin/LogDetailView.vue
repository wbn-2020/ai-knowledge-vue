<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const log = computed(() => ({
  id: route.params.id,
  type: 'AI_CALL',
  user: 'demo_user',
  action: '知识库问答',
  result: '成功',
  ip: '127.0.0.1',
  elapsedMs: 1260,
  modelName: 'gpt-4.1-mini',
  failReason: '-',
  time: '2026-05-08 09:06',
}))
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">日志详情</h1>
        <div class="page-desc">查看登录、操作或 AI 调用日志的详细上下文。</div>
      </div>
    </div>

    <section class="soft-card">
      <div class="soft-card-body">
        <div class="meta-grid">
          <div><span>日志 ID</span><strong>#{{ log.id }}</strong></div>
          <div><span>类型</span><strong>{{ log.type }}</strong></div>
          <div><span>用户</span><strong>{{ log.user }}</strong></div>
          <div><span>操作</span><strong>{{ log.action }}</strong></div>
          <div><span>结果</span><strong>{{ log.result }}</strong></div>
          <div><span>IP</span><strong>{{ log.ip }}</strong></div>
          <div><span>模型</span><strong>{{ log.modelName }}</strong></div>
          <div><span>耗时</span><strong>{{ log.elapsedMs }} ms</strong></div>
          <div><span>失败原因</span><strong>{{ log.failReason }}</strong></div>
          <div><span>时间</span><strong>{{ log.time }}</strong></div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.meta-grid span {
  display: block;
  color: var(--color-text-muted);
  font-size: 13px;
}

.meta-grid strong {
  display: block;
  margin-top: 6px;
}

@media (max-width: 800px) {
  .meta-grid {
    grid-template-columns: 1fr;
  }
}
</style>
