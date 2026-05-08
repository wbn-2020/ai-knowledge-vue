<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteAdminKnowledgeBase, getAdminKnowledgeBase, getAdminDocuments, setAdminKnowledgeBaseStatus } from '@/api/knowledge'
import type { DocumentItem, KnowledgeBase } from '@/types'
import { docCountOf, documentNameOf, timeOf } from '@/utils/view-adapters'

const route = useRoute()
const kb = ref<KnowledgeBase | null>(null)
const relatedDocuments = ref<DocumentItem[]>([])
const loading = ref(false)
const docLoading = ref(false)
const docPager = reactive({ pageNo: 1, pageSize: 10, total: 0 })

async function loadDetail() {
  loading.value = true
  try {
    kb.value = await getAdminKnowledgeBase(Number(route.params.id))
    await loadDocuments()
  } finally {
    loading.value = false
  }
}

async function loadDocuments() {
  docLoading.value = true
  try {
    const docs = await getAdminDocuments({
      knowledgeBaseId: Number(route.params.id),
      pageNo: docPager.pageNo,
      pageSize: docPager.pageSize,
    })
    relatedDocuments.value = docs.list || []
    docPager.total = docs.total || 0
    docPager.pageNo = docs.pageNo || docPager.pageNo
    docPager.pageSize = docs.pageSize || docPager.pageSize
  } finally {
    docLoading.value = false
  }
}

async function updateStatus(status: string) {
  if (!kb.value) return
  await setAdminKnowledgeBaseStatus(kb.value.id, status)
  ElMessage.success('知识库状态已更新')
  loadDetail()
}

async function remove() {
  if (!kb.value) return
  await ElMessageBox.confirm(`确认删除知识库「${kb.value.name}」吗？`, '删除确认', { type: 'warning' })
  await deleteAdminKnowledgeBase(kb.value.id)
  ElMessage.success('知识库已删除')
  history.back()
}

onMounted(loadDetail)
</script>

<template>
  <div v-loading="loading">
    <div class="page-header"><div><h1 class="page-title">后台知识库详情</h1><div class="page-desc">查看平台知识库基础信息、文档列表和处理状态。</div></div></div>
    <template v-if="kb">
      <div class="detail-grid">
        <section class="soft-card"><div class="soft-card-body">
          <span class="subtle-badge">{{ kb.category || '未分类' }}</span><h2>{{ kb.name }}</h2><p class="desc">{{ kb.description }}</p>
          <div class="meta-grid">
            <div><span>文档数量</span><strong>{{ docCountOf(kb) }}</strong></div><div><span>状态</span><strong>{{ kb.status }}</strong></div>
            <div><span>更新时间</span><strong>{{ timeOf(kb) }}</strong></div><div><span>创建时间</span><strong>{{ (kb as any).createdAt || (kb as any).createTime || '-' }}</strong></div>
            <div><span>创建人</span><strong>{{ (kb as any).username || (kb as any).ownerName || '-' }}</strong></div><div><span>问答次数</span><strong>{{ (kb as any).qaCount || 0 }}</strong></div>
          </div>
        </div></section>
        <section class="soft-card"><div class="soft-card-body"><h3 class="section-title">操作</h3><div class="action-list">
          <el-button type="warning" @click="updateStatus('DISABLED')">禁用知识库</el-button><el-button type="success" @click="updateStatus('NORMAL')">启用知识库</el-button><el-button type="danger" @click="remove">删除违规知识库</el-button>
        </div></div></section>
      </div>
      <section class="soft-card related"><div class="soft-card-body"><div class="section-head"><h3 class="section-title">关联文档</h3><el-button plain :loading="docLoading" @click="loadDocuments">刷新文档</el-button></div>
        <el-table :data="relatedDocuments" v-loading="docLoading" size="large" empty-text="暂无关联文档">
          <el-table-column label="文档名称" min-width="220"><template #default="{ row }">{{ documentNameOf(row) }}</template></el-table-column>
          <el-table-column prop="parseStatus" label="解析状态" width="120" /><el-table-column prop="embeddingStatus" label="向量状态" width="120" />
        </el-table>
        <div class="pagination-row">
          <el-pagination
            v-model:current-page="docPager.pageNo"
            v-model:page-size="docPager.pageSize"
            layout="total, sizes, prev, pager, next"
            :page-sizes="[10, 20, 50]"
            :total="docPager.total"
            @size-change="docPager.pageNo = 1; loadDocuments()"
            @current-change="loadDocuments"
          />
        </div>
      </div></section>
    </template>
  </div>
</template>

<style scoped lang="scss">
.detail-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 16px; }
h2 { margin: 14px 0 10px; font-size: 28px; }
.desc { color: var(--color-text-muted); line-height: 1.7; }
.meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 18px; }
.meta-grid span { display: block; color: var(--color-text-muted); font-size: 13px; }
.meta-grid strong { display: block; margin-top: 6px; }
.action-list { display: grid; gap: 10px; }
.related { margin-top: 16px; }
.section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.pagination-row { display: flex; justify-content: flex-end; margin-top: 16px; }
@media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }
</style>
