import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { LoginForm, RegisterForm, UserInfo } from '@/types'
import { adminLogin as adminLoginApi, getCurrentUser, login as loginApi, logout as logoutApi, register as registerApi } from '@/api/auth'
import { useTagsViewStore } from '@/stores/tagsView'
import { useUiStore } from '@/stores/ui'
import { TOKEN_KEY, USER_KEY } from '@/constants/auth'

function readUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserInfo
  } catch {
    return null
  }
}

export function isAdminUser(user: Partial<UserInfo> | null | undefined): boolean {
  if (!user) return false
  if (user.isAdmin === true) return true
  const role = String(user.role || '').toUpperCase()
  if (role === 'ADMIN') return true
  const userType = String(user.userType || '').toUpperCase()
  if (userType === 'ADMIN') return true
  const roles = Array.isArray(user.roles) ? user.roles : user.roles ? [user.roles] : []
  return roles.some((item) => String(item || '').toUpperCase() === 'ADMIN')
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref<UserInfo | null>(readUser())

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => isAdminUser(user.value))

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

  function clearClientAuthState() {
    token.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)

    const tagsStore = useTagsViewStore()
    tagsStore.$reset()

    const uiStore = useUiStore()
    uiStore.resetState()
  }

  async function logout() {
    try {
      if (token.value) await logoutApi()
    } catch {
      // JWT is stateless; local cleanup is still required.
    }
    clearClientAuthState()
  }

  function forceLogout() {
    clearClientAuthState()
  }

  return { token, user, isLoggedIn, isAdmin, login, adminLogin, register, fetchMe, logout, forceLogout }
})
