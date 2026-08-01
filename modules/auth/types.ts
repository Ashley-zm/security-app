export interface LoginForm {
  username: string;
  password: string;
  tenantId: string;
  remember: boolean;
  agree?: boolean;
}

export interface LoginParams {
  username: string;
  password: string;
  tenantId?: string;
  clientId?: string;
  grantType?: string;
}

export interface UserInfo {
  userId: string;
  userName: string;
  nickName: string | null;
  mobile: string;
  employeeNo: string;
  roleName: string;
  avatarUrl: string | null;
  qrCodeUrl: string | null;
  tenantId: string;
  [key: string]: unknown;
}

export interface LoginResult {
  access_token: string;
  userInfo: UserInfo;
}

export interface TenantInfo {
  tenantId: string;
  companyName: string;
  domain: string | null;
}

export interface TenantListResult {
  tenantEnabled: boolean;
  voList: TenantInfo[];
}

export interface UserInfoResult {
  permissions: string[];
  roles: string[];
  user: UserInfo;
}
