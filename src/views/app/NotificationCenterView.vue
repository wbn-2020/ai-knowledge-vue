<script setup lang="ts">
import { notifications } from '@/mock/data'
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">消息通知</h1>
        <div class="page-desc">展示文档解析、问答失败和系统公告通知。</div>
      </div>
      <div class="header-actions">
        <el-button plain>全部已读</el-button>
        <el-button type="primary">刷新</el-button>
      </div>
    </div>

    <section class="soft-card">
      <div class="soft-card-body">
        <div class="notice-list">
          <article v-for="item in notifications" :key="item.id" class="notice-item" :class="{ unread: !item.isRead }">
            <div class="notice-head">
              <span class="notice-type">{{ item.type }}</span>
              <span class="notice-time">{{ item.createdAt }}</span>
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.content }}</p>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.header-actions {
  display: flex;
  gap: 10px;
}

.notice-list {
  display: grid;
  gap: 12px;
}

.notice-item {
  padding: 16px;
  border-radius: 14px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.notice-item.unread {
  border-color: rgba(37, 99, 235, 0.25);
  background: rgba(37, 99, 235, 0.04);
}

.notice-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: var(--color-text-muted);
  font-size: 13px;
}

h3 {
  margin: 10px 0 6px;
}

p {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.7;
}
</style>
