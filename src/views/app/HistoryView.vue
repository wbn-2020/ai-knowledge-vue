<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteChatSession, getChatSessionPage, renameChatSession } from '@/api/knowledge'
import type { ChatSession } from '@/types'
import { messageCountOf, timeOf } from '@/utils/view-adapters'

const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')
const keyword = ref('')
const sessions = ref<ChatSession[]>([])
const pager = reactive({ pageNo: 1, pageSize: 10, total: 0 })

const filteredSessions = computed(() => {
  const value = keyword.value.trim().toLowerCase()
  if (!value) return sessions.value
  return sessions.value.filter((item) => {
    return [item.title, item.knowledgeBaseName, item.latestQuestion]
      .filter(Boolean)
      .some((text) => String(text).toLowerCase().includes(value))
  })
})

async function loadSessions() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await getChatSessionPage({ pageNo: pager.pageNo, pageSize: pager.pageSize })
    sessions.value = data.list || []
    pager.total = data.total || 0
    pager.pageNo = data.pageNo || pager.pageNo
    pager.pageSize = data.pageSize || pager.pageSize
  } catch (error) {
    sessions.value = []
    pager.total = 0
    errorMessage.value = error instanceof Error ? error.message : '会话历史加载失败'
  } finally {
    loading.value = false
  }
}

async function remove(row: ChatSession) {
  await ElMessageBox.confirm(`确认删除会话「${row.title || row.id}」吗？`, '删除确认', { type: 'warning' })
  await deleteChatSession(row.id)
  ElMessage.success('会话已删除')
  if (sessions.value.length === 1 && pager.pageNo > 1) pager.pageNo -= 1
  loadSessions()
}

async function rename(row: ChatSession) {
  const result = await ElMessageBox.prompt('请输入新的会话标题', '重命名会话', {
    inputValue: row.title || '',
    inputValidator: (value) => !!value.trim() || '标题不能为空',
  })
  await renameChatSession(row.id, result.value.trim())
  ElMessage.success('会话已重命名')
  loadSessions()
}

function openDetail(row: ChatSession) {
  router.push(`/app/history/${row.id}`)
}

onMounted(loadSessions)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">问答历史</h1>
        <div class="page-desc">查看历史会话、所属知识库、消息数量和最近提问时间。</div>
      </div>
      <el-button plain :loading="loading" @click="loadSessions">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <div class="toolbar">
      <el-input v-model="keyword" clearable placeholder="在当前页搜索标题、知识库或最近问题" style="max-width: 420px">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <span class="muted">后端暂未提供搜索参数，当前为本页快速筛选。</span>
    </div>

    <el-alert v-if="errorMessage" class="state-alert" type="error" show-icon :closable="false" :title="errorMessage" />

    <section class="soft-card">
      <div class="soft-card-body">
        <el-table :data="filteredSessions" v-loading="loading" size="large" empty-text="暂无会话">
          <el-table-column prop="title" label="会话标题" min-width="220" show-overflow-tooltip />
          <el-table-column label="知识库" width="190">
            <template #default="{ row }">{{ row.knowledgeBaseName || '-' }}</template>
          </el-table-column>
          <el-table-column label="消息数" width="100">
            <template #default="{ row }">{{ messageCountOf(row) }}</template>
          </el-table-column>
          <el-table-column label="最近问题" min-width="260" show-overflow-tooltip>
            <template #default="{ row }">{{ row.latestQuestion || '-' }}</template>
          </el-table-column>
          <el-table-column label="最近提问/更新" width="180">
            <template #default="{ row }">{{ timeOf(row) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="230" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail(row)">详情</el-button>
              <el-button link type="primary" @click="rename(row)">重命名</el-button>
              <el-button link type="danger" @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-row">
          <el-pagination
            v-model:current-page="pager.pageNo"
            v-model:page-size="pager.pageSize"
            layout="total, sizes, prev, pager, next"
            :page-sizes="[10, 20, 50]"
            :total="pager.total"
            @size-change="pager.pageNo = 1; loadSessions()"
            @current-change="loadSessions"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.state-alert {
  margin-bottom: 16px;
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
