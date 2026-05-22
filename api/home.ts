import type { HomeOverview } from '@/types/home'
import { request } from '@/utils/request'

export function getHomeOverviewApi() {
  return request<HomeOverview>({
    url: '/api/home/overview',
    method: 'GET'
  })
}
