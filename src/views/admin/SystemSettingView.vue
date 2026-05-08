<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getSystemConfigs, saveSystemConfig } from '@/api/knowledge'

const loading = ref(false)
const saving = ref(false)
const config = reactive({
  maxFileSize: 20,
  allowedTypes: ['PDF', 'DOCX', 'TXT', 'MD'],
  chunkSize: 1000,
  chunkOverlap: 150,
  topK: 5,
  threshold: 0.72,
})

async function loadConfig() {
  loading.value = true
  try {
    const data: any = await getSystemConfigs()
    Object.assign(config, data || {})
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await saveSystemConfig(config)
    ElMessage.success('系统参数已保存')
  } finally {
    saving.value = false
  }
}

onMounted(loadConfig)
</script>

<template>
  <div v-loading="loading">
    <div class="page-header"><div><h1 class="page-title">系统参数</h1><div class="page-desc">配置上传、解析、切片和检索参数。</div></div></div>
    <section class="soft-card"><div class="soft-card-body">
      <el-form label-position="top" class="config-form">
        <el-form-item label="单文件大小上限（MB）"><el-input-number v-model="config.maxFileSize" :min="1" :max="200" /></el-form-item>
        <el-form-item label="允许上传类型"><el-checkbox-group v-model="config.allowedTypes"><el-checkbox label="PDF" /><el-checkbox label="DOCX" /><el-checkbox label="TXT" /><el-checkbox label="MD" /></el-checkbox-group></el-form-item>
        <el-form-item label="文本切片长度"><el-input-number v-model="config.chunkSize" :min="200" :max="3000" /></el-form-item>
        <el-form-item label="切片重叠长度"><el-input-number v-model="config.chunkOverlap" :min="0" :max="800" /></el-form-item>
        <el-form-item label="召回 TopK"><el-input-number v-model="config.topK" :min="1" :max="20" /></el-form-item>
        <el-form-item label="最低相似度阈值"><el-input-number v-model="config.threshold" :min="0" :max="1" :step="0.01" /></el-form-item>
        <el-button type="primary" :loading="saving" @click="save">保存配置</el-button>
      </el-form>
    </div></section>
  </div>
</template>

<style scoped>.config-form { max-width: 720px; }</style>
