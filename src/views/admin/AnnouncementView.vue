<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface Announcement {
  id: number
  title: string
  content: string
  status: '草稿' | '已发布' | '已下线'
  creator: string
  createdAt: string
}

const announcements = ref<Announcement[]>([
  { id: 1, title: 'MVP 功能已开放', content: '知识库、文档管理和智能问答已开放体验。', status: '已发布', creator: 'admin', createdAt: '2026-05-08 09:20' },
  { id: 2, title: '系统维护通知', content: '系统将在周末进行例行维护。', status: '草稿', creator: 'admin', createdAt: '2026-05-07 16:30' },
])

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({
  title: '',
  content: '',
  status: '草稿' as Announcement['status'],
})

function openCreate() {
  editingId.value = null
  Object.assign(form, { title: '', content: '', status: '草稿' })
  dialogVisible.value = true
}

function openEdit(row: Announcement) {
  editingId.value = row.id
  Object.assign(form, row)
  dialogVisible.value = true
}

function save() {
  if (!form.title.trim()) {
    ElMessage.warning('请输入公告标题')
    return
  }
  if (editingId.value) {
    const target = announcements.value.find((item) => item.id === editingId.value)
    if (target) Object.assign(target, form)
    ElMessage.success('公告已更新')
  } else {
    announcements.value.unshift({ id: Date.now(), creator: 'admin', createdAt: '刚刚', ...form })
    ElMessage.success('公告已创建')
  }
  dialogVisible.value = false
}

function toggleStatus(row: Announcement) {
  row.status = row.status === '已发布' ? '已下线' : '已发布'
  ElMessage.success(`公告已${row.status}`)
}

async function remove(row: Announcement) {
  await ElMessageBox.confirm(`确定删除「${row.title}」？`, '删除公告', { type: 'warning' })
  announcements.value = announcements.value.filter((item) => item.id !== row.id)
  ElMessage.success('公告已删除')
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">公告管理</h1>
        <div class="page-desc">查看、创建、编辑、发布、下线和删除系统公告。</div>
      </div>
      <el-button type="primary" @click="openCreate">新增公告</el-button>
    </div>

    <section class="soft-card">
      <div class="soft-card-body">
        <el-table :data="announcements" size="large">
          <el-table-column prop="title" label="标题" min-width="240" />
          <el-table-column prop="status" label="状态" width="120" />
          <el-table-column prop="creator" label="创建人" width="120" />
          <el-table-column prop="createdAt" label="发布时间" width="170" />
          <el-table-column label="操作" width="240">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="warning" @click="toggleStatus(row)">发布 / 下线</el-button>
              <el-button link type="danger" @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑公告' : '新增公告'" width="560px">
      <el-form label-position="top">
        <el-form-item label="公告标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="公告内容"><el-input v-model="form.content" type="textarea" :rows="5" /></el-form-item>
        <el-form-item label="公告状态">
          <el-radio-group v-model="form.status">
            <el-radio-button value="草稿">草稿</el-radio-button>
            <el-radio-button value="已发布">已发布</el-radio-button>
            <el-radio-button value="已下线">已下线</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
