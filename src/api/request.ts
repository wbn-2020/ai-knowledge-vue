import axios from 'axios'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

export interface ApiResponse<T = any> {
  code: number
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

request.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('knowflow_token')
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
    if (body && typeof body.code === 'number' && 'data' in body) {
      if (body.code === 0) return body.data
      ElMessage.error(body.message || '请求失败')
      return Promise.reject(new Error(body.message || '请求失败'))
    }

    return body
  },
  (error) => {
    const status = error.response?.status
    if (status === 401) {
      localStorage.removeItem('knowflow_token')
      localStorage.removeItem('knowflow_user')
      router.push('/login')
      ElMessage.error('登录已过期，请重新登录')
    } else if (status === 403) {
      ElMessage.error('暂无权限')
    } else {
      ElMessage.error(error.response?.data?.message || '网络请求失败')
    }
    return Promise.reject(error)
  },
)

export default request
