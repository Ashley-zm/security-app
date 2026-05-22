import type { ChangePasswordParams, LoginParams, LoginResult } from '@/types/auth'
import { request } from '@/utils/request'

export function loginApi(data: LoginParams) {
  return request<LoginResult, LoginParams>({
    url: '/api/auth/login',
    method: 'POST',
    data
  })
}

export function changePasswordApi(data: ChangePasswordParams) {
  return request<{ success: boolean }, ChangePasswordParams>({
    url: '/api/auth/change-password',
    method: 'POST',
    data
  })
}
