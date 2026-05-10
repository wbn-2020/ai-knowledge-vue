<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getKnowledgeBasePage, keywordSearch, semanticSearch } from '@/api/knowledge'
import type { KnowledgeBase, SearchResult } from '@/types'
import { searchContentOf } from '@/utils/view-adapters'

const query = ref('')
const mode = ref<'semantic' | 'keyword'>('semantic')
const selectedKb = ref<number>()
const topK = ref(10)
const knowledgeBases = ref<KnowledgeBase[]>([])
const loading = ref(false)
const errorMessage = ref('')
const searched = ref(false)
const results = ref<SearchResult[]>([])

const SCORE_THRESHOLD = 0.7

async function loadKnowledgeBases() {
  const data = await getKnowledgeBasePage({ pageNo: 1, pageSize: 100, sortBy: 'updateTime' })
  knowledgeBases.value = data.list || []
  selectedKb.value = data.list?.[0]?.id
}

function resultScore(item: SearchResult) {
  const raw = (item as any)?.finalScore ?? (item as any)?.score
  const score = Number(raw)
  return Number.isFinite(score) ? score : NaN
}

function resultScoreText(item: SearchResult) {
  const score = resultScore(item)
  return Number.isFinite(score) ? score.toFixed(2) : '-'
}

function resultDocumentName(item: SearchResult, index: number) {
  const name =
    (item as any)?.documentName ||
    (item as any)?.document_name ||
    (item as any)?.name ||
    (item as any)?.title ||
    (item as any)?.fileName ||
    (item as any)?.originalName ||
    (item as any)?.document?.name ||
    (item as any)?.document?.originalName
  return name && String(name).trim() ? String(name).trim() : `检索结果 ${index + 1}`
}

function resultChunkIndex(item: SearchResult) {
  const chunkIndex = (item as any)?.chunkIndex ?? (item as any)?.index
  if (chunkIndex !== undefined && chunkIndex !== null && chunkIndex !== '') return chunkIndex
  if ((item as any)?.chunkId !== undefined && (item as any)?.chunkId !== null && (item as any)?.chunkId !== '') return (item as any)?.chunkId
  return '-'
}

const visibleResults = computed(() => {
  const list = Array.isArray(results.value) ? results.value : []
  if (mode.value !== 'semantic') return list
  return list.filter((item) => {
    const score = resultScore(item)
    return Number.isFinite(score) && score >= SCORE_THRESHOLD
  })
})

async function search() {
  if (!selectedKb.value) {
    ElMessage.warning('请选择知识库')
    return
  }
  if (!query.value.trim()) {
    ElMessage.warning('请输入搜索内容')
    return
  }

  loading.value = true
  errorMessage.value = ''
  searched.value = true
  try {
    const data =
      mode.value === 'semantic'
        ? await semanticSearch({ knowledgeBaseId: selectedKb.value, query: query.value.trim(), topK: topK.value })
        : await keywordSearch({ knowledgeBaseId: selectedKb.value, keyword: query.value.trim(), topK: topK.value })
    results.value = Array.isArray(data) ? data : []
  } catch (error) {
    results.value = []
    errorMessage.value = error instanceof Error ? error.message : '搜索失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

onMounted(loadKnowledgeBases)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">语义搜索</h1>
        <div class="page-desc">在指定知识库中检索相关文档切片，支持语义召回和关键词搜索。</div>
      </div>
    </div>

    <section class="search-box soft-card">
      <div class="soft-card-body search-form">
        <el-select v-model="selectedKb" placeholder="选择知识库">
          <el-option v-for="kb in knowledgeBases" :key="kb.id" :label="kb.name" :value="kb.id" />
        </el-select>
        <el-segmented v-model="mode" :options="[{ label: '语义搜索', value: 'semantic' }, { label: '关键词', value: 'keyword' }]" />
        <el-input-number v-model="topK" :min="1" :max="50" controls-position="right" />
        <el-input v-model="query" size="large" placeholder="输入关键词或自然语言问题" @keyup.enter="search">
          <template #prefix><el-icon><Search /></el-icon></template>
          <template #append><el-button type="primary" :loading="loading" @click="search">搜索</el-button></template>
        </el-input>
      </div>
    </section>

    <el-alert v-if="errorMessage" class="state-alert" type="error" show-icon :closable="false" :title="errorMessage" />

    <div class="result-list" v-loading="loading">
      <article v-for="(item, index) in visibleResults" :key="item.id || `${item.documentId}-${item.chunkId}-${index}`" class="result-card soft-card">
        <div class="soft-card-body">
          <div class="result-head">
            <div>
              <h3>{{ resultDocumentName(item, index) }}</h3>
              <span class="muted">切片 {{ resultChunkIndex(item) }} · 相似度 {{ resultScoreText(item) }}</span>
            </div>
            <el-tag effect="plain">相似度 {{ resultScoreText(item) }}</el-tag>
          </div>
          <p>{{ searchContentOf(item) }}</p>
        </div>
      </article>

      <el-empty
        v-if="searched && !loading && !visibleResults.length && !errorMessage"
        :description="mode === 'semantic' ? '未找到足够相关内容，请换个关键词或检查知识库文档。' : '暂无搜索结果'"
      />
      <el-empty v-if="!searched && !loading" description="选择知识库并输入内容后开始搜索" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.search-box,
.state-alert {
  margin-bottom: 16px;
}

.search-form {
  display: grid;
  grid-template-columns: 240px auto 120px 1fr;
  gap: 12px;
  align-items: center;
}

.result-list {
  display: grid;
  gap: 12px;
  min-height: 160px;
}

.result-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

h3 {
  margin: 0 0 6px;
}

p {
  margin: 12px 0 0;
  color: var(--color-text-muted);
  line-height: 1.7;
  white-space: pre-wrap;
}

@media (max-width: 980px) {
  .search-form {
    grid-template-columns: 1fr;
  }
}
</style>
