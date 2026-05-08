import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { LoginForm, RegisterForm, UserInfo } from '@/types'
import { currentUser } from '@/mock/data'

const TOKEN_KEY = 'knowflow_token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref<UserInfo | null>(localStorage.getItem('knowflow_user') ? JSON.parse(localStorage.getItem('knowflow_user') as string) : currentUser)

  const isLoggedIn = computed(() => !!token.value)

  function persistUser(nextUser: UserInfo) {
    user.value = nextUser
    localStorage.setItem('knowflow_user', JSON.stringify(nextUser))
  }

  async function login(form: LoginForm) {
    const nextUser: UserInfo = {
      ...currentUser,
      username: form.username,
      nickname: form.username === 'admin' ? 'KnowFlow 管理员' : 'KnowFlow 用户',
      role: form.username === 'admin' ? 'ADMIN' : 'USER',
    }
    token.value = 'mock-token-' + Date.now()
    localStorage.setItem(TOKEN_KEY, token.value)
    persistUser(nextUser)
    return { code: 200, data: { token: token.value, user: nextUser }, msg: 'ok' }
  }

  async function register(form: RegisterForm) {
    return {
      code: 200,
      data: {
        id: Date.now(),
        username: form.username,
        nickname: form.nickname || form.username,
      },
      msg: '注册成功',
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('knowflow_user')
  }

  return { token, user, isLoggedIn, login, register, logout }
})
