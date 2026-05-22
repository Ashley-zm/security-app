import { getToken } from './storage'

const whiteList = ['/pages/login/index']
const protectedRoots = [
  '/pages/home/index',
  '/pages/work-order/index',
  '/pages/statistics/index',
  '/pages/message/index',
  '/pages/mine/index',
  '/pages/assistant/index',
  '/pages/plugin-check/index'
]

let installed = false

function normalizeUrl(url = '') {
  const path = url.split('?')[0]
  return path.startsWith('/') ? path : `/${path}`
}

function isProtected(url = '') {
  const path = normalizeUrl(url)
  return protectedRoots.includes(path)
}

function redirectToLogin() {
  uni.reLaunch({
    url: '/pages/login/index'
  })
}

export function hasLogin() {
  return Boolean(getToken())
}

export function setupPermission() {
  if (installed) return
  installed = true

  const guard = {
    invoke(args: UniApp.NavigateToOptions | UniApp.SwitchTabOptions | UniApp.RedirectToOptions | UniApp.ReLaunchOptions) {
      const url = normalizeUrl(String(args.url || ''))
      if (whiteList.includes(url)) return true
      if (isProtected(url) && !hasLogin()) {
        redirectToLogin()
        return false
      }
      return true
    }
  }

  uni.addInterceptor('navigateTo', guard)
  uni.addInterceptor('redirectTo', guard)
  uni.addInterceptor('reLaunch', guard)
  uni.addInterceptor('switchTab', guard)
}

export function guardCurrentPage() {
  setTimeout(() => {
    const pages = getCurrentPages()
    const current = pages[pages.length - 1]
    const route = current ? `/${current.route}` : ''
    if (route && isProtected(route) && !hasLogin()) {
      redirectToLogin()
    }
  }, 0)
}
