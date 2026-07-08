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
import { getUserInfoApi } from '@/api/auth'

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
    async setToken(token: string) {
      this.token = token
      setTokenStorage(token)
      const userInfoResult = await getUserInfoApi()
      this.setUserInfo(userInfoResult.user)
    },
    setUserInfo(userInfo: UserInfo) {
      this.userInfo = userInfo
      setUserInfoStorage(userInfo)
    },
    async login(params: LoginParams) {
      const result = await loginApi(params)
      this.setToken(result.access_token)
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
  },
  getters: {
    getToken: (state) => state.token,
    getUserInfo: (state) => state.userInfo
  }
})
