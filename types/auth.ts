export interface LoginForm {
  mobile: string
  password: string
  remember: boolean
  agree: boolean
}

export interface LoginParams {
  mobile: string
  password: string
}

export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}

export interface UserInfo {
  id: string
  name: string
  mobile: string
  employeeNo: string
  roleName: string
}

export interface LoginResult {
  token: string
  userInfo: UserInfo
}
