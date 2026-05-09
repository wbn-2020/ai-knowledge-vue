<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getDocumentPage,
  getDocumentSummary,
  getKnowledgeBasePage,
  getKnowledgeBaseSummary,
  summarizeDocument,
  summarizeKnowledgeBase,
} from '@/api/knowledge'
import type { DocumentItem, KnowledgeBase } from '@/types'
import { documentNameOf } from '@/utils/view-adapters'

const EMPTY_DOC_SUMMARY_TEXT = '选择文档后点击生成摘要。'
const EMPTY_KB_SUMMARY_TEXT = '选择知识库后点击生成整体摘要。'

const selectedDocument = ref<number>()
const selectedKb = ref<number>()
const documents = ref<DocumentItem[]>([])
const knowledgeBases = ref<KnowledgeBase[]>([])
const docSummary = ref('')
const kbSummary = ref('')
const queryDocLoading = ref(false)
const generateDocLoading = ref(false)
const queryKbLoading = ref(false)
const generateKbLoading = ref(false)

function extractSummaryText(data: any): string {
  if (typeof data === 'string') return data
  if (!data || typeof data !== 'object') return ''
  if (typeof data.summary === 'string') return data.summary
  if (typeof data.content === 'string') return data.content
  return ''
}

function errorMessageOf(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

async function queryDocumentSummary(documentId?: number) {
  if (!documentId) {
    docSummary.value = ''
    return
  }
  queryDocLoading.value = true
  try {
    const data: any = await getDocumentSummary(documentId)
    docSummary.value = extractSummaryText(data)
  } catch (error) {
    docSummary.value = ''
    ElMessage.error(errorMessageOf(error, '查询文档摘要失败'))
  } finally {
    queryDocLoading.value = false
  }
}

async function queryKnowledgeBaseSummary(knowledgeBaseId?: number) {
  if (!knowledgeBaseId) {
    kbSummary.value = ''
    return
  }
  queryKbLoading.value = true
  try {
    const data: any = await getKnowledgeBaseSummary(knowledgeBaseId)
    kbSummary.value = extractSummaryText(data)
  } catch (error) {
    kbSummary.value = ''
    ElMessage.error(errorMessageOf(error, '查询知识库摘要失败'))
  } finally {
    queryKbLoading.value = false
  }
}

async function loadOptions() {
  const [docData, kbData] = await Promise.all([
    getDocumentPage({ pageNo: 1, pageSize: 100 }),
    getKnowledgeBasePage({ pageNo: 1, pageSize: 100, sortBy: 'updateTime' }),
  ])
  documents.value = docData.list || []
  knowledgeBases.value = kbData.list || []
  selectedDocument.value = documents.value[0]?.id
  selectedKb.value = knowledgeBases.value[0]?.id

  await Promise.all([
    queryDocumentSummary(selectedDocument.value),
    queryKnowledgeBaseSummary(selectedKb.value),
  ])
}

async function generateDocumentSummary() {
  if (!selectedDocument.value) return
  generateDocLoading.value = true
  try {
    const data: any = await summarizeDocument(selectedDocument.value)
    const generatedSummary = extractSummaryText(data)
    docSummary.value = generatedSummary
    await queryDocumentSummary(selectedDocument.value)
  } catch (error) {
    ElMessage.error(errorMessageOf(error, '生成文档摘要失败'))
  } finally {
    generateDocLoading.value = false
  }
}

async function generateKbSummary() {
  if (!selectedKb.value) return
  generateKbLoading.value = true
  try {
    const data: any = await summarizeKnowledgeBase(selectedKb.value)
    kbSummary.value = extractSummaryText(data)
    await queryKnowledgeBaseSummary(selectedKb.value)
  } catch (error) {
    ElMessage.error(errorMessageOf(error, '生成知识库摘要失败'))
  } finally {
    generateKbLoading.value = false
  }
}

watch(selectedDocument, async (id, prevId) => {
  if (id === prevId) return
  await queryDocumentSummary(id)
})

watch(selectedKb, async (id, prevId) => {
  if (id === prevId) return
  await queryKnowledgeBaseSummary(id)
})

onMounted(loadOptions)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">知识整理</h1>
        <div class="page-desc">生成文档摘要和知识库摘要，用于后续问答与内容沉淀。</div>
      </div>
    </div>

    <div class="section-grid">
      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">文档摘要</h3>
          <el-select v-model="selectedDocument" placeholder="选择文档" style="width: 100%">
            <el-option v-for="doc in documents" :key="doc.id" :label="documentNameOf(doc)" :value="doc.id" />
          </el-select>
          <div v-loading="queryDocLoading" class="summary-card">
            {{ docSummary || EMPTY_DOC_SUMMARY_TEXT }}
          </div>
          <el-button type="primary" :loading="generateDocLoading" @click="generateDocumentSummary">生成文档摘要</el-button>
        </div>
      </section>

      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">知识库摘要</h3>
          <el-select v-model="selectedKb" placeholder="选择知识库" style="width: 100%">
            <el-option v-for="kb in knowledgeBases" :key="kb.id" :label="kb.name" :value="kb.id" />
          </el-select>
          <div v-loading="queryKbLoading" class="summary-card">
            {{ kbSummary || EMPTY_KB_SUMMARY_TEXT }}
          </div>
          <el-button type="primary" :loading="generateKbLoading" @click="generateKbSummary">生成知识库摘要</el-button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.summary-card {
  margin: 16px 0;
  min-height: 160px;
  padding: 18px;
  border-radius: 14px;
  background: var(--color-surface-soft);
  color: var(--color-text-muted);
  line-height: 1.8;
  white-space: pre-wrap;
}
</style>
