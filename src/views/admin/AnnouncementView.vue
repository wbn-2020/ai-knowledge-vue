<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  getAdminAnnouncements,
  updateAdminAnnouncement,
} from '@/api/knowledge'
import type { AdminAnnouncement } from '@/types'

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const announcements = ref<AdminAnnouncement[]>([])
const pager = reactive({ pageNo: 1, pageSize: 10, total: 0 })
const form = reactive({
  title: '',
  content: '',
  enabled: true,
})

const rules: FormRules = {
  title: [
    { required: true, message: '请输入公告标题', trigger: 'blur' },
    { min: 2, max: 80, message: '标题长度应为 2-80 个字符', trigger: 'blur' },
  ],
  content: [
    { required: true, message: '请输入公告内容', trigger: 'blur' },
    { min: 4, max: 2000, message: '内容长度应为 4-2000 个字符', trigger: 'blur' },
  ],
}

function timeOf(row: AdminAnnouncement) {
  return row.updateTime || row.updatedAt || row.createTime || row.createdAt || '-'
}

async function loadAnnouncements() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await getAdminAnnouncements({ pageNo: pager.pageNo, pageSize: pager.pageSize })
    announcements.value = data.list || []
    pager.total = data.total || 0
    pager.pageNo = data.pageNo || pager.pageNo
    pager.pageSize = data.pageSize || pager.pageSize
  } catch (error) {
    announcements.value = []
    pager.total = 0
    errorMessage.value = error instanceof Error ? error.message : '公告加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, { title: '', content: '', enabled: true })
  formRef.value?.clearValidate()
}

function openCreate() {
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

function openEdit(row: AdminAnnouncement) {
  editingId.value = row.id
  Object.assign(form, {
    title: row.title || '',
    content: row.content || '',
    enabled: row.enabled !== false,
  })
  dialogVisible.value = true
}

async function save() {
  await formRef.value?.validate()
  saving.value = true
  try {
    const payload = { title: form.title.trim(), content: form.content.trim(), enabled: form.enabled }
    if (editingId.value) {
      await updateAdminAnnouncement(editingId.value, payload)
      ElMessage.success('公告已更新')
    } else {
      await createAdminAnnouncement(payload)
      ElMessage.success('公告已创建')
      pager.pageNo = 1
    }
    dialogVisible.value = false
    loadAnnouncements()
  } finally {
    saving.value = false
  }
}

async function toggleEnabled(row: AdminAnnouncement) {
  const nextEnabled = row.enabled === false
  await updateAdminAnnouncement(row.id, {
    title: row.title,
    content: row.content,
    enabled: nextEnabled,
  })
  ElMessage.success(nextEnabled ? '公告已启用' : '公告已停用')
  loadAnnouncements()
}

async function remove(row: AdminAnnouncement) {
  await ElMessageBox.confirm(`确认删除公告「${row.title}」吗？`, '删除确认', { type: 'warning' })
  await deleteAdminAnnouncement(row.id)
  ElMessage.success('公告已删除')
  if (announcements.value.length === 1 && pager.pageNo > 1) pager.pageNo -= 1
  loadAnnouncements()
}

onMounted(loadAnnouncements)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">公告管理</h1>
        <div class="page-desc">发布系统公告，控制公告启停，并维护面向用户的通知内容。</div>
      </div>
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon>
        新增公告
      </el-button>
    </div>

    <el-alert v-if="errorMessage" class="state-alert" type="error" show-icon :closable="false" :title="errorMessage" />

    <section class="soft-card">
      <div class="soft-card-body">
        <el-table :data="announcements" v-loading="loading" size="large" empty-text="暂无公告">
          <el-table-column prop="title" label="标题" min-width="240" show-overflow-tooltip />
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="row.enabled === false ? 'info' : 'success'" effect="plain">
                {{ row.enabled === false ? '停用' : '启用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建人" width="130">
            <template #default="{ row }">{{ row.creator || '-' }}</template>
          </el-table-column>
          <el-table-column label="更新时间" width="180">
            <template #default="{ row }">{{ timeOf(row) }}</template>
          </el-table-column>
          <el-table-column prop="content" label="内容摘要" min-width="260" show-overflow-tooltip />
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="warning" @click="toggleEnabled(row)">{{ row.enabled === false ? '启用' : '停用' }}</el-button>
              <el-button link type="danger" @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-row">
          <el-pagination
            v-model:current-page="pager.pageNo"
            v-model:page-size="pager.pageSize"
            layout="total, sizes, prev, pager, next"
            :page-sizes="[10, 20, 50]"
            :total="pager.total"
            @size-change="pager.pageNo = 1; loadAnnouncements()"
            @current-change="loadAnnouncements"
          />
        </div>
      </div>
    </section>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑公告' : '新增公告'" width="600px" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="公告标题" prop="title">
          <el-input v-model="form.title" maxlength="80" show-word-limit placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="公告内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="7" maxlength="2000" show-word-limit placeholder="请输入公告内容" />
        </el-form-item>
        <el-form-item label="公告状态">
          <el-switch v-model="form.enabled" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.state-alert {
  margin-bottom: 16px;
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
