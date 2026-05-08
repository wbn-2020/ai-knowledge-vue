import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { LoginForm, RegisterForm, UserInfo } from '@/types'
import { adminLogin as adminLoginApi, getCurrentUser, login as loginApi, logout as logoutApi, register as registerApi } from '@/api/auth'

const TOKEN_KEY = 'knowflow_token'
const USER_KEY = 'knowflow_user'

function readUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserInfo
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref<UserInfo | null>(readUser())

  const isLoggedIn = computed(() => !!token.value)

  function persist(nextToken: string, nextUser: UserInfo) {
    token.value = nextToken
    user.value = nextUser
    localStorage.setItem(TOKEN_KEY, nextToken)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
  }

  async function login(form: LoginForm) {
    const result = await loginApi(form)
    persist(result.token, result.user)
    return result
  }

  async function adminLogin(form: LoginForm) {
    const result = await adminLoginApi(form)
    persist(result.token, result.user)
    return result
  }

  async function register(form: RegisterForm) {
    const result = await registerApi(form)
    persist(result.token, result.user)
    return result
  }

  async function fetchMe() {
    const result = await getCurrentUser()
    user.value = result
    localStorage.setItem(USER_KEY, JSON.stringify(result))
    return result
  }

  async function logout() {
    try {
      if (token.value) await logoutApi()
    } catch {
      // JWT is stateless; local cleanup is still required.
    }
    token.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return { token, user, isLoggedIn, login, adminLogin, register, fetchMe, logout }
})
