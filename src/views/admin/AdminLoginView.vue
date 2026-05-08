<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)

const form = reactive({
  username: 'admin',
  password: '123456',
})

async function submit() {
  loading.value = true
  try {
    await authStore.login({ username: form.username, password: form.password })
    authStore.user && (authStore.user.role = 'ADMIN')
    router.push('/admin/dashboard')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="admin-login">
    <section class="login-card soft-card">
      <div class="soft-card-body">
        <div class="subtle-badge">后台入口</div>
        <h1>KnowFlow Admin</h1>
        <p>管理员登录后进入平台数据看板、用户管理与系统配置。</p>

        <el-form label-position="top" class="form">
          <el-form-item label="管理员账号">
            <el-input v-model="form.username" placeholder="请输入管理员账号" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
          </el-form-item>
          <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="submit">进入后台</el-button>
        </el-form>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.admin-login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(15, 23, 42, 0.08), transparent 28%),
    radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.12), transparent 30%),
    var(--color-bg);
}

.login-card {
  width: min(460px, 100%);
}

h1 {
  margin: 14px 0 10px;
  font-size: 32px;
}

p {
  color: var(--color-text-muted);
  line-height: 1.7;
}

.form {
  margin-top: 18px;
}

.submit-btn {
  width: 100%;
  height: 46px;
}
</style>
