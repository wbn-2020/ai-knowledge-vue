<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { getAdminFeedbackPage } from '@/api/chatFeedback'
import type { AdminFeedbackVO, FeedbackReason, FeedbackType } from '@/types'
import { textOf } from '@/utils/view-adapters'

const loading = ref(false)
const rows = ref<AdminFeedbackVO[]>([])
const detailVisible = ref(false)
const detailTitle = ref('')
const detailText = ref('')
const pager = reactive({ pageNo: 1, pageSize: 10, total: 0 })

const filters = reactive<{
  feedbackType: FeedbackType | ''
  reason: FeedbackReason | ''
  username: string
  keyword: string
}>({
  feedbackType: '',
  reason: '',
  username: '',
  keyword: '',
})

const reasonOptions: Array<{ label: string; value: FeedbackReason }> = [
  { label: '答非所问', value: 'NOT_RELEVANT' },
  { label: '内容不正确', value: 'INCORRECT' },
  { label: '回答不完整', value: 'INCOMPLETE' },
  { label: '疑似幻觉', value: 'HALLUCINATION' },
  { label: '引用来源不准确', value: 'BAD_REFERENCE' },
  { label: '其他', value: 'OTHER' },
]

const feedbackTypeLabel = computed(() => ({
  LIKE: '点赞',
  DISLIKE: '点踩',
}))

function feedbackTypeText(type?: string) {
  if (type === 'LIKE' || type === 'DISLIKE') return feedbackTypeLabel.value[type]
  return '-'
}

function reasonLabel(reason?: FeedbackReason | null) {
  return reasonOptions.find((item) => item.value === reason)?.label || '-'
}

function cleanParams(params: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null))
}

function openDetail(title: string, value?: string | null) {
  detailTitle.value = title
  detailText.value = String(value || '-')
  detailVisible.value = true
}

async function loadFeedbacks() {
  loading.value = true
  try {
    const data = await getAdminFeedbackPage(
      cleanParams({
        pageNo: pager.pageNo,
        pageSize: pager.pageSize,
        feedbackType: filters.feedbackType || undefined,
        reason: filters.reason || undefined,
        username: filters.username.trim() || undefined,
        keyword: filters.keyword.trim() || undefined,
      }),
    )
    rows.value = data?.list || []
    pager.total = data?.total || 0
    pager.pageNo = data?.pageNo || pager.pageNo
    pager.pageSize = data?.pageSize || pager.pageSize
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.feedbackType = ''
  filters.reason = ''
  filters.username = ''
  filters.keyword = ''
  pager.pageNo = 1
  loadFeedbacks()
}

onMounted(() => {
  loadFeedbacks()
})
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">回答反馈管理</h1>
        <div class="page-desc">查看用户在问答中的点赞、点踩反馈记录。</div>
      </div>
    </div>

    <section class="soft-card">
      <div class="soft-card-body">
        <div class="filter-bar">
          <el-select v-model="filters.feedbackType" clearable placeholder="反馈类型">
            <el-option label="点赞" value="LIKE" />
            <el-option label="点踩" value="DISLIKE" />
          </el-select>
          <el-select v-model="filters.reason" clearable placeholder="点踩原因">
            <el-option v-for="item in reasonOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-input v-model="filters.username" clearable placeholder="用户名" />
          <el-input v-model="filters.keyword" clearable placeholder="关键字（问题/回答）" />
          <div class="filter-actions">
            <el-button type="primary" :loading="loading" @click="pager.pageNo = 1; loadFeedbacks()">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </div>
        </div>

        <el-table :data="rows" v-loading="loading" class="feedback-table" size="large">
          <el-table-column label="ID" width="90"><template #default="{ row }">{{ textOf(row.feedbackId) }}</template></el-table-column>
          <el-table-column label="用户名" width="120"><template #default="{ row }">{{ textOf(row.username) }}</template></el-table-column>
          <el-table-column label="反馈类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.feedbackType === 'LIKE' ? 'success' : 'danger'" effect="plain">{{ feedbackTypeText(row.feedbackType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="原因" width="130"><template #default="{ row }">{{ reasonLabel(row.reason) }}</template></el-table-column>
          <el-table-column label="备注" min-width="180" show-overflow-tooltip><template #default="{ row }">{{ textOf(row.remark) }}</template></el-table-column>
          <el-table-column label="回答类型" width="100"><template #default="{ row }">{{ textOf(row.answerType) }}</template></el-table-column>
          <el-table-column label="知识库" width="160" show-overflow-tooltip><template #default="{ row }">{{ textOf(row.knowledgeBaseName) }}</template></el-table-column>
          <el-table-column label="文档" width="160" show-overflow-tooltip><template #default="{ row }">{{ textOf(row.documentName) }}</template></el-table-column>
          <el-table-column label="问题" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail('问题详情', row.question)">{{ textOf(row.question) }}</el-button>
            </template>
          </el-table-column>
          <el-table-column label="回答" min-width="260" show-overflow-tooltip>
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail('回答详情', row.answer)">{{ textOf(row.answer) }}</el-button>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="180"><template #default="{ row }">{{ textOf(row.createdAt) }}</template></el-table-column>
        </el-table>

        <div class="pagination-row">
          <el-pagination
            v-model:current-page="pager.pageNo"
            v-model:page-size="pager.pageSize"
            layout="total, sizes, prev, pager, next"
            :page-sizes="[10, 20, 50]"
            :total="pager.total"
            @size-change="pager.pageNo = 1; loadFeedbacks()"
            @current-change="loadFeedbacks"
          />
        </div>
      </div>
    </section>

    <el-dialog v-model="detailVisible" :title="detailTitle" width="720px">
      <div class="detail-content">{{ detailText }}</div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.feedback-table {
  min-width: 1900px;
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.detail-content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.7;
  max-height: 55vh;
  overflow: auto;
}
</style>
