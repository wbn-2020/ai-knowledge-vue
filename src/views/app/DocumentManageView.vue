<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadFile, UploadFiles, UploadInstance } from 'element-plus'
import { deleteDocument, getDocumentPage, getKnowledgeBasePage, renameDocument, retryDocument, uploadDocument } from '@/api/knowledge'
import type { DocumentItem, KnowledgeBase } from '@/types'
import { documentErrorOf, documentNameOf, embeddingStatusText, fileSizeOf, fileTypeOf, kbNameOf, parseStatusText, statusTagType, timeOf } from '@/utils/view-adapters'

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md']
const MAX_FILE_SIZE = 20 * 1024 * 1024

const route = useRoute()
const loading = ref(false)
const errorMessage = ref('')
const keyword = ref('')
const filterKnowledgeBaseId = ref<number>()
const parseStatus = ref('')
const embeddingStatus = ref('')
const uploadDialog = ref(false)
const docs = ref<DocumentItem[]>([])
const knowledgeBases = ref<KnowledgeBase[]>([])
const selectedKb = ref<number>()
const uploadFile = ref<File | null>(null)
const uploadRef = ref<UploadInstance>()
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadError = ref('')
const pager = reactive({ pageNo: 1, pageSize: 10, total: 0 })
const hasKnowledgeBases = computed(() => knowledgeBases.value.length > 0)

function validateFile(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (!ALLOWED_EXTENSIONS.includes(ext)) return `仅支持 ${ALLOWED_EXTENSIONS.join(' / ').toUpperCase()} 文件`
  if (file.size > MAX_FILE_SIZE) return '单文件大小不能超过 20MB'
  return ''
}

async function loadDocs() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await getDocumentPage({
      knowledgeBaseId: filterKnowledgeBaseId.value,
      keyword: keyword.value,
      parseStatus: parseStatus.value,
      embeddingStatus: embeddingStatus.value,
      pageNo: pager.pageNo,
      pageSize: pager.pageSize,
    })
    docs.value = data.list || []
    pager.total = data.total || 0
    pager.pageNo = data.pageNo || pager.pageNo
    pager.pageSize = data.pageSize || pager.pageSize
  } catch (error) {
    docs.value = []
    pager.total = 0
    errorMessage.value = error instanceof Error ? error.message : '文档列表加载失败'
  } finally {
    loading.value = false
  }
}

async function loadKnowledgeBases() {
  const data = await getKnowledgeBasePage({ pageNo: 1, pageSize: 100, sortBy: 'updateTime' })
  knowledgeBases.value = data.list || []
  const queryKb = Number(route.query.knowledgeBaseId || 0)
  const matchedKb = data.list?.find((item) => item.id === queryKb)
  selectedKb.value = matchedKb?.id || data.list?.[0]?.id
  filterKnowledgeBaseId.value = matchedKb?.id || filterKnowledgeBaseId.value
  if (!knowledgeBases.value.length) {
    selectedKb.value = undefined
    filterKnowledgeBaseId.value = undefined
  }
}

function onFileChange(file: UploadFile, files: UploadFiles) {
  uploadError.value = ''
  uploadProgress.value = 0
  const raw = file.raw || null
  if (!raw) return
  const error = validateFile(raw)
  if (error) {
    uploadError.value = error
    uploadFile.value = null
    files.splice(0, files.length)
    ElMessage.warning(error)
    return
  }
  uploadFile.value = raw
}

function resetUpload() {
  uploadFile.value = null
  uploadProgress.value = 0
  uploadError.value = ''
  uploadRef.value?.clearFiles()
}

async function submitUpload() {
  if (!hasKnowledgeBases.value) return ElMessage.warning('请先创建知识库')
  if (!selectedKb.value) return ElMessage.warning('请选择目标知识库')
  if (!uploadFile.value) return ElMessage.warning('请选择要上传的文件')
  uploading.value = true
  uploadProgress.value = 0
  uploadError.value = ''
  try {
    await uploadDocument(selectedKb.value, uploadFile.value, (event) => {
      if (event.total) uploadProgress.value = Math.round((event.loaded / event.total) * 100)
    })
    ElMessage.success('文档已上传，后台将继续解析和向量化')
    uploadDialog.value = false
    resetUpload()
    filterKnowledgeBaseId.value = selectedKb.value
    pager.pageNo = 1
    await loadDocs()
  } catch (error) {
    uploadError.value = error instanceof Error ? error.message : '上传失败，请稍后重试'
  } finally {
    uploading.value = false
  }
}

async function removeDoc(row: DocumentItem) {
  await ElMessageBox.confirm(`确认删除文档「${documentNameOf(row)}」吗？`, '删除确认', { type: 'warning' })
  await deleteDocument(row.id)
  ElMessage.success('文档已删除')
  if (docs.value.length === 1 && pager.pageNo > 1) pager.pageNo -= 1
  await loadDocs()
}

async function retry(row: DocumentItem) {
  await retryDocument(row.id)
  ElMessage.success('已提交重新解析任务')
  await loadDocs()
}

async function rename(row: DocumentItem) {
  const result = await ElMessageBox.prompt('请输入新的文档名称', '重命名文档', {
    inputValue: documentNameOf(row),
    inputValidator: (value) => !!value.trim() || '文档名称不能为空',
  })
  await renameDocument(row.id, result.value.trim())
  ElMessage.success('文档已重命名')
  await loadDocs()
}

watch([keyword, filterKnowledgeBaseId, parseStatus, embeddingStatus], () => {
  pager.pageNo = 1
  loadDocs()
})

onMounted(() => {
  loadKnowledgeBases()
  loadDocs()
})
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">文档管理</h1>
        <div class="page-desc">上传 PDF、DOCX、TXT、MD 文档，查看解析和向量状态。</div>
      </div>
      <el-button type="primary" :disabled="!hasKnowledgeBases" @click="uploadDialog = true">
        <el-icon><Upload /></el-icon>上传文档
      </el-button>
    </div>
    <el-alert v-if="!hasKnowledgeBases" class="state-alert" type="warning" show-icon :closable="false" title="请先创建知识库" />
    <el-alert v-if="errorMessage" class="state-alert" type="error" show-icon :closable="false" :title="errorMessage" />

    <div class="toolbar">
      <el-input v-model="keyword" clearable placeholder="搜索文档或知识库" style="max-width: 360px" />
      <el-select v-model="filterKnowledgeBaseId" placeholder="所属知识库" clearable style="width: 220px">
        <el-option v-for="kb in knowledgeBases" :key="kb.id" :label="kb.name" :value="kb.id" />
      </el-select>
      <el-select v-model="parseStatus" placeholder="解析状态" clearable style="width: 160px">
        <el-option label="待解析" value="PENDING" /><el-option label="解析中" value="PARSING" /><el-option label="解析成功" value="SUCCESS" /><el-option label="解析失败" value="FAILED" />
      </el-select>
      <el-select v-model="embeddingStatus" placeholder="向量状态" clearable style="width: 160px">
        <el-option label="待向量化" value="PENDING" /><el-option label="向量化中" value="PROCESSING" /><el-option label="向量化成功" value="SUCCESS" /><el-option label="向量化失败" value="FAILED" />
      </el-select>
      <el-button plain :loading="loading" @click="loadDocs"><el-icon><Refresh /></el-icon>刷新</el-button>
    </div>

    <section class="soft-card">
      <div class="soft-card-body">
        <el-table :data="docs" v-loading="loading" size="large" empty-text="暂无文档">
          <el-table-column label="文档名称" min-width="220" show-overflow-tooltip><template #default="{ row }">{{ documentNameOf(row) }}</template></el-table-column>
          <el-table-column label="知识库" width="180"><template #default="{ row }">{{ kbNameOf(row) }}</template></el-table-column>
          <el-table-column label="上传人" width="120"><template #default="{ row }">{{ (row as any).ownerName || (row as any).username || '-' }}</template></el-table-column>
          <el-table-column label="类型" width="90"><template #default="{ row }">{{ fileTypeOf(row) }}</template></el-table-column>
          <el-table-column label="大小" width="110"><template #default="{ row }">{{ fileSizeOf(row) }}</template></el-table-column>
          <el-table-column label="分块数" width="100"><template #default="{ row }">{{ (row as any).chunkCount || (row as any).segmentCount || 0 }}</template></el-table-column>
          <el-table-column label="解析状态" width="120"><template #default="{ row }"><el-tag :type="statusTagType(row.parseStatus)">{{ parseStatusText(row.parseStatus) }}</el-tag></template></el-table-column>
          <el-table-column label="向量状态" width="130"><template #default="{ row }"><el-tag :type="statusTagType(row.embeddingStatus)" effect="plain">{{ embeddingStatusText(row.embeddingStatus) }}</el-tag></template></el-table-column>
          <el-table-column label="失败原因" min-width="180" show-overflow-tooltip><template #default="{ row }">{{ documentErrorOf(row) || '-' }}</template></el-table-column>
          <el-table-column label="更新时间" width="170"><template #default="{ row }">{{ timeOf(row) }}</template></el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="$router.push(`/app/documents/${row.id}`)">详情</el-button>
              <el-button link type="primary" @click="rename(row)">重命名</el-button>
              <el-button v-if="String(row.parseStatus).toUpperCase() === 'FAILED'" link type="warning" @click="retry(row)">重试</el-button>
              <el-button link type="danger" @click="removeDoc(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-row">
          <el-pagination v-model:current-page="pager.pageNo" v-model:page-size="pager.pageSize" layout="total, sizes, prev, pager, next" :page-sizes="[10, 20, 50]" :total="pager.total" @size-change="pager.pageNo = 1; loadDocs()" @current-change="loadDocs" />
        </div>
      </div>
    </section>

    <el-dialog v-model="uploadDialog" title="上传文档" width="580px" @closed="resetUpload">
      <el-form label-position="top">
        <el-form-item label="目标知识库">
          <el-select v-model="selectedKb" placeholder="请选择知识库" style="width: 100%">
            <el-option v-for="kb in knowledgeBases" :key="kb.id" :label="kb.name" :value="kb.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择文件">
          <el-upload ref="uploadRef" action="#" :auto-upload="false" drag style="width: 100%" :limit="1" :on-change="onFileChange">
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">点击或拖拽文件上传</div>
            <template #tip><div class="el-upload__tip">支持 PDF / DOCX / TXT / MD，最大 20MB</div></template>
          </el-upload>
        </el-form-item>
        <el-progress v-if="uploading || uploadProgress > 0" :percentage="uploadProgress" />
        <el-alert v-if="uploadError" class="state-alert" type="error" show-icon :closable="false" :title="uploadError" />
      </el-form>
      <template #footer>
        <el-button @click="uploadDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!hasKnowledgeBases" :loading="uploading" @click="submitUpload">创建处理任务</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.state-alert { margin-bottom: 16px; }
.pagination-row { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
