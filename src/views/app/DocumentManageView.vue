<script setup lang="ts">
import { computed, ref } from 'vue'
import { documents, knowledgeBases } from '@/mock/data'

const keyword = ref('')
const uploadDialog = ref(false)

const filteredDocs = computed(() =>
  documents.filter((doc) => doc.name.includes(keyword.value) || doc.knowledgeBaseName.includes(keyword.value))
)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">文档管理</h1>
        <div class="page-desc">上传 PDF、DOCX、TXT、MD 文档，查看解析和向量化状态。</div>
      </div>
      <el-button type="primary" @click="uploadDialog = true">
        <el-icon><Upload /></el-icon>
        上传文档
      </el-button>
    </div>

    <section class="upload-strip soft-card">
      <div class="soft-card-body upload-inner">
        <div>
          <span class="subtle-badge">异步处理</span>
          <h2>上传接口只保存文件和任务，解析、切片、向量化交给后台执行。</h2>
          <p>页面重点展示处理状态、失败原因和重试入口，避免长时间阻塞用户操作。</p>
        </div>
        <el-upload drag action="#" :auto-upload="false" class="upload-box">
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">拖拽文件到这里，或点击选择</div>
          <template #tip>
            <div class="el-upload__tip">支持 PDF / DOCX / TXT / MD，MVP 建议单文件 20MB 内</div>
          </template>
        </el-upload>
      </div>
    </section>

    <div class="toolbar">
      <el-input v-model="keyword" clearable placeholder="搜索文档或知识库" style="max-width: 360px">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select model-value="" placeholder="解析状态" clearable style="width: 150px">
        <el-option label="解析成功" value="SUCCESS" />
        <el-option label="解析中" value="PARSING" />
        <el-option label="解析失败" value="FAILED" />
      </el-select>
    </div>

    <section class="soft-card">
      <div class="soft-card-body">
        <el-table :data="filteredDocs" size="large">
          <el-table-column prop="name" label="文档名称" min-width="240" show-overflow-tooltip />
          <el-table-column prop="knowledgeBaseName" label="知识库" width="180" />
          <el-table-column prop="type" label="类型" width="90" />
          <el-table-column prop="size" label="大小" width="110" />
          <el-table-column label="解析状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.parseStatus === 'SUCCESS' ? 'success' : row.parseStatus === 'FAILED' ? 'danger' : 'warning'">
                {{ row.parseStatus }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="向量状态" width="130">
            <template #default="{ row }">
              <el-tag :type="row.embeddingStatus === 'SUCCESS' ? 'success' : row.embeddingStatus === 'FAILED' ? 'danger' : 'warning'" effect="plain">
                {{ row.embeddingStatus }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" width="170" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="$router.push(`/app/documents/${row.id}`)">详情</el-button>
              <el-button v-if="row.parseStatus === 'FAILED'" link type="warning">重试</el-button>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>

    <el-dialog v-model="uploadDialog" title="上传文档" width="560px">
      <el-form label-position="top">
        <el-form-item label="目标知识库">
          <el-select placeholder="请选择知识库" style="width: 100%">
            <el-option v-for="kb in knowledgeBases" :key="kb.id" :label="kb.name" :value="kb.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择文件">
          <el-upload action="#" :auto-upload="false" drag style="width: 100%">
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">点击或拖拽文件上传</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialog = false">取消</el-button>
        <el-button type="primary" @click="uploadDialog = false">创建处理任务</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.upload-strip {
  margin-bottom: 16px;
}

.upload-inner {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  align-items: center;
}

.upload-inner h2 {
  margin: 14px 0 8px;
  font-size: 24px;
}

.upload-inner p {
  color: var(--color-text-muted);
}

@media (max-width: 960px) {
  .upload-inner {
    grid-template-columns: 1fr;
  }
}
</style>
