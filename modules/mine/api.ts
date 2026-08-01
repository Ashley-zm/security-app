import type { ChangePasswordParams } from '@/modules/mine/types'
import { request } from '@/utils/request'

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
