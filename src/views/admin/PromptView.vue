<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createPromptConfig, deletePromptConfig, getPromptConfigs, setPromptEnabled, updatePromptConfig } from '@/api/knowledge'
import { textOf, timeOf } from '@/utils/view-adapters'

const prompts = ref<any[]>([])
const drawerVisible = ref(false)
const editingId = ref<number | null>(null)
const loading = ref(false)
const form = reactive({ name: '', type: '问答', content: '', enabled: true })

async function loadPrompts() {
  loading.value = true
  try {
    const data: any = await getPromptConfigs()
    prompts.value = Array.isArray(data) ? data : data?.list || []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  Object.assign(form, { name: '', type: '问答', content: '', enabled: true })
  drawerVisible.value = true
}

function openEdit(row: any) {
  editingId.value = row?.id
  Object.assign(form, {
    name: row?.name || '',
    type: row?.type || '问答',
    content: row?.content || '',
    enabled: row?.enabled !== false,
  })
  drawerVisible.value = true
}

async function save() {
  if (!form.name.trim() || !form.content.trim()) {
    ElMessage.warning('请填写模板名称和内容')
    return
  }
  if (editingId.value) await updatePromptConfig(editingId.value, form)
  else await createPromptConfig(form)
  drawerVisible.value = false
  ElMessage.success('模板已保存')
  loadPrompts()
}

async function toggle(row: any) {
  await setPromptEnabled(row.id, !row.enabled)
  ElMessage.success('启用状态已更新')
  loadPrompts()
}

async function remove(row: any) {
  await ElMessageBox.confirm(`确定删除「${textOf(row?.name)}」？`, '删除模板', { type: 'warning' })
  await deletePromptConfig(row.id)
  ElMessage.success('模板已删除')
  loadPrompts()
}

onMounted(loadPrompts)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Prompt 模板</h1>
        <div class="page-desc">管理问答和摘要场景的 Prompt 模板，支持新增、编辑、删除和启用。</div>
      </div>
      <el-button type="primary" @click="openCreate">新增模板</el-button>
    </div>

    <section class="soft-card">
      <div class="soft-card-body">
        <el-table :data="prompts" v-loading="loading" size="large" empty-text="暂无 Prompt 模板">
          <el-table-column label="模板名称" min-width="240"><template #default="{ row }">{{ textOf(row?.name) }}</template></el-table-column>
          <el-table-column label="类型" width="120"><template #default="{ row }">{{ textOf(row?.type) }}</template></el-table-column>
          <el-table-column label="更新时间" width="170"><template #default="{ row }">{{ timeOf(row) }}</template></el-table-column>
          <el-table-column label="启用" width="100"><template #default="{ row }"><el-switch :model-value="row?.enabled" @change="toggle(row)" /></template></el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>

    <el-drawer v-model="drawerVisible" :title="editingId ? '编辑 Prompt' : '新增 Prompt'" size="560px">
      <el-form label-position="top">
        <el-form-item label="模板名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="模板类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="问答" value="问答" />
            <el-option label="摘要" value="摘要" />
            <el-option label="关键词提取" value="关键词提取" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板内容"><el-input v-model="form.content" type="textarea" :rows="9" /></el-form-item>
        <el-form-item label="启用状态"><el-switch v-model="form.enabled" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-drawer>
  </div>
</template>
