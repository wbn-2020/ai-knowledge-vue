<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getAnnouncements,
  getNotificationPage,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/knowledge'
import type { NotificationItem } from '@/types'
import { isReadOf, statusTagType, timeOf } from '@/utils/view-adapters'

type NoticeTab = 'notifications' | 'announcements'

const activeTab = ref<NoticeTab>('notifications')
const loading = ref(false)
const errorMessage = ref('')
const unreadCount = ref(0)
const noticeList = ref<NotificationItem[]>([])
const pager = reactive({ pageNo: 1, pageSize: 10, total: 0 })

async function loadUnreadCount() {
  try {
    unreadCount.value = await getUnreadNotificationCount()
  } catch {
    unreadCount.value = 0
  }
}

async function loadNotices() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = activeTab.value === 'notifications'
      ? await getNotificationPage({ pageNo: pager.pageNo, pageSize: pager.pageSize })
      : await getAnnouncements({ pageNo: pager.pageNo, pageSize: pager.pageSize })
    noticeList.value = data.list || []
    pager.total = data.total || 0
    pager.pageNo = data.pageNo || pager.pageNo
    pager.pageSize = data.pageSize || pager.pageSize
    if (activeTab.value === 'notifications') loadUnreadCount()
  } catch (error) {
    noticeList.value = []
    pager.total = 0
    errorMessage.value = error instanceof Error ? error.message : '通知加载失败'
  } finally {
    loading.value = false
  }
}

async function markAllRead() {
  await markAllNotificationsRead()
  ElMessage.success('已全部标记为已读')
  await Promise.all([loadNotices(), loadUnreadCount()])
}

async function markRead(id: number) {
  await markNotificationRead(id)
  ElMessage.success('已标记为已读')
  await Promise.all([loadNotices(), loadUnreadCount()])
}

watch(activeTab, () => {
  pager.pageNo = 1
  loadNotices()
})

onMounted(() => {
  loadUnreadCount()
  loadNotices()
})
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">消息通知</h1>
        <div class="page-desc">展示文档解析、问答失败、系统通知和平台公告。</div>
      </div>
      <div class="header-actions">
        <el-badge :value="unreadCount" :hidden="!unreadCount">
          <el-button plain :disabled="activeTab !== 'notifications'" @click="markAllRead">全部已读</el-button>
        </el-badge>
        <el-button type="primary" :loading="loading" @click="loadNotices">刷新</el-button>
      </div>
    </div>

    <section class="soft-card">
      <div class="soft-card-body">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="通知" name="notifications" />
          <el-tab-pane label="公告" name="announcements" />
        </el-tabs>

        <el-alert v-if="errorMessage" class="state-alert" type="error" show-icon :closable="false" :title="errorMessage" />

        <div class="notice-list" v-loading="loading">
          <article v-for="item in noticeList" :key="item.id" class="notice-item" :class="{ unread: activeTab === 'notifications' && !isReadOf(item) }">
            <div class="notice-head">
              <div>
                <el-tag :type="activeTab === 'announcements' ? statusTagType(item.enabled === false ? 'DISABLED' : 'ENABLED') : 'info'" effect="plain">
                  {{ activeTab === 'announcements' ? (item.enabled === false ? '停用公告' : '系统公告') : item.type }}
                </el-tag>
                <span v-if="activeTab === 'notifications' && !isReadOf(item)" class="unread-dot">未读</span>
              </div>
              <span class="notice-time">{{ timeOf(item) }}</span>
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.content }}</p>
            <el-button v-if="activeTab === 'notifications' && !isReadOf(item)" link type="primary" @click="markRead(item.id)">标记已读</el-button>
          </article>
          <el-empty v-if="!noticeList.length && !loading" :description="activeTab === 'notifications' ? '暂无通知' : '暂无公告'" />
        </div>

        <div class="pagination-row">
          <el-pagination
            v-model:current-page="pager.pageNo"
            v-model:page-size="pager.pageSize"
            layout="total, sizes, prev, pager, next"
            :page-sizes="[10, 20, 50]"
            :total="pager.total"
            @size-change="pager.pageNo = 1; loadNotices()"
            @current-change="loadNotices"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.state-alert {
  margin-bottom: 16px;
}

.notice-list {
  display: grid;
  gap: 12px;
  min-height: 180px;
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
  align-items: center;
  color: var(--color-text-muted);
  font-size: 13px;
}

.unread-dot {
  margin-left: 8px;
  color: var(--color-primary);
  font-weight: 700;
}

h3 {
  margin: 10px 0 6px;
}

p {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.7;
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
