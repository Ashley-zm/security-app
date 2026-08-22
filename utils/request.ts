import { mockRequest } from "@/mocks";
import { getToken } from "@/utils/storage";
import {
  encryptWithAes,
  generateAesKey,
  encryptBase64,
  decryptBase64,
  decryptWithAes,
} from "@/utils/crypto";
import { encrypt, decrypt } from "@/utils/jsencrypt";
import { HttpStatus } from "@/utils/RespEnum";
import { errorCode, errorMsg } from "@/utils/errorCode";
import { useUserStore } from "@/stores/user";
import { removeEmptyParams } from "@/utils/common";

type RequestMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "OPTIONS"
  | "HEAD"
  | "TRACE"
  | "CONNECT";
type RequestHeaderFactory = () => Record<string, string>;
type RequestHeaderValue = string | number | boolean | undefined;

interface RequestControlOptions {
  isNotToken?: boolean;
  isEncrypt?: boolean;
}

export type RequestHeaders = RequestControlOptions &
  Record<string, RequestHeaderValue>;

export interface RequestOptions<T = unknown> {
  url: string;
  method?: RequestMethod;
  data?: T;
  headers?: RequestHeaders;
  timeout?: number;
}

export interface ApiResponse<T> {
  code?: number;
  message?: string;
  msg?: string;
  data?: T;
  rows?: T[];
  total?: number;
}

interface RequestRuntimeConfig {
  baseUrl: string;
  useMock: boolean;
  timeout: number;
  header: RequestHeaderFactory;
}

export type RequestConfig = Partial<RequestRuntimeConfig>;

export type RouteRequestConfig = Partial<
  Omit<RequestRuntimeConfig, "header">
> & {
  url: string | RegExp;
  header?: RequestHeaderFactory;
};

export class RequestError extends Error {
  code?: number;
  statusCode?: number;
  response?: unknown;

  constructor(
    message: string,
    options: { code?: number; statusCode?: number; response?: unknown } = {},
  ) {
    super(message);
    this.name = "RequestError";
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.response = options.response;
  }
}

const ENCRYPT_HEADER = "encrypt-key";
const BASE_URL =
  import.meta.env.VITE_BASE_API_URL || "http://192.168.99.77:58085/";
export const FILE_URL =
  import.meta.env.VITE_FILE_API_URL || "http://192.168.99.77:58080/inspection/";
const CONTROL_HEADER_KEYS = ["isNotToken", "isEncrypt"];

let DEFAULT_REQUEST_CONFIG: RequestRuntimeConfig = {
  baseUrl: BASE_URL,
  useMock: false,
  timeout: 15000,
  header: () => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    headers.clientId = "428a8310cd442757ae699df5d894f051";
    return headers;
  },
};

let routeRequestConfigs: RouteRequestConfig[] = [];

export function setRequestConfig(config: RequestConfig) {
  DEFAULT_REQUEST_CONFIG = {
    ...DEFAULT_REQUEST_CONFIG,
    ...config,
    header: config.header || DEFAULT_REQUEST_CONFIG.header,
  };
}

export function setRouteRequestConfigs(configs: RouteRequestConfig[]) {
  routeRequestConfigs = configs;
}

function isControlHeaderKey(key: string): key is keyof RequestControlOptions {
  return (CONTROL_HEADER_KEYS as readonly string[]).includes(key);
}

function getRouteRequestConfig(url: string): RequestRuntimeConfig {
  const routeConfig = routeRequestConfigs.find((item) => {
    return typeof item.url === "string" ? item.url === url : item.url.test(url);
  });

  if (!routeConfig) return DEFAULT_REQUEST_CONFIG;

  return {
    ...DEFAULT_REQUEST_CONFIG,
    ...routeConfig,
    header: routeConfig.header || DEFAULT_REQUEST_CONFIG.header,
  };
}

function normalizeUrl(baseUrl: string, url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  return `${baseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}

function normalizeResponseData<T>(response: ApiResponse<T>): T {
  if (Object.prototype.hasOwnProperty.call(response, "data"))
    return response.data as T;

  if (
    Object.prototype.hasOwnProperty.call(response, "rows") ||
    Object.prototype.hasOwnProperty.call(response, "total")
  ) {
    return {
      list: response.rows || [],
      total: response.total || 0,
    } as T;
  }

  return undefined as T;
}

function getErrorMessage(response?: ApiResponse<unknown>) {
  return (
    errorCode[response?.code || 0] || response?.msg || errorCode["default"]
  );
}

export function showErrorToast(message: string) {
  uni.showToast({
    title: message,
    icon: "none",
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function transformRequestData<T>(
  data: T | undefined,
  isEncrypt: boolean,
  aesKey?: CryptoJS.lib.WordArray,
) {
  if (!isEncrypt || data === undefined || data === null || !aesKey) {
    if (data) {
      return removeEmptyParams(data);
    }
    return data;
  }

  const rawData = typeof data === "string" ? data : JSON.stringify(data);
  return encryptWithAes(rawData, aesKey);
}

function buildRequestHeader(
  headers: RequestHeaders | undefined,
  runtimeConfig: RequestRuntimeConfig,
  aesKey?: CryptoJS.lib.WordArray,
) {
  const requestHeaders: Record<string, string> = headers?.isNotToken
    ? {}
    : { ...runtimeConfig.header() };

  Object.entries(headers || {}).forEach(([key, value]) => {
    if (isControlHeaderKey(key) || value === undefined) return;
    requestHeaders[key] = String(value);
  });

  if (headers?.isEncrypt && aesKey) {
    requestHeaders[ENCRYPT_HEADER] = encrypt(encryptBase64(aesKey));
  }

  return requestHeaders;
}

export function getRequestTransportConfig(
  url: string,
  headers?: RequestHeaders,
) {
  const runtimeConfig = getRouteRequestConfig(url);
  return {
    url: normalizeUrl(runtimeConfig.baseUrl, url),
    header: buildRequestHeader(headers, runtimeConfig),
    timeout: runtimeConfig.timeout,
  };
}
function isHttpSuccess(statusCode: number) {
  return statusCode >= 200 && statusCode < 300;
}

export function request<T, D = unknown>(
  options: RequestOptions<D>,
): Promise<T> {
  const method = options.method || "GET";
  const runtimeConfig = getRouteRequestConfig(options.url);

  if (runtimeConfig.useMock) {
    return mockRequest<T>({
      url: options.url,
      method,
      data: options.data,
    });
  }

  const aesKey = options.headers?.isEncrypt ? generateAesKey() : undefined;
  const requestData = transformRequestData(
    options.data,
    Boolean(options.headers?.isEncrypt),
    aesKey,
  );
  const requestHeader = buildRequestHeader(
    options.headers,
    runtimeConfig,
    aesKey,
  );
  return new Promise((resolve, reject) => {
    uni.request({
      url: normalizeUrl(runtimeConfig.baseUrl, options.url),
      method,
      data: requestData as UniApp.RequestOptions["data"],
      header: requestHeader,
      timeout: options.timeout || runtimeConfig.timeout,
      success: (res) => {
        const response = res.data as ApiResponse<T>;
        const statusCode = Number(res.statusCode) || HttpStatus.SUCCESS;
        // 加密后的 AES 秘钥
        const keyStr = res.header[ENCRYPT_HEADER] || "";
        if (keyStr != null && keyStr != "") {
          const aesKey = (decrypt(keyStr) as string) || "";
          response.data = JSON.parse(
            decryptWithAes(
              (response?.data as string) || "",
              decryptBase64(aesKey.toString()),
            ),
          );
        }

        if (!isHttpSuccess(statusCode)) {
          const message = getErrorMessage(response);
          showErrorToast(message);
          reject(new RequestError(message, { statusCode, response }));
          return;
        }

        if (!isPlainObject(response) || response.code === undefined) {
          resolve(response as T);
          return;
        }

        const responseCode = Number(response.code);

        if (
          responseCode === HttpStatus.SUCCESS ||
          responseCode === HttpStatus.CREATED ||
          responseCode === HttpStatus.ACCEPTED ||
          responseCode === HttpStatus.CONFLICT
        ) {
          resolve(normalizeResponseData(response));
          return;
        }

        // 如果是401错误 则跳转到登录页
        if (responseCode === HttpStatus.UNAUTHORIZED) {
          const userStore = useUserStore();

          // 提示用户重新登录
          showErrorToast("登录过期，请重新登录");
          // 清除本地存储的 token
          userStore.logout();
          return;
        }

        const message = getErrorMessage(response);
        showErrorToast(message);
        reject(
          new RequestError(message, {
            code: responseCode,
            statusCode,
            response,
          }),
        );
      },
      fail: (error) => {
        showErrorToast(
          errorMsg[error.errMsg] || error.errMsg || errorMsg["default"],
        );
        reject(error);
      },
    });
  });
}

export const http = {
  get: <T, D = unknown>(
    url: string,
    data?: D,
    options: Omit<RequestOptions<D>, "url" | "method" | "data"> = {},
  ) => {
    return request<T, D>({ ...options, url, method: "GET", data });
  },
  post: <T, D = unknown>(
    url: string,
    data?: D,
    options: Omit<RequestOptions<D>, "url" | "method" | "data"> = {},
  ) => {
    return request<T, D>({ ...options, url, method: "POST", data });
  },
  put: <T, D = unknown>(
    url: string,
    data?: D,
    options: Omit<RequestOptions<D>, "url" | "method" | "data"> = {},
  ) => {
    return request<T, D>({ ...options, url, method: "PUT", data });
  },
  delete: <T, D = unknown>(
    url: string,
    data?: D,
    options: Omit<RequestOptions<D>, "url" | "method" | "data"> = {},
  ) => {
    return request<T, D>({ ...options, url, method: "DELETE", data });
  },
};
