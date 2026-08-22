const PLUGIN_ID = "SSEPlugin";

export type SSEConnectionEventType =
  "connecting" | "open" | "message" | "closed" | "cancelled" | "error";

export interface SSEConnectionOptions {
  url: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: unknown;
}

export interface SSEConnectionEvent {
  type: SSEConnectionEventType;
  data?: string;
  message?: string;
  code?: number;
  [key: string]: unknown;
}

interface NativeSSEPlugin {
  startSSE: (
    optionsJson: string,
    callback: (event: SSEConnectionEvent) => void,
  ) => void;
  stopSSE: () => void;
  getStatus: (callback: (status: unknown) => void) => void;
}

let nativePlugin: NativeSSEPlugin | undefined;

function getPlugin() {
  // #ifdef APP-PLUS
  if (!nativePlugin) {
    nativePlugin = uni.requireNativePlugin(
      PLUGIN_ID,
    ) as unknown as NativeSSEPlugin;
  }
  if (!nativePlugin?.startSSE) {
    throw new Error("SSEPlugin 未注册，请重新制作包含该插件的自定义基座");
  }
  return nativePlugin;
  // #endif

  // #ifndef APP-PLUS
  throw new Error("SSEPlugin 仅支持 Android App-Plus");
  // #endif
}

export function startSSE(
  options: SSEConnectionOptions,
  callback: (event: SSEConnectionEvent) => void,
) {
  if (typeof callback !== "function") {
    throw new TypeError("startSSE callback 必须是函数");
  }
  getPlugin().startSSE(JSON.stringify(options), callback);
}

export function stopSSE() {
  getPlugin().stopSSE();
}

export function getSSEStatus() {
  return new Promise<unknown>((resolve, reject) => {
    try {
      getPlugin().getStatus(resolve);
    } catch (error) {
      reject(error);
    }
  });
}
