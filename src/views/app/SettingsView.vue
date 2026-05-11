<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { updateCurrentUser, updatePassword } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const profileFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()
const loading = ref(false)
const savingProfile = ref(false)
const savingPassword = ref(false)
const errorMessage = ref('')

const profileForm = reactive({
  nickname: '',
  email: '',
  avatar: '',
  bio: '',
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const profileRules: FormRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 30, message: '昵称长度应为 2-30 个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效邮箱', trigger: ['blur', 'change'] },
  ],
  avatar: [{ max: 500, message: '头像地址过长', trigger: 'blur' }],
  bio: [{ max: 200, message: '个人简介最多 200 个字符', trigger: 'blur' }],
}

const passwordRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 32, message: '新密码长度应为 8-32 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== passwordForm.newPassword) callback(new Error('两次输入的新密码不一致'))
        else callback()
      },
      trigger: ['blur', 'change'],
    },
  ],
}

function fillProfileFromStore() {
  const user = authStore.user
  Object.assign(profileForm, {
    nickname: user?.nickname || user?.username || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
    bio: user?.bio || '',
  })
}

async function loadCurrentUser() {
  loading.value = true
  errorMessage.value = ''
  try {
    await authStore.fetchMe()
    fillProfileFromStore()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '当前用户信息加载失败'
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  await profileFormRef.value?.validate()
  savingProfile.value = true
  try {
    const user = await updateCurrentUser({
      nickname: profileForm.nickname.trim(),
      email: profileForm.email.trim(),
      avatar: profileForm.avatar.trim() || undefined,
      bio: profileForm.bio.trim() || undefined,
    })
    authStore.user = user
    localStorage.setItem('knowflow_user', JSON.stringify(user))
    fillProfileFromStore()
    ElMessage.success('个人资料已保存')
  } finally {
    savingProfile.value = false
  }
}

async function savePassword() {
  await passwordFormRef.value?.validate()
  savingPassword.value = true
  try {
    await updatePassword({ ...passwordForm })
    Object.assign(passwordForm, { oldPassword: '', newPassword: '', confirmPassword: '' })
    passwordFormRef.value?.clearValidate()
    await authStore.logout()
    ElMessage.success('密码已修改，请重新登录')
    router.replace('/login')
  } finally {
    savingPassword.value = false
  }
}

onMounted(loadCurrentUser)
</script>

<template>
  <div v-loading="loading">
    <div class="page-header">
      <div>
        <h1 class="page-title">个人设置</h1>
        <div class="page-desc">维护账号资料和登录密码</div>
      </div>
      <el-button plain :loading="loading" @click="loadCurrentUser">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <el-alert v-if="errorMessage" class="state-alert" type="error" show-icon :closable="false" :title="errorMessage" />

    <div class="settings-grid">
      <section class="soft-card profile-card">
        <div class="soft-card-body">
          <div class="profile-head">
            <el-avatar :size="64" :src="profileForm.avatar">
              {{ (profileForm.nickname || authStore.user?.username || 'U').slice(0, 1).toUpperCase() }}
            </el-avatar>
            <div>
              <h3>{{ profileForm.nickname || authStore.user?.username || '当前用户' }}</h3>
              <p>{{ authStore.user?.role || 'USER' }} | {{ authStore.user?.status || '-' }}</p>
            </div>
          </div>

          <el-form ref="profileFormRef" :model="profileForm" :rules="profileRules" label-position="top">
            <el-form-item label="昵称" prop="nickname"><el-input v-model="profileForm.nickname" maxlength="30" show-word-limit /></el-form-item>
            <el-form-item label="邮箱" prop="email"><el-input v-model="profileForm.email" /></el-form-item>
            <el-form-item label="头像地址" prop="avatar"><el-input v-model="profileForm.avatar" /></el-form-item>
            <el-form-item label="个人简介" prop="bio"><el-input v-model="profileForm.bio" type="textarea" :rows="4" maxlength="200" show-word-limit /></el-form-item>
            <el-button type="primary" :loading="savingProfile" @click="saveProfile">保存资料</el-button>
          </el-form>
        </div>
      </section>

      <section class="soft-card">
        <div class="soft-card-body">
          <h3 class="section-title">修改密码</h3>
          <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-position="top">
            <el-form-item label="旧密码" prop="oldPassword"><el-input v-model="passwordForm.oldPassword" type="password" show-password /></el-form-item>
            <el-form-item label="新密码" prop="newPassword"><el-input v-model="passwordForm.newPassword" type="password" show-password /></el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword"><el-input v-model="passwordForm.confirmPassword" type="password" show-password /></el-form-item>
            <el-alert class="password-tip" type="info" show-icon :closable="false" title="密码修改成功后将清理当前登录态，并返回登录页" />
            <el-button type="primary" :loading="savingPassword" @click="savePassword">修改密码</el-button>
          </el-form>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.state-alert { margin-bottom: 16px; }
.settings-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(360px, 0.72fr); gap: 16px; align-items: start; }
.profile-head { display: flex; align-items: center; gap: 16px; margin-bottom: 22px; padding-bottom: 18px; border-bottom: 1px solid var(--color-border); }
.profile-head h3 { margin: 0; font-size: 20px; }
.profile-head p { margin: 6px 0 0; color: var(--color-text-muted); }
.password-tip { margin-bottom: 16px; }
@media (max-width: 980px) { .settings-grid { grid-template-columns: 1fr; } }
</style>
