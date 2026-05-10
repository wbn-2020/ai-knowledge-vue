<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createPromptConfig,
  deletePromptConfig,
  getPromptConfigs,
  setPromptEnabled,
  updatePromptConfig,
  type PromptConfig,
} from '@/api/knowledge'
import { textOf, timeOf } from '@/utils/view-adapters'

const prompts = ref<PromptConfig[]>([])
const drawerVisible = ref(false)
const editingId = ref<number | null>(null)
const loading = ref(false)
const saving = ref(false)
const togglingId = ref<number | null>(null)
const deletingId = ref<number | null>(null)
const form = reactive<PromptConfig>({ name: '', type: 'QA', content: '', enabled: true })
const typeOptions = ref<string[]>(['QA', 'SUMMARY', 'KEYWORD', 'TITLE', 'RAG', 'RAG_QA'])
const drawerTitle = computed(() => (editingId.value ? '编辑 Prompt' : '新增 Prompt'))

function normalizeTypeValue(value: unknown) {
  const type = String(value || '').trim().toUpperCase()
  if (!type) return 'QA'
  if (type === 'RAG-QA') return 'RAG_QA'
  return type
}

function mergeTypeOptions(values: unknown[]) {
  const merged = Array.from(new Set([...typeOptions.value, ...values.map(normalizeTypeValue).filter(Boolean)]))
  typeOptions.value = merged
}

function normalizePrompt(row: any): PromptConfig {
  return {
    id: row?.id,
    name: String(row?.name || ''),
    type: normalizeTypeValue(row?.type || 'QA'),
    content: String(row?.content || ''),
    enabled: row?.enabled !== false,
    createdAt: row?.createdAt || row?.createTime,
    updatedAt: row?.updatedAt || row?.updateTime,
  }
}

function contentPreview(content: string) {
  if (!content) return '-'
  return content.length > 80 ? `${content.slice(0, 80)}...` : content
}

async function loadPrompts() {
  loading.value = true
  try {
    const data: any = await getPromptConfigs()
    const list = Array.isArray(data) ? data : data?.list || []
    mergeTypeOptions(list.map((item: any) => item?.type))
    prompts.value = list.map(normalizePrompt)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'Prompt 列表加载失败')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  Object.assign(form, { name: '', type: 'QA', content: '', enabled: true })
  drawerVisible.value = true
}

function openEdit(row: PromptConfig) {
  editingId.value = row?.id || null
  Object.assign(form, {
    name: row?.name || '',
    type: normalizeTypeValue(row?.type || 'QA'),
    content: row?.content || '',
    enabled: row?.enabled !== false,
  })
  drawerVisible.value = true
}

async function submitPrompt(payload: PromptConfig) {
  if (editingId.value) return updatePromptConfig(editingId.value, payload)
  return createPromptConfig(payload)
}

async function save() {
  if (!form.name.trim() || !form.type.trim() || !form.content.trim()) {
    ElMessage.warning('请填写名称、类型和内容')
    return
  }
  saving.value = true
  try {
    const normalizedType = normalizeTypeValue(form.type)
    const payload: PromptConfig = {
      name: form.name.trim(),
      type: normalizedType,
      content: form.content.trim(),
      enabled: form.enabled,
    }

    try {
      await submitPrompt(payload)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Prompt 保存失败'
      // Backward-compatible fallback for environments requiring RAG_QA / QA.
      if (message.includes('invalid prompt type') && normalizedType === 'RAG') {
        let saved = false
        for (const fallbackType of ['RAG_QA', 'QA']) {
          try {
            await submitPrompt({ ...payload, type: fallbackType })
            form.type = fallbackType
            saved = true
            break
          } catch {
            // continue
          }
        }
        if (!saved) throw error
      } else {
        throw error
      }
    }

    drawerVisible.value = false
    ElMessage.success('Prompt 已保存')
    await loadPrompts()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'Prompt 保存失败')
  } finally {
    saving.value = false
  }
}

async function toggle(row: PromptConfig) {
  if (!row?.id) return
  togglingId.value = row.id
  try {
    await setPromptEnabled(row.id, !row.enabled)
    ElMessage.success('启用状态已更新')
    await loadPrompts()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '启用状态更新失败')
  } finally {
    togglingId.value = null
  }
}

async function remove(row: PromptConfig) {
  if (!row?.id) return
  await ElMessageBox.confirm(`确定删除「${textOf(row?.name)}」吗？`, '删除确认', { type: 'warning' })
  deletingId.value = row.id
  try {
    await deletePromptConfig(row.id)
    ElMessage.success('Prompt 已删除')
    await loadPrompts()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'Prompt 删除失败')
  } finally {
    deletingId.value = null
  }
}

onMounted(loadPrompts)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Prompt 模板</h1>
        <div class="page-desc">管理问答和摘要场景 Prompt 模板。</div>
      </div>
      <el-button type="primary" @click="openCreate">新增模板</el-button>
    </div>

    <section class="soft-card">
      <div class="soft-card-body">
        <el-table :data="prompts" v-loading="loading" size="large" empty-text="暂无 Prompt 模板">
          <el-table-column label="名称" min-width="180"><template #default="{ row }">{{ textOf(row?.name) }}</template></el-table-column>
          <el-table-column label="类型" width="140"><template #default="{ row }">{{ textOf(row?.type) }}</template></el-table-column>
          <el-table-column label="内容摘要" min-width="320" show-overflow-tooltip><template #default="{ row }">{{ contentPreview(row?.content || '') }}</template></el-table-column>
          <el-table-column label="启用" width="110">
            <template #default="{ row }">
              <el-switch :model-value="row?.enabled" :loading="togglingId === row?.id" @change="toggle(row)" />
            </template>
          </el-table-column>
          <el-table-column label="更新时间" width="180"><template #default="{ row }">{{ timeOf(row) }}</template></el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" :loading="deletingId === row?.id" @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>

    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="560px">
      <el-form label-position="top">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option v-for="item in typeOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容"><el-input v-model="form.content" type="textarea" :rows="9" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="form.enabled" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-drawer>
  </div>
</template>
