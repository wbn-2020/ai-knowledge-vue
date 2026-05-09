<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getSystemConfigs, saveSystemConfig, type SystemConfig } from '@/api/knowledge'

const loading = ref(false)
const saving = ref(false)
const config = reactive<SystemConfig>({
  maxFileSize: 20,
  allowedTypes: ['PDF', 'DOCX', 'TXT', 'MD'],
  chunkSize: 1000,
  chunkOverlap: 150,
  topK: 5,
  similarityThreshold: 0.72,
  platformName: 'KnowFlow AI',
  adminEmail: '',
})

function applyConfig(data: any) {
  Object.assign(config, {
    maxFileSize: Number(data?.maxFileSize ?? config.maxFileSize),
    allowedTypes: Array.isArray(data?.allowedTypes) && data.allowedTypes.length ? data.allowedTypes : config.allowedTypes,
    chunkSize: Number(data?.chunkSize ?? config.chunkSize),
    chunkOverlap: Number(data?.chunkOverlap ?? config.chunkOverlap),
    topK: Number(data?.topK ?? config.topK),
    similarityThreshold: Number(data?.similarityThreshold ?? data?.threshold ?? config.similarityThreshold),
    platformName: String(data?.platformName ?? config.platformName),
    adminEmail: String(data?.adminEmail ?? config.adminEmail),
  })
}

function adaptListToObject(list: any[]) {
  const map: Record<string, any> = {}
  list.forEach((item) => {
    const key = String(item?.key || item?.configKey || item?.name || '').trim()
    if (!key) return
    const value = item?.value ?? item?.configValue
    map[key] = value
  })
  applyConfig({
    maxFileSize: map.maxFileSize,
    allowedTypes: typeof map.allowedTypes === 'string' ? map.allowedTypes.split(',').map((v: string) => v.trim()).filter(Boolean) : map.allowedTypes,
    chunkSize: map.chunkSize,
    chunkOverlap: map.chunkOverlap,
    topK: map.topK,
    similarityThreshold: map.similarityThreshold ?? map.threshold,
    platformName: map.platformName,
    adminEmail: map.adminEmail,
  })
}

async function loadConfig() {
  loading.value = true
  try {
    const data: any = await getSystemConfigs()
    if (Array.isArray(data)) adaptListToObject(data)
    else applyConfig(data || {})
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '系统参数加载失败')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await saveSystemConfig({
      maxFileSize: config.maxFileSize,
      allowedTypes: config.allowedTypes,
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
      topK: config.topK,
      similarityThreshold: config.similarityThreshold,
      platformName: config.platformName.trim(),
      adminEmail: config.adminEmail.trim(),
    })
    ElMessage.success('系统参数已保存')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '系统参数保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadConfig)
</script>

<template>
  <div v-loading="loading">
    <div class="page-header">
      <div>
        <h1 class="page-title">系统参数</h1>
        <div class="page-desc">配置上传、解析、切片和检索参数。</div>
      </div>
    </div>
    <section class="soft-card">
      <div class="soft-card-body">
        <el-form label-position="top" class="config-form">
          <el-form-item label="平台名称"><el-input v-model="config.platformName" placeholder="请输入平台名称" /></el-form-item>
          <el-form-item label="管理员邮箱"><el-input v-model="config.adminEmail" placeholder="请输入管理员邮箱" /></el-form-item>
          <el-form-item label="单文件大小上限（MB）"><el-input-number v-model="config.maxFileSize" :min="1" :max="200" /></el-form-item>
          <el-form-item label="允许上传类型">
            <el-checkbox-group v-model="config.allowedTypes">
              <el-checkbox label="PDF" />
              <el-checkbox label="DOCX" />
              <el-checkbox label="TXT" />
              <el-checkbox label="MD" />
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="文本切片长度"><el-input-number v-model="config.chunkSize" :min="200" :max="3000" /></el-form-item>
          <el-form-item label="切片重叠长度"><el-input-number v-model="config.chunkOverlap" :min="0" :max="800" /></el-form-item>
          <el-form-item label="召回 TopK"><el-input-number v-model="config.topK" :min="1" :max="20" /></el-form-item>
          <el-form-item label="最低相似度阈值"><el-input-number v-model="config.similarityThreshold" :min="0" :max="1" :step="0.01" /></el-form-item>
          <el-button type="primary" :loading="saving" @click="save">保存配置</el-button>
        </el-form>
      </div>
    </section>
  </div>
</template>

<style scoped>
.config-form {
  max-width: 720px;
}
</style>
