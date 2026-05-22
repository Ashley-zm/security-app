export function isMobile(value: string) {
  return /^1[3-9]\d{9}$/.test(value)
}

export function required(value?: string) {
  return Boolean(value && value.trim())
}
