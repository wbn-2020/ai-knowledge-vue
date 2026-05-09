<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createModelConfig, deleteModelConfig, getModelConfigs, testModelConfig, updateModelConfig } from '@/api/knowledge'
import { textOf } from '@/utils/view-adapters'

type ModelType = 'LLM' | 'EMBEDDING'

const models = ref<any[]>([])
const drawerVisible = ref(false)
const editingId = ref<number | null>(null)
const testResult = ref('')
const loading = ref(false)
const saving = ref(false)
const testing = ref(false)

const form = reactive({
  name: '',
  provider: 'OpenAI Compatible',
  modelName: '',
  endpoint: '',
  apiKey: '',
  modelType: 'LLM' as ModelType,
  enabled: true,
  temperature: 0.3,
})

const modelTypeOptions = [
  { label: '大语言模型', value: 'LLM' },
  { label: 'Embedding 模型', value: 'EMBEDDING' },
]

const drawerTitle = computed(() => (editingId.value ? '编辑模型配置' : '新增模型配置'))

function modelNameOf(row: any) {
  return textOf(row?.modelName || row?.model)
}

function modelTypeOf(row: any): ModelType {
  const raw = String(row?.modelType || row?.type || row?.scene || '').toUpperCase()
  return raw.includes('EMBED') ? 'EMBEDDING' : 'LLM'
}

function maskedApiKey(row: any) {
  const value = row?.apiKeyMasked || row?.maskedApiKey || row?.apiKey || row?.key
  if (!value) return '-'
  const text = String(value)
  if (text.includes('*')) return text
  if (text.length <= 8) return '****'
  return `${text.slice(0, 4)}****${text.slice(-4)}`
}

function payload() {
  return {
    name: form.name.trim(),
    provider: form.provider.trim(),
    modelName: form.modelName.trim(),
    model: form.modelName.trim(),
    endpoint: form.endpoint.trim(),
    apiKey: form.apiKey.trim() || undefined,
    modelType: form.modelType,
    enabled: form.enabled,
    temperature: form.modelType === 'LLM' ? form.temperature : undefined,
  }
}

async function loadModels() {
  loading.value = true
  try {
    const data: any = await getModelConfigs()
    models.value = Array.isArray(data) ? data : data?.list || []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  testResult.value = ''
  Object.assign(form, {
    name: '',
    provider: 'OpenAI Compatible',
    modelName: '',
    endpoint: '',
    apiKey: '',
    modelType: 'LLM',
    enabled: true,
    temperature: 0.3,
  })
  drawerVisible.value = true
}

function openEdit(row: any) {
  editingId.value = row.id
  testResult.value = ''
  Object.assign(form, {
    name: row?.name || '',
    provider: row?.provider || 'OpenAI Compatible',
    modelName: row?.modelName || row?.model || '',
    endpoint: row?.endpoint || '',
    apiKey: '',
    modelType: modelTypeOf(row),
    enabled: row?.enabled !== false,
    temperature: row?.temperature ?? 0.3,
  })
  drawerVisible.value = true
}

async function save() {
  if (!form.name.trim() || !form.provider.trim() || !form.modelName.trim() || !form.endpoint.trim()) {
    ElMessage.warning('请填写配置名称、供应商、模型名称和接口地址')
    return
  }
  if (!editingId.value && !form.apiKey.trim()) {
    ElMessage.warning('新增配置时请输入 API Key')
    return
  }
  saving.value = true
  try {
    if (editingId.value) await updateModelConfig(editingId.value, payload())
    else await createModelConfig(payload())
    drawerVisible.value = false
    ElMessage.success('模型配置已保存')
    await loadModels()
  } finally {
    saving.value = false
  }
}

async function testModel(id?: number) {
  const targetId = id || editingId.value
  if (!targetId) {
    testResult.value = '请先保存配置后再测试连接'
    return
  }
  testing.value = true
  try {
    const prompt = form.modelType === 'EMBEDDING' ? 'KnowFlow AI embedding test' : '请用一句话介绍 KnowFlow AI'
    const data: any = await testModelConfig(targetId, prompt)
    testResult.value = typeof data === 'string' ? data : data?.result || data?.message || '测试连接完成'
    ElMessage.success('测试连接完成')
  } finally {
    testing.value = false
  }
}

async function remove(row: any) {
  await ElMessageBox.confirm(`确认删除模型配置「${textOf(row?.name)}」吗？`, '删除确认', { type: 'warning' })
  await deleteModelConfig(row.id)
  ElMessage.success('模型配置已删除')
  await loadModels()
}

onMounted(loadModels)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">AI 模型配置</h1>
        <div class="page-desc">区分大语言模型和 Embedding 模型，API Key 仅脱敏展示。</div>
      </div>
      <el-button type="primary" @click="openCreate">新增配置</el-button>
    </div>

    <section class="soft-card">
      <div class="soft-card-body">
        <el-table :data="models" v-loading="loading" size="large" empty-text="暂无模型配置">
          <el-table-column label="配置名称" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ textOf(row?.name) }}</template>
          </el-table-column>
          <el-table-column label="模型类型" width="130">
            <template #default="{ row }">
              <el-tag :type="modelTypeOf(row) === 'LLM' ? 'success' : 'warning'" effect="plain">
                {{ modelTypeOf(row) === 'LLM' ? '大语言模型' : 'Embedding' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="供应商" width="170" show-overflow-tooltip>
            <template #default="{ row }">{{ textOf(row?.provider) }}</template>
          </el-table-column>
          <el-table-column label="模型名称" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">{{ modelNameOf(row) }}</template>
          </el-table-column>
          <el-table-column label="接口地址" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">{{ textOf(row?.endpoint) }}</template>
          </el-table-column>
          <el-table-column label="API Key" width="150">
            <template #default="{ row }">{{ maskedApiKey(row) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }"><el-tag :type="row?.enabled ? 'success' : 'info'">{{ row?.enabled ? '启用' : '停用' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="230" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link @click="testModel(row.id)">测试连接</el-button>
              <el-button link type="danger" @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>

    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="560px">
      <el-form label-position="top">
        <el-form-item label="配置名称"><el-input v-model="form.name" placeholder="例如：主问答模型" /></el-form-item>
        <el-form-item label="模型类型"><el-segmented v-model="form.modelType" :options="modelTypeOptions" /></el-form-item>
        <el-form-item label="供应商"><el-input v-model="form.provider" placeholder="OpenAI Compatible / DashScope / Azure OpenAI" /></el-form-item>
        <el-form-item label="模型名称"><el-input v-model="form.modelName" placeholder="例如：gpt-4o-mini / text-embedding-3-small" /></el-form-item>
        <el-form-item label="接口地址"><el-input v-model="form.endpoint" placeholder="https://api.example.com/v1" /></el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="form.apiKey" type="password" show-password :placeholder="editingId ? '留空表示不修改 API Key' : '请输入 API Key'" />
        </el-form-item>
        <el-form-item v-if="form.modelType === 'LLM'" label="Temperature"><el-slider v-model="form.temperature" :min="0" :max="1" :step="0.1" /></el-form-item>
        <el-form-item label="启用状态"><el-switch v-model="form.enabled" /></el-form-item>
        <el-button plain :loading="testing" @click="testModel()">测试连接</el-button>
        <div v-if="testResult" class="test-result">{{ testResult }}</div>
      </el-form>
      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.test-result {
  margin-top: 12px;
  padding: 12px;
  border-radius: 12px;
  background: var(--color-surface-soft);
  color: var(--color-text-muted);
  white-space: pre-wrap;
}
</style>
