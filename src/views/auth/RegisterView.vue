<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)

const form = reactive({
  username: '',
  nickname: '',
  email: '',
  password: '',
  confirmPassword: '',
})

async function submit() {
  if (!form.username || !form.password) {
    ElMessage.warning('请填写用户名和密码')
    return
  }
  if (form.password !== form.confirmPassword) {
    ElMessage.warning('两次密码不一致')
    return
  }
  loading.value = true
  try {
    await authStore.register(form)
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-page">
    <section class="register-card soft-card">
      <div class="soft-card-body">
        <span class="subtle-badge">创建 KnowFlow 账号</span>
        <h1>开始搭建你的个人知识库</h1>
        <p>注册后可创建知识库、上传文档并体验智能问答。</p>

        <el-form label-position="top" class="form">
          <el-form-item label="用户名"><el-input v-model="form.username" placeholder="请输入用户名" /></el-form-item>
          <el-form-item label="昵称"><el-input v-model="form.nickname" placeholder="请输入昵称" /></el-form-item>
          <el-form-item label="邮箱"><el-input v-model="form.email" placeholder="请输入邮箱" /></el-form-item>
          <el-form-item label="密码"><el-input v-model="form.password" type="password" show-password /></el-form-item>
          <el-form-item label="确认密码"><el-input v-model="form.confirmPassword" type="password" show-password /></el-form-item>
          <el-button type="primary" size="large" class="submit" :loading="loading" @click="submit">注册账号</el-button>
          <div class="back-login">
            已有账号？
            <el-button link type="primary" @click="router.push('/login')">去登录</el-button>
          </div>
        </el-form>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.register-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.register-card {
  width: min(560px, 100%);
}

h1 {
  margin: 14px 0 10px;
  font-size: 32px;
}

p {
  color: var(--color-text-muted);
}

.form {
  margin-top: 22px;
}

.submit {
  width: 100%;
}

.back-login {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--color-text-muted);
}
</style>
