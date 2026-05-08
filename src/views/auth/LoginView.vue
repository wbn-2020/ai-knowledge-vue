<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isRegister = ref(false)
const loading = ref(false)

const form = reactive({
  username: 'admin',
  password: '123456',
  confirmPassword: '123456',
  nickname: '',
})

async function submit() {
  loading.value = true
  try {
    if (isRegister.value) {
      if (form.password !== form.confirmPassword) {
        ElMessage.warning('两次密码不一致')
        return
      }
      await authStore.register(form)
      ElMessage.success('注册成功，请登录')
      isRegister.value = false
      return
    }

    await authStore.login(form)
    ElMessage.success('登录成功')
    router.push('/app/dashboard')
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

        <div class="hero-metrics">
          <div>
            <strong>12+</strong>
            <span>知识库</span>
          </div>
          <div>
            <strong>300+</strong>
            <span>问答记录</span>
          </div>
          <div>
            <strong>86</strong>
            <span>文档数量</span>
          </div>
        </div>

        <div class="hero-tags">
          <span>Vue 3</span>
          <span>Element Plus</span>
          <span>Pinia</span>
          <span>RAG</span>
        </div>
      </div>
    </section>

    <section class="login-card page-card">
      <div class="card-head">
        <div class="subtle-badge">MVP 版本</div>
        <h2>{{ isRegister ? '创建账号' : '欢迎回来' }}</h2>
        <p>{{ isRegister ? '注册账号后即可进入知识库工作台。' : '登录后继续管理知识库与文档。' }}</p>
      </div>

      <el-form label-position="top" class="login-form" @keyup.enter="submit">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item v-if="isRegister" label="昵称">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-form-item v-if="isRegister" label="确认密码">
          <el-input v-model="form.confirmPassword" type="password" show-password placeholder="请再次输入密码" />
        </el-form-item>

        <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="submit">
          {{ isRegister ? '注册账号' : '登录系统' }}
        </el-button>

        <div class="switch-row">
          <span>{{ isRegister ? '已有账号？' : '还没有账号？' }}</span>
          <el-button link type="primary" @click="isRegister = !isRegister">
            {{ isRegister ? '返回登录' : '去注册' }}
          </el-button>
        </div>
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

.hero-metrics {
  display: flex;
  gap: 18px;
  margin-top: 28px;
  flex-wrap: wrap;
}

.hero-metrics div {
  min-width: 120px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.10);
  backdrop-filter: blur(16px);
}

.hero-metrics strong {
  display: block;
  font-size: 24px;
}

.hero-metrics span {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.76);
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.hero-tags span {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 13px;
}

.login-card {
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

.switch-row {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 18px;
  font-size: 14px;
  color: var(--color-text-muted);
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
