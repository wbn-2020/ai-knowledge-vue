import axios from 'axios'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { AUTH_EXPIRED_EVENT, TOKEN_KEY, USER_KEY } from '@/constants/auth'
import { asBizCode, BusinessError, isRagFriendlyCode } from '@/utils/business-error'

export interface ApiResponse<T = any> {
  code: number | string
  message: string
  data: T
}

export interface PageResponse<T = any> {
  list: T[]
  total: number
  pageNo: number
  pageSize: number
}

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

let handlingUnauthorized = false

request.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  (response: AxiosResponse) => {
    const contentType = String(response.headers['content-type'] || '')
    if (
      response.config.responseType === 'blob' ||
      contentType.includes('application/octet-stream') ||
      contentType.includes('text/csv') ||
      contentType.includes('application/pdf') ||
      contentType.includes('application/vnd.openxmlformats')
    ) {
      return response
    }

    const body = response.data
    if (body && typeof body === 'object' && 'code' in body) {
      const codeValue = (body as ApiResponse).code
      const code = asBizCode(codeValue)
      if (code === '0' || code === 'SUCCESS') {
        return 'data' in body ? (body as ApiResponse).data : body
      }

      const message = (body as ApiResponse).message || '请求失败'
      const error = new BusinessError(message, { bizCode: codeValue, bizData: (body as any).data })
      if (!isRagFriendlyCode(codeValue)) ElMessage.error(message)
      return Promise.reject(error)
    }

    return body
  },
  (error) => {
    const status = error.response?.status

    if (status === 401) {
      if (handlingUnauthorized) return Promise.reject(error)
      handlingUnauthorized = true

      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))

      const currentPath = router.currentRoute.value.path
      if (currentPath !== '/login') {
        router.replace('/login').finally(() => {
          handlingUnauthorized = false
        })
      } else {
        handlingUnauthorized = false
      }

      ElMessage.error('登录已过期，请重新登录')
      return Promise.reject(error)
    }

    if (status === 403) {
      ElMessage.error('暂无权限')
      return Promise.reject(error)
    }

    if (status >= 500) {
      ElMessage.error(error.response?.data?.message || '服务异常，请稍后重试')
      return Promise.reject(error)
    }

    ElMessage.error(error.response?.data?.message || '网络请求失败，请检查网络后重试')
    return Promise.reject(error)
  },
)

export default request

