<script setup lang="ts">
import { reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const form = reactive({
  nickname: authStore.user?.nickname || '',
  email: authStore.user?.email || '',
  defaultKb: '技术学习资料库',
  answerStyle: '简洁准确',
})
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">用户设置</h1>
        <div class="page-desc">管理基础资料和 AI 问答偏好，第一版不做复杂模型偏好。</div>
      </div>
    </div>

    <div class="settings-grid">
      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">基础资料</h3>
          <el-form label-position="top">
            <el-form-item label="昵称"><el-input v-model="form.nickname" /></el-form-item>
            <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
            <el-form-item label="个人简介"><el-input type="textarea" :rows="4" placeholder="写一句个人说明" /></el-form-item>
            <el-button type="primary">保存资料</el-button>
          </el-form>
        </div>
      </section>

      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">AI 偏好</h3>
          <el-form label-position="top">
            <el-form-item label="默认知识库">
              <el-select v-model="form.defaultKb" style="width: 100%">
                <el-option label="技术学习资料库" value="技术学习资料库" />
                <el-option label="项目资料中心" value="项目资料中心" />
              </el-select>
            </el-form-item>
            <el-form-item label="回答风格">
              <el-segmented v-model="form.answerStyle" :options="['简洁准确', '详细解释', '学习笔记']" />
            </el-form-item>
            <el-alert type="info" show-icon :closable="false" title="模型选择和温度参数属于扩展功能，MVP 暂不开放。" />
          </el-form>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 900px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
