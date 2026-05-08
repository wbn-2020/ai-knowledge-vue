<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { knowledgeBases } from '@/mock/data'

const route = useRoute()
const router = useRouter()
const editId = computed(() => Number(route.params.id || 0))
const editing = computed(() => !!editId.value)
const current = computed(() => knowledgeBases.find((item) => item.id === editId.value))

const form = reactive({
  name: current.value?.name || '',
  description: current.value?.description || '',
  icon: current.value?.icon || '📘',
  category: current.value?.category || '技术学习',
  status: current.value?.status || 'NORMAL',
})

function save() {
  if (!form.name.trim()) {
    ElMessage.warning('请输入知识库名称')
    return
  }
  ElMessage.success(editing.value ? '知识库已更新' : '知识库已创建')
  router.push('/app/knowledge')
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ editing ? '编辑知识库' : '创建知识库' }}</h1>
        <div class="page-desc">配置知识库名称、简介、图标、分类和状态。</div>
      </div>
    </div>

    <section class="form-layout">
      <div class="soft-card">
        <div class="soft-card-body">
          <el-form label-position="top">
            <el-form-item label="知识库名称"><el-input v-model="form.name" placeholder="例如：技术学习资料库" /></el-form-item>
            <el-form-item label="知识库简介"><el-input v-model="form.description" type="textarea" :rows="4" /></el-form-item>
            <el-form-item label="图标"><el-input v-model="form.icon" placeholder="输入一个 emoji 或图标标识" /></el-form-item>
            <el-form-item label="分类">
              <el-select v-model="form.category" style="width: 100%">
                <el-option label="技术学习" value="技术学习" />
                <el-option label="项目资料" value="项目资料" />
                <el-option label="产品文档" value="产品文档" />
                <el-option label="论文资料" value="论文资料" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio-button value="NORMAL">正常</el-radio-button>
                <el-radio-button value="PROCESSING">处理中</el-radio-button>
                <el-radio-button value="FAILED">解析失败</el-radio-button>
                <el-radio-button value="DISABLED">已禁用</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <div class="actions">
              <el-button @click="router.back()">取消</el-button>
              <el-button type="primary" @click="save">{{ editing ? '保存修改' : '创建知识库' }}</el-button>
            </div>
          </el-form>
        </div>
      </div>

      <aside class="preview soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">预览</h3>
          <div class="preview-card">
            <div class="icon">{{ form.icon }}</div>
            <h3>{{ form.name || '知识库名称' }}</h3>
            <p>{{ form.description || '这里会展示知识库简介。' }}</p>
            <el-tag effect="plain">{{ form.category }}</el-tag>
          </div>
        </div>
      </aside>
    </section>
  </div>
</template>

<style scoped lang="scss">
.form-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 16px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.preview-card {
  padding: 18px;
  border-radius: 16px;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
}

.icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: var(--color-primary-weak);
  font-size: 24px;
}

.preview-card p {
  color: var(--color-text-muted);
  line-height: 1.7;
}

@media (max-width: 900px) {
  .form-layout {
    grid-template-columns: 1fr;
  }
}
</style>
