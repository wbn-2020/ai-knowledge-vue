import request from './request'
import type { LoginForm, RegisterForm, UserInfo } from '@/types'

export interface AuthResult {
  token: string
  user: UserInfo
}

export function register(data: RegisterForm) {
  return request.post<any, AuthResult>('/auth/register', {
    username: data.username,
    email: data.email,
    password: data.password,
    confirmPassword: data.confirmPassword,
  })
}

export function login(data: LoginForm) {
  return request.post<any, AuthResult>('/auth/login', {
    account: data.username,
    password: data.password,
  })
}

export function adminLogin(data: LoginForm) {
  return request.post<any, AuthResult>('/admin/auth/login', {
    account: data.username,
    password: data.password,
  })
}

export function logout() {
  return request.delete('/auth/logout')
}

export function getCurrentUser() {
  return request.get<any, UserInfo>('/users/me')
}

export function updateCurrentUser(data: Partial<UserInfo>) {
  return request.put<any, UserInfo>('/users/me', data)
}

export function updatePassword(data: { oldPassword: string; newPassword: string; confirmPassword: string }) {
  return request.put('/users/me/password', data)
}
