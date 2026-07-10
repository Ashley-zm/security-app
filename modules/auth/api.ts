import type { ChangePasswordParams, LoginParams, LoginResult, TenantListResult, UserInfoResult } from '@/modules/auth/types'
import { request } from '@/utils/request'
// 登录
export function loginApi(data: LoginParams) {
  return request<LoginResult, LoginParams>({
    url: '/auth/login',
    method: 'POST',
    headers: {
      isNotToken: true,
      isEncrypt: true,
    },
    data: {
      clientId: '428a8310cd442757ae699df5d894f051',
      grantType: 'password',
      ...data
    }
  })
}
// 修改密码
export function changePasswordApi(data: ChangePasswordParams) {
  return request<{ success: boolean }, ChangePasswordParams>({
    url: '/system/user/profile/updatePwd',
    method: 'PUT',
    headers: {
      isEncrypt: true,
    },
    data
  })
}
// 获取租户列表
export function getTenantListApi() {
  return request<TenantListResult>({
    url: '/auth/tenant/list',
    method: 'GET'
  })
}
// 获取用户信息
export function getUserInfoApi() {
  return request<UserInfoResult>({
    url: '/system/user/getInfo',
    method: 'GET'
  })
}
