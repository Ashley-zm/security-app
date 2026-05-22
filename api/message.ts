import { request } from '@/utils/request'

export function getUnreadCountApi() {
  return request<{ count: number }>({
    url: '/api/message/unread-count',
    method: 'GET'
  })
}
