const TOKEN_KEY = 'CYC_SECURITY_TOKEN'
const USER_INFO_KEY = 'CYC_SECURITY_USER_INFO'
const REMEMBER_MOBILE_KEY = 'CYC_SECURITY_REMEMBER_MOBILE'
const REMEMBER_PASSWORD_KEY = 'CYC_SECURITY_REMEMBER_PASSWORD'

export function setStorage<T>(key: string, value: T) {
  uni.setStorageSync(key, value)
}

export function getStorage<T>(key: string): T | null {
  const value = uni.getStorageSync(key)
  return value || null
}

export function removeStorage(key: string) {
  uni.removeStorageSync(key)
}

export function setToken(token: string) {
  setStorage(TOKEN_KEY, token)
}

export function getToken() {
  return getStorage<string>(TOKEN_KEY) || ''
}

export function clearToken() {
  removeStorage(TOKEN_KEY)
}

export function setUserInfoStorage<T>(userInfo: T) {
  setStorage(USER_INFO_KEY, userInfo)
}

export function getUserInfoStorage<T>() {
  return getStorage<T>(USER_INFO_KEY)
}

export function clearUserInfoStorage() {
  removeStorage(USER_INFO_KEY)
}

export function setRememberLogin(mobile: string, password: string) {
  setStorage(REMEMBER_MOBILE_KEY, mobile)
  setStorage(REMEMBER_PASSWORD_KEY, password)
}

export function getRememberLogin() {
  return {
    mobile: getStorage<string>(REMEMBER_MOBILE_KEY) || '',
    password: getStorage<string>(REMEMBER_PASSWORD_KEY) || ''
  }
}

export function clearRememberLogin() {
  removeStorage(REMEMBER_MOBILE_KEY)
  removeStorage(REMEMBER_PASSWORD_KEY)
}
