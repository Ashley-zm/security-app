import { defineStore } from 'pinia'
import { loginApi } from '@/api/auth'
import type { LoginParams, UserInfo } from '@/types/auth'
import {
  clearToken,
  clearUserInfoStorage,
  getToken,
  getUserInfoStorage,
  setToken as setTokenStorage,
  setUserInfoStorage
} from '@/utils/storage'

interface UserState {
  token: string
  userInfo: UserInfo | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: getToken(),
    userInfo: getUserInfoStorage<UserInfo>()
  }),
  actions: {
    setToken(token: string) {
      this.token = token
      setTokenStorage(token)
    },
    setUserInfo(userInfo: UserInfo) {
      this.userInfo = userInfo
      setUserInfoStorage(userInfo)
    },
    async login(params: LoginParams) {
      const result = await loginApi(params)
      this.setToken(result.token)
      this.setUserInfo(result.userInfo)
      return result
    },
    logout() {
      this.token = ''
      this.userInfo = null
      clearToken()
      clearUserInfoStorage()
      uni.reLaunch({
        url: '/pages/login/index'
      })
    }
  }
})
