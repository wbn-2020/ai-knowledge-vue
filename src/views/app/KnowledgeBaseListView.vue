<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { knowledgeBases } from '@/mock/data'

const router = useRouter()
const keyword = ref('')
const showDialog = ref(false)
const form = reactive({ name: '', description: '', category: '技术学习', icon: '📘' })

const filteredList = computed(() =>
  knowledgeBases.filter((item) => item.name.includes(keyword.value) || item.description.includes(keyword.value))
)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">知识库管理</h1>
        <div class="page-desc">创建个人知识库，管理文档容器和处理状态。</div>
      </div>
      <el-button type="primary" @click="router.push('/app/knowledge/create')">
        <el-icon><Plus /></el-icon>
        创建知识库
      </el-button>
    </div>

    <div class="toolbar">
      <el-input v-model="keyword" clearable placeholder="搜索知识库名称或简介" style="max-width: 360px">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select model-value="updatedAt" style="width: 180px">
        <el-option label="按更新时间排序" value="updatedAt" />
        <el-option label="按创建时间排序" value="createdAt" />
      </el-select>
    </div>

    <div class="knowledge-grid">
      <article v-for="item in filteredList" :key="item.id" class="knowledge-card" @click="router.push(`/app/knowledge/${item.id}`)">
        <div class="card-top">
          <div class="kb-icon">{{ item.icon }}</div>
          <el-tag :type="item.status === 'NORMAL' ? 'success' : item.status === 'FAILED' ? 'danger' : 'warning'" effect="plain">
            {{ item.status }}
          </el-tag>
        </div>
        <h3>{{ item.name }}</h3>
        <p>{{ item.description }}</p>
        <div class="card-meta">
          <span>{{ item.category }}</span>
          <span>{{ item.docCount }} 个文档</span>
        </div>
        <div class="card-footer">
          <span>更新于 {{ item.updatedAt }}</span>
          <div>
            <el-button link type="primary" @click.stop="router.push(`/app/knowledge/${item.id}`)">详情</el-button>
            <el-button link @click.stop="router.push(`/app/knowledge/${item.id}/edit`)">编辑</el-button>
          </div>
        </div>
      </article>
    </div>

    <el-dialog v-model="showDialog" title="创建知识库" width="520px">
      <el-form label-position="top">
        <el-form-item label="知识库名称"><el-input v-model="form.name" placeholder="例如：技术学习资料库" /></el-form-item>
        <el-form-item label="简介"><el-input v-model="form.description" type="textarea" :rows="3" placeholder="描述这个知识库的内容范围" /></el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" style="width: 100%">
            <el-option label="技术学习" value="技术学习" />
            <el-option label="项目资料" value="项目资料" />
            <el-option label="论文资料" value="论文资料" />
            <el-option label="产品文档" value="产品文档" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="showDialog = false">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.knowledge-card {
  padding: 20px;
  border-radius: var(--radius-card);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.knowledge-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card);
  border-color: rgba(37, 99, 235, 0.28);
}

.card-top,
.card-footer,
.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.kb-icon {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: var(--color-primary-weak);
  font-size: 22px;
}

h3 {
  margin: 18px 0 8px;
  font-size: 18px;
}

p {
  min-height: 48px;
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.card-meta {
  margin-top: 16px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.card-footer {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 13px;
}

@media (max-width: 1100px) {
  .knowledge-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .knowledge-grid {
    grid-template-columns: 1fr;
  }
}
</style>
