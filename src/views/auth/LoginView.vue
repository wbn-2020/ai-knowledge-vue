<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { isAdminUser } from '@/stores/auth'

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
    const result = await authStore.login(form)
    ElMessage.success('登录成功')
    router.push(isAdminUser(result?.user) ? '/admin/dashboard' : '/app/dashboard')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <section class="login-hero">
      <div class="hero-panel">
        <div class="brand-badge">K</div>
        <h1>KnowFlow AI</h1>
        <p>个人知识库与智能文档问答平台。上传、解析、检索、问答一体化呈现。</p>
      </div>
    </section>

    <section class="login-card page-card">
      <div class="card-head">
        <div class="subtle-badge">MVP 版本</div>
        <h2>欢迎回来</h2>
        <p>登录后继续管理知识库与文档。</p>
      </div>

      <el-form label-position="top" class="login-form" @keyup.enter="submit">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>

        <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="submit">
          登录系统
        </el-button>

      </el-form>
    </section>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 24px;
  padding: 24px;
}

.login-hero {
  border-radius: 28px;
  padding: 40px;
  color: #fff;
  background:
    linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(37, 99, 235, 0.88)),
    url('@/assets/hero.png') center/cover no-repeat;
  display: flex;
  align-items: end;
  box-shadow: var(--shadow-card);
}

.hero-panel {
  max-width: 520px;
}

.brand-badge {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(16px);
  font-size: 24px;
  font-weight: 800;
}

h1 {
  margin: 18px 0 12px;
  font-size: 52px;
  line-height: 1.05;
}

.hero-panel p {
  font-size: 16px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.84);
}

.login-card {
  width: min(560px, 100%);
  justify-self: center;
  align-self: center;
  padding: 28px;
}

.card-head h2 {
  margin: 14px 0 8px;
  font-size: 28px;
}

.card-head p {
  color: var(--color-text-muted);
  font-size: 14px;
}

.login-form {
  margin-top: 24px;
}

.submit-btn {
  width: 100%;
  height: 46px;
  margin-top: 6px;
}

@media (max-width: 960px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-hero {
    min-height: 320px;
  }
}
</style>
