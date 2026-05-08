<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteKnowledgeBase, getKnowledgeBasePage } from '@/api/knowledge'
import type { KnowledgeBase } from '@/types'
import { docCountOf, timeOf } from '@/utils/view-adapters'

const router = useRouter()
const loading = ref(false)
const keyword = ref('')
const sortBy = ref('updateTime')
const list = ref<KnowledgeBase[]>([])
const pager = reactive({ pageNo: 1, pageSize: 12, total: 0 })

async function loadList() {
  loading.value = true
  try {
    const data = await getKnowledgeBasePage({ keyword: keyword.value, sortBy: sortBy.value, pageNo: pager.pageNo, pageSize: pager.pageSize })
    list.value = data.list
    pager.total = data.total
  } finally {
    loading.value = false
  }
}

async function removeItem(item: KnowledgeBase) {
  await ElMessageBox.confirm(`确认删除知识库「${item.name}」吗？`, '删除确认', { type: 'warning' })
  await deleteKnowledgeBase(item.id)
  ElMessage.success('知识库已删除')
  loadList()
}

watch([keyword, sortBy], () => {
  pager.pageNo = 1
  loadList()
})

onMounted(loadList)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">知识库管理</h1>
        <div class="page-desc">创建个人知识库，管理文档容器和处理状态。</div>
      </div>
      <el-button type="primary" @click="router.push('/app/knowledge/create')">
        <el-icon><Plus /></el-icon>
        创建知识库
      </el-button>
    </div>

    <div class="toolbar">
      <el-input v-model="keyword" clearable placeholder="搜索知识库名称或简介" style="max-width: 360px">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="sortBy" style="width: 180px">
        <el-option label="按更新时间排序" value="updateTime" />
        <el-option label="按创建时间排序" value="createTime" />
      </el-select>
    </div>

    <div v-loading="loading" class="knowledge-grid">
      <article v-for="item in list" :key="item.id" class="knowledge-card" @click="router.push(`/app/knowledge/${item.id}`)">
        <div class="card-top">
          <div class="kb-icon">{{ item.icon || '📚' }}</div>
          <el-tag :type="item.status === 'NORMAL' ? 'success' : item.status === 'FAILED' ? 'danger' : 'warning'" effect="plain">
            {{ item.status }}
          </el-tag>
        </div>
        <h3>{{ item.name }}</h3>
        <p>{{ item.description || '暂无简介' }}</p>
        <div class="card-meta">
          <span>{{ item.category || '未分类' }}</span>
          <span>{{ docCountOf(item) }} 个文档</span>
        </div>
        <div class="card-footer">
          <span>更新于 {{ timeOf(item) }}</span>
          <div>
            <el-button link type="primary" @click.stop="router.push(`/app/knowledge/${item.id}`)">详情</el-button>
            <el-button link @click.stop="router.push(`/app/knowledge/${item.id}/edit`)">编辑</el-button>
            <el-button link type="danger" @click.stop="removeItem(item)">删除</el-button>
          </div>
        </div>
      </article>
    </div>
    <el-empty v-if="!loading && !list.length" description="暂无知识库" />
    <div class="pagination-row" v-if="pager.total > pager.pageSize">
      <el-pagination v-model:current-page="pager.pageNo" v-model:page-size="pager.pageSize" layout="prev, pager, next" :total="pager.total" @current-change="loadList" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.knowledge-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; min-height: 160px; }
.knowledge-card { padding: 20px; border-radius: var(--radius-card); background: var(--color-surface); border: 1px solid var(--color-border); box-shadow: var(--shadow-soft); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
.knowledge-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-card); border-color: rgba(37, 99, 235, 0.28); }
.card-top, .card-footer, .card-meta { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.kb-icon { width: 46px; height: 46px; display: grid; place-items: center; border-radius: 14px; background: var(--color-primary-weak); font-size: 22px; }
h3 { margin: 18px 0 8px; font-size: 18px; }
p { min-height: 48px; margin: 0; color: var(--color-text-muted); line-height: 1.6; }
.card-meta { margin-top: 16px; color: var(--color-text-muted); font-size: 13px; }
.card-footer { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--color-border); color: var(--color-text-muted); font-size: 13px; }
.pagination-row { display: flex; justify-content: flex-end; margin-top: 18px; }
@media (max-width: 1100px) { .knowledge-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 720px) { .knowledge-grid { grid-template-columns: 1fr; } }
</style>
