<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getAnnouncements,
  getNotificationPage,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/knowledge'
import type { NotificationItem } from '@/types'
import { isReadOf, statusTagType, timeDisplayOf } from '@/utils/view-adapters'

type NoticeTab = 'notifications' | 'announcements'

const activeTab = ref<NoticeTab>('notifications')
const loading = ref(false)
const errorMessage = ref('')
const unreadCount = ref(0)
const noticeList = ref<NotificationItem[]>([])
const pager = reactive({ pageNo: 1, pageSize: 10, total: 0 })

const detailVisible = ref(false)
const selectedAnnouncement = ref<NotificationItem | null>(null)

const selectedAnnouncementTime = computed(() =>
  selectedAnnouncement.value ? timeDisplayOf(selectedAnnouncement.value) : '-',
)

function summaryOf(text: string, maxLength = 180) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength)}...`
}

function openAnnouncementDetail(item: NotificationItem) {
  selectedAnnouncement.value = item
  detailVisible.value = true
}

function closeAnnouncementDetail() {
  detailVisible.value = false
  selectedAnnouncement.value = null
}

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
    const data =
      activeTab.value === 'notifications'
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
  closeAnnouncementDetail()
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
          <article
            v-for="item in noticeList"
            :key="item.id"
            class="notice-item"
            :class="{ unread: activeTab === 'notifications' && !isReadOf(item), announcement: activeTab === 'announcements' }"
            @click="activeTab === 'announcements' ? openAnnouncementDetail(item) : null"
          >
            <div class="notice-head">
              <div>
                <el-tag :type="activeTab === 'announcements' ? statusTagType(item.enabled === false ? 'DISABLED' : 'ENABLED') : 'info'" effect="plain">
                  {{ activeTab === 'announcements' ? (item.enabled === false ? '停用公告' : '系统公告') : item.type }}
                </el-tag>
                <span v-if="activeTab === 'notifications' && !isReadOf(item)" class="unread-dot">未读</span>
              </div>
              <span class="notice-time">{{ timeDisplayOf(item) }}</span>
            </div>
            <h3 :class="{ 'notice-title-clamp': activeTab === 'announcements' }">{{ item.title }}</h3>
            <p :class="{ 'notice-content-clamp': activeTab === 'announcements' }">
              {{ activeTab === 'announcements' ? summaryOf(item.content || '') : item.content }}
            </p>
            <div class="notice-actions">
              <el-button
                v-if="activeTab === 'notifications' && !isReadOf(item)"
                link
                type="primary"
                @click.stop="markRead(item.id)"
              >
                标记已读
              </el-button>
              <el-button
                v-if="activeTab === 'announcements'"
                link
                type="primary"
                @click.stop="openAnnouncementDetail(item)"
              >
                查看详情
              </el-button>
            </div>
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

    <el-dialog
      v-model="detailVisible"
      title="公告详情"
      width="760px"
      destroy-on-close
      @closed="closeAnnouncementDetail"
    >
      <template v-if="selectedAnnouncement">
        <h2 class="detail-title">{{ selectedAnnouncement.title || '-' }}</h2>
        <div class="detail-time">发布时间：{{ selectedAnnouncementTime }}</div>
        <div class="detail-content">
          {{ selectedAnnouncement.content || '-' }}
        </div>
      </template>
    </el-dialog>
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

.notice-item.announcement {
  cursor: pointer;
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

.notice-title-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notice-content-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notice-actions {
  margin-top: 8px;
}

.detail-title {
  margin: 0 0 8px;
  font-size: 22px;
}

.detail-time {
  color: var(--color-text-muted);
  margin-bottom: 12px;
}

.detail-content {
  max-height: 70vh;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
  line-height: 1.75;
  padding: 12px;
  border-radius: 10px;
  background: var(--color-surface-soft);
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
