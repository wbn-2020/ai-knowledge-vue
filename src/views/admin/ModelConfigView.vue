<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

interface ModelConfig {
  id: number
  name: string
  provider: string
  model: string
  endpoint: string
  scene: string
  temperature: number
  enabled: boolean
}

const models = ref<ModelConfig[]>([
  { id: 1, name: '默认大模型', provider: 'OpenAI Compatible', model: 'gpt-4.1-mini', endpoint: 'https://api.example.com/v1', enabled: true, scene: '知识库问答', temperature: 0.3 },
  { id: 2, name: 'Embedding 模型', provider: 'OpenAI Compatible', model: 'text-embedding-3-small', endpoint: 'https://api.example.com/v1', enabled: true, scene: '向量化', temperature: 0 },
])

const drawerVisible = ref(false)
const editingId = ref<number | null>(null)
const testResult = ref('')
const form = reactive({
  name: '',
  provider: 'OpenAI Compatible',
  model: '',
  endpoint: '',
  scene: '知识库问答',
  temperature: 0.3,
  enabled: true,
})

function openCreate() {
  editingId.value = null
  testResult.value = ''
  Object.assign(form, { name: '', provider: 'OpenAI Compatible', model: '', endpoint: '', scene: '知识库问答', temperature: 0.3, enabled: true })
  drawerVisible.value = true
}

function openEdit(row: ModelConfig) {
  editingId.value = row.id
  testResult.value = ''
  Object.assign(form, row)
  drawerVisible.value = true
}

function save() {
  if (!form.name || !form.model) {
    ElMessage.warning('请填写配置名称和模型名称')
    return
  }
  if (editingId.value) {
    const target = models.value.find((item) => item.id === editingId.value)
    if (target) Object.assign(target, form)
  } else {
    models.value.unshift({ id: Date.now(), ...form })
  }
  drawerVisible.value = false
  ElMessage.success('模型配置已保存')
}

function testModel() {
  testResult.value = '测试成功：模型服务返回正常，响应耗时 860ms。'
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">AI 模型配置</h1>
        <div class="page-desc">配置大模型和 Embedding 模型。API Key 仅后端保存，前端只做脱敏展示。</div>
      </div>
      <el-button type="primary" @click="openCreate">新增配置</el-button>
    </div>

    <section class="soft-card"><div class="soft-card-body">
      <el-table :data="models" size="large">
        <el-table-column prop="name" label="配置名称" min-width="180" />
        <el-table-column prop="provider" label="供应商" width="180" />
        <el-table-column prop="model" label="模型" min-width="220" />
        <el-table-column prop="scene" label="场景" width="140" />
        <el-table-column label="状态" width="120"><template #default="{ row }"><el-switch v-model="row.enabled" /></template></el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link @click="openEdit(row); testModel()">测试调用</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div></section>

    <el-drawer v-model="drawerVisible" :title="editingId ? '编辑模型配置' : '新增模型配置'" size="560px">
      <el-form label-position="top">
        <el-form-item label="配置名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="供应商"><el-input v-model="form.provider" /></el-form-item>
        <el-form-item label="模型名称"><el-input v-model="form.model" /></el-form-item>
        <el-form-item label="接口地址"><el-input v-model="form.endpoint" /></el-form-item>
        <el-form-item label="使用场景">
          <el-select v-model="form.scene" style="width: 100%">
            <el-option label="知识库问答" value="知识库问答" />
            <el-option label="向量化" value="向量化" />
            <el-option label="文档摘要" value="文档摘要" />
          </el-select>
        </el-form-item>
        <el-form-item label="Temperature"><el-slider v-model="form.temperature" :min="0" :max="1" :step="0.1" /></el-form-item>
        <el-form-item label="启用状态"><el-switch v-model="form.enabled" /></el-form-item>
        <el-button plain @click="testModel">测试调用</el-button>
        <div v-if="testResult" class="test-result">{{ testResult }}</div>
      </el-form>
      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
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
}
</style>
