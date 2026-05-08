<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getDocumentPage, getKnowledgeBasePage, summarizeDocument, summarizeKnowledgeBase } from '@/api/knowledge'
import type { DocumentItem, KnowledgeBase } from '@/types'
import { documentNameOf } from '@/utils/view-adapters'

const selectedDocument = ref<number>()
const selectedKb = ref<number>()
const documents = ref<DocumentItem[]>([])
const knowledgeBases = ref<KnowledgeBase[]>([])
const docSummary = ref('')
const kbSummary = ref('')
const loadingDoc = ref(false)
const loadingKb = ref(false)

async function loadOptions() {
  const [docData, kbData] = await Promise.all([
    getDocumentPage({ pageNo: 1, pageSize: 100 }),
    getKnowledgeBasePage({ pageNo: 1, pageSize: 100, sortBy: 'updateTime' }),
  ])
  documents.value = docData.list
  knowledgeBases.value = kbData.list
  selectedDocument.value = docData.list[0]?.id
  selectedKb.value = kbData.list[0]?.id
}

async function generateDocumentSummary() {
  if (!selectedDocument.value) return
  loadingDoc.value = true
  try {
    const data: any = await summarizeDocument(selectedDocument.value)
    docSummary.value = typeof data === 'string' ? data : data?.summary || data?.content || JSON.stringify(data, null, 2)
  } finally {
    loadingDoc.value = false
  }
}

async function generateKbSummary() {
  if (!selectedKb.value) return
  loadingKb.value = true
  try {
    const data: any = await summarizeKnowledgeBase(selectedKb.value)
    kbSummary.value = typeof data === 'string' ? data : data?.summary || data?.content || JSON.stringify(data, null, 2)
  } finally {
    loadingKb.value = false
  }
}

onMounted(loadOptions)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">知识整理</h1>
        <div class="page-desc">生成文档摘要和知识库摘要，作为 AI 应用亮点。</div>
      </div>
    </div>

    <div class="section-grid">
      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">文档摘要</h3>
          <el-select v-model="selectedDocument" placeholder="选择文档" style="width: 100%">
            <el-option v-for="doc in documents" :key="doc.id" :label="documentNameOf(doc)" :value="doc.id" />
          </el-select>
          <div class="summary-card">{{ docSummary || '选择文档后点击生成摘要。' }}</div>
          <el-button type="primary" :loading="loadingDoc" @click="generateDocumentSummary">生成文档摘要</el-button>
        </div>
      </section>

      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">知识库摘要</h3>
          <el-select v-model="selectedKb" placeholder="选择知识库" style="width: 100%">
            <el-option v-for="kb in knowledgeBases" :key="kb.id" :label="kb.name" :value="kb.id" />
          </el-select>
          <div class="summary-card">{{ kbSummary || '选择知识库后点击生成整体摘要。' }}</div>
          <el-button type="primary" :loading="loadingKb" @click="generateKbSummary">生成知识库摘要</el-button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.summary-card { margin: 16px 0; min-height: 160px; padding: 18px; border-radius: 14px; background: var(--color-surface-soft); color: var(--color-text-muted); line-height: 1.8; white-space: pre-wrap; }
</style>
