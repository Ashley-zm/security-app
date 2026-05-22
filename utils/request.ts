import { mockRequest } from '@/api/mock'
import { getToken } from './storage'

export interface RequestOptions<T = unknown> {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: T
  header?: Record<string, string>
  mock?: boolean
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

const BASE_URL = ''
const USE_MOCK = true

export function request<T, D = unknown>(options: RequestOptions<D>): Promise<T> {
  const method = options.method || 'GET'

  if (USE_MOCK || options.mock) {
    return mockRequest<T>({
      url: options.url,
      method,
      data: options.data
    })
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}${options.url}`,
      method,
      data: options.data as UniApp.RequestOptions['data'],
      header: {
        Authorization: getToken() ? `Bearer ${getToken()}` : '',
        ...options.header
      },
      success: (res) => {
        const response = res.data as ApiResponse<T>
        if (response.code === 0 || response.code === 200) {
          resolve(response.data)
          return
        }
        uni.showToast({
          title: response.message || '请求失败',
          icon: 'none'
        })
        reject(new Error(response.message || '请求失败'))
      },
      fail: (error) => {
        uni.showToast({
          title: '网络异常，请稍后重试',
          icon: 'none'
        })
        reject(error)
      }
    })
  })
}
