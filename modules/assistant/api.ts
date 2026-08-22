import { RequestError } from "@/utils/request";
import { getUserInfoStorage } from "@/utils/storage";
import { startSSE, stopSSE, type SSEConnectionEvent } from "@/utils/sse";
import type { UserInfo } from "@/modules/auth/types";
import type {
  AssistantAgent,
  AssistantContent,
  AssistantCredential,
  AssistantDataContent,
  AssistantImageDraft,
  AssistantMessage,
  AssistantModel,
  AssistantModelConfig,
  AssistantSendMessageParams,
  AssistantSession,
  AssistantSessionItem,
  AssistantStreamEvent,
  AssistantStreamResult,
  AssistantStreamSnapshot,
  AssistantTextContent,
  AssistantKnowledgeBase,
  AssistantKnowledgeConfig,
} from "@/modules/assistant/types";

const API_BASE_URL = (
  import.meta.env.VITE_ASSISTANT_API_BASE_URL ||
  "http://117.50.174.170:58081/agent-chat/"
).replace(/\/$/, "");
const REQUEST_TIMEOUT = 60000;

function getCurrentUserId() {
  const userId = String(getUserInfoStorage<UserInfo>()?.userId || "").trim();
  if (!userId) throw new RequestError("未获取到当前登录用户 ID，请重新登录");
  return userId;
}

type AgentMethod = "GET" | "POST" | "PATCH" | "DELETE";

function apiUrl(path: string, query?: Record<string, string | undefined>) {
  const queryString = Object.entries(query || {})
    .filter(([, value]) => Boolean(value))
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value || "")}`,
    )
    .join("&");
  return `${API_BASE_URL}/${path.replace(/^\//, "")}${queryString ? `?${queryString}` : ""}`;
}

function unwrap<T>(value: unknown): T {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.prototype.hasOwnProperty.call(value, "data") &&
    Object.prototype.hasOwnProperty.call(value, "code")
  ) {
    return (value as { data: T }).data;
  }
  return value as T;
}

function responseMessage(value: unknown, fallback: string) {
  if (!value || typeof value !== "object") return fallback;
  const data = value as Record<string, unknown>;
  return String(data.message || data.msg || fallback);
}

function agentRequest<T>(
  path: string,
  options: {
    method?: AgentMethod;
    query?: Record<string, string | undefined>;
    data?: unknown;
    timeout?: number;
  } = {},
) {
  return new Promise<T>((resolve, reject) => {
    console.log("请求路径", apiUrl(path, options.query));
    uni.request({
      url: apiUrl(path, options.query),
      method: (options.method || "GET") as UniApp.RequestOptions["method"],
      data: options.data as UniApp.RequestOptions["data"],
      timeout: options.timeout || REQUEST_TIMEOUT,
      header: {
        "x-user-id": getCurrentUserId(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      success: (res) => {
        console.log("请求成功", path, res);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(unwrap<T>(res.data));
          return;
        }
        reject(
          new RequestError(responseMessage(res.data, "安检助手服务请求失败"), {
            statusCode: res.statusCode,
            response: res.data,
          }),
        );
      },
      fail: (error) =>
        reject(new RequestError(error.errMsg || "安检助手服务连接失败")),
    });
  });
}

export function getAssistantAgentsApi() {
  return agentRequest<{ agents: AssistantAgent[]; total?: number }>("/agent/");
}

export function getAssistantCredentialsApi() {
  return agentRequest<{
    credentials: AssistantCredential[];
    total?: number;
  }>("/credential/");
}

export function getAssistantModelsApi(provider: string) {
  return agentRequest<{ models: AssistantModel[] }>("/model/", {
    query: { provider },
  });
}

export function getAssistantSessionsApi(agentId: string) {
  return agentRequest<{ sessions: AssistantSessionItem[] }>("/sessions/", {
    query: { agent_id: agentId },
  });
}

export function getAssistantMessagesApi(agentId: string, sessionId: string) {
  return agentRequest<{
    messages: AssistantMessage[];
    is_running?: boolean;
    has_more?: boolean;
  }>(`/sessions/${encodeURIComponent(sessionId)}/messages`, {
    query: { agent_id: agentId },
  });
}
export function getAssistantKnowledgeBaseApi() {
  return agentRequest<{ knowledge_bases: AssistantKnowledgeBase[] }>(
    "/knowledge_bases/",
  );
}

export function createAssistantSessionApi(
  agentId: string,
  chatModelConfig: AssistantModelConfig,
  knowledgeConfig: AssistantKnowledgeConfig,
) {
  return agentRequest<{ session_id: string }>("/sessions/", {
    method: "POST",
    data: {
      agent_id: agentId,
      chat_model_config: chatModelConfig,
      knowledge_config: knowledgeConfig,
    },
  });
}
// 中断会话
export function interruptAssistantSessionApi(
  agentId: string,
  sessionId: string,
) {
  return agentRequest<void>(
    `/sessions/${encodeURIComponent(sessionId)}/interrupt/`,
    {
      method: "POST",
      query: { agent_id: agentId },
    },
  );
}

export function updateAssistantSessionApi(
  agentId: string,
  sessionId: string,
  data: {
    name?: string;
    chat_model_config?: AssistantModelConfig;
    knowledge_config?: AssistantKnowledgeConfig | null;
  },
) {
  return agentRequest<AssistantSession>(
    `/sessions/${encodeURIComponent(sessionId)}/`,
    { method: "PATCH", query: { agent_id: agentId }, data },
  );
}

export function deleteAssistantSessionApi(agentId: string, sessionId: string) {
  return agentRequest<void>(`/sessions/${encodeURIComponent(sessionId)}/`, {
    method: "DELETE",
    query: { agent_id: agentId },
  });
}

function uuid() {
  const cryptoApi = globalThis.crypto as
    | { randomUUID?: () => string }
    | undefined;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function imageContent(image: AssistantImageDraft): AssistantDataContent {
  return {
    id: uuid(),
    type: "data",
    source: {
      type: "base64",
      media_type: image.mediaType,
      data: image.base64,
    },
    name: image.name,
  };
}

export function sendAssistantMessageApi(params: AssistantSendMessageParams) {
  const now = new Date().toISOString();
  const content: AssistantContent[] = [];
  if (params.text?.trim()) {
    content.push({ id: uuid(), type: "text", text: params.text.trim() });
  }
  content.push(...(params.images || []).map(imageContent));
  return agentRequest<{ status: string; session_id: string }>("/chat/", {
    method: "POST",
    data: {
      agent_id: params.agentId,
      session_id: params.sessionId,
      input: {
        id: uuid(),
        name: "user",
        role: "user",
        content,
        created_at: now,
        finished_at: now,
        metadata: {},
      },
    },
  });
}

function textFromContent(content: unknown) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const block = item as Partial<AssistantTextContent>;
      return block.type === "text" && typeof block.text === "string"
        ? block.text
        : "";
    })
    .join("");
}

function eventDelta(event: AssistantStreamEvent) {
  const type = String(event.type || "").toUpperCase();
  if (type !== "TEXT_BLOCK_DELTA" && type !== "TEXT_BLOCK") return "";
  if (typeof event.delta === "string") return event.delta;
  if (event.delta && typeof event.delta === "object") {
    return event.delta.text || event.delta.content || "";
  }
  if (typeof event.text === "string") return event.text;
  return textFromContent(event.content);
}

function eventTableTitle(event: AssistantStreamEvent) {
  const value = event.value || {};
  const candidates = [
    event.table_title,
    event.first_level_title,
    event.title,
    event.tableTitle,
    event.firstLevelTitle,
    event.level_one_title,
    event.level1_title,
    event["一级标题"],
    value.table_title,
    value.first_level_title,
    value.title,
    value.tableTitle,
    value.firstLevelTitle,
    value.level_one_title,
    value.level1_title,
    value["一级标题"],
  ];
  return candidates
    .find(
      (item): item is string =>
        typeof item === "string" && Boolean(item.trim()),
    )
    ?.trim();
}

export function streamAssistantReplyApi(
  agentId: string,
  sessionId: string,
  onEvent: (
    snapshot: AssistantStreamSnapshot,
    event: AssistantStreamEvent,
  ) => void,
) {
  let cancel = () => undefined;
  let readyResolved = false;
  let resolveReady: () => void = () => undefined;
  const ready = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });
  const markReady = () => {
    if (readyResolved) return;
    readyResolved = true;
    resolveReady();
  };
  const promise = new Promise<AssistantStreamResult>((resolve, reject) => {
    let text = "";
    let replyId = "";
    let thinking = "";
    let tableTitle = "";
    const mediaBuffers = new Map<
      string,
      AssistantStreamSnapshot["media"][number]
    >();
    const snapshot = (): AssistantStreamSnapshot => ({
      replyId: replyId || undefined,
      text,
      thinking,
      tableTitle: tableTitle || undefined,
      media: [...mediaBuffers.values()].filter((item) => item.data || item.url),
    });
    let settled = false;
    let abortTransport: () => void = () => undefined;

    const finish = (result: AssistantStreamResult) => {
      if (settled) return;
      settled = true;
      markReady();
      resolve(result);
    };
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      markReady();
      reject(error);
    };
    cancel = () => {
      if (settled) return;
      settled = true;
      markReady();
      abortTransport();
      reject(new RequestError("流式请求已取消"));
    };
    const consumeEvent = (event: AssistantStreamEvent) => {
      replyId ||= event.reply_id || "";
      tableTitle ||= eventTableTitle(event) || "";
      const type = String(event.type || "").toUpperCase();
      const delta = eventDelta(event);
      if (delta) {
        text += delta;
        onEvent(snapshot(), event);
      }
      if (type === "THINKING_BLOCK_DELTA" && typeof event.delta === "string") {
        thinking += event.delta;
      }
      const mediaId = event.block_id || event.tool_call_id || event.id || type;
      if (type === "DATA_BLOCK_START") {
        mediaBuffers.set(mediaId, {
          id: mediaId,
          mediaType: event.media_type || "application/octet-stream",
          data: "",
        });
      } else if (type === "DATA_BLOCK_DELTA") {
        const current = mediaBuffers.get(mediaId);
        mediaBuffers.set(mediaId, {
          id: mediaId,
          mediaType:
            event.media_type ||
            current?.mediaType ||
            "application/octet-stream",
          data: `${current?.data || ""}${event.data || ""}`,
          url: event.url || current?.url,
        });
      } else if (type === "TOOL_RESULT_DATA_DELTA") {
        const current = mediaBuffers.get(mediaId);
        mediaBuffers.set(mediaId, {
          id: mediaId,
          mediaType: event.media_type || "application/octet-stream",
          data: `${current?.data || ""}${event.data || ""}`,
          url: event.url || current?.url,
        });
      }
      if (!delta) onEvent(snapshot(), event);
      if (type === "REPLY_END") {
        if (event.error?.message || event.finished_reason === "error") {
          fail(new RequestError(event.error?.message || "助手回复失败"));
        } else {
          finish({ ...snapshot(), finishedReason: event.finished_reason });
        }
        abortTransport();
      }
    };
    const consumePayload = (payload: string) => {
      if (!payload) return;
      if (payload === "[DONE]") {
        finish(snapshot());
        return;
      }
      try {
        const parsed = JSON.parse(payload) as
          | AssistantStreamEvent
          | AssistantStreamEvent[];
        (Array.isArray(parsed) ? parsed : [parsed]).forEach(consumeEvent);
      } catch {
        // event/id/retry 行不属于 JSON 数据，安全忽略。
      }
    };
    const streamUrl = apiUrl(
      `/sessions/${encodeURIComponent(sessionId)}/stream`,
      { agent_id: agentId },
    );
    const handleConnectionEvent = (event: SSEConnectionEvent | null) => {
      if (settled) return;
      if (!event) {
        fail(
          new RequestError(
            "SSEPlugin callback payload is empty; rebuild the custom runtime",
          ),
        );
        return;
      }
      if (event.type === "connecting" || event.type === "open") {
        markReady();
      } else if (event.type === "message") {
        consumePayload(String(event.data || ""));
      } else if (event.type === "closed") {
        if (text || mediaBuffers.size) finish(snapshot());
        else fail(new RequestError(event.message || "SSE connection closed"));
      } else if (event.type === "cancelled") {
        fail(new RequestError("SSE request cancelled"));
      } else if (event.type === "error") {
        fail(
          new RequestError(event.message || "SSE connection failed", {
            statusCode: event.code,
            response: event,
          }),
        );
      }
    };
    try {
      startSSE(
        {
          url: streamUrl,
          method: "GET",
          headers: {
            "x-user-id": getCurrentUserId(),
            Accept: "text/event-stream",
            "Cache-Control": "no-cache",
          },
        },
        handleConnectionEvent,
      );
      abortTransport = () => stopSSE();
    } catch (error) {
      fail(
        new RequestError(
          error instanceof Error
            ? error.message
            : "Failed to start SSE request",
        ),
      );
    }
  });
  return Object.assign(promise, { abort: () => cancel(), ready });
}

export function getMessageText(message: AssistantMessage) {
  return textFromContent(message.content);
}

export function getMessageImages(message: AssistantMessage) {
  return message.content.filter((item): item is AssistantDataContent => {
    if (item.type !== "data" || !("source" in item)) return false;
    const source = (item as AssistantDataContent).source;
    if (source?.type === "url") return Boolean(source.url);
    return (
      source?.type === "base64" &&
      typeof source.data === "string" &&
      Boolean(source.data)
    );
  });
}

interface AppPlusFileReader {
  result?: string;
  onloadend?: () => void;
  onerror?: (error: { message?: string }) => void;
  readAsDataURL: (file: unknown) => void;
}

interface AppPlusFileEntry {
  file: (
    success: (file: unknown) => void,
    fail: (error: { message?: string }) => void,
  ) => void;
}

interface AppPlusRuntime {
  io?: {
    FileReader?: new () => AppPlusFileReader;
    resolveLocalFileSystemURL?: (
      path: string,
      success: (entry: AppPlusFileEntry) => void,
      fail: (error: { message?: string }) => void,
    ) => void;
  };
}

function base64FromDataUrl(dataUrl: string) {
  const separator = dataUrl.indexOf(",");
  if (separator < 0 || !dataUrl.slice(separator + 1)) {
    throw new RequestError("图片 Base64 数据为空");
  }
  return dataUrl.slice(separator + 1);
}

function readAppPlusImageAsBase64(filePath: string) {
  const appPlus = (globalThis as typeof globalThis & { plus?: AppPlusRuntime })
    .plus;
  const resolveFile = appPlus?.io?.resolveLocalFileSystemURL;
  const Reader = appPlus?.io?.FileReader;
  if (!resolveFile || !Reader) return undefined;

  return new Promise<string>((resolve, reject) => {
    const fail = (error: { message?: string }) =>
      reject(new RequestError(error?.message || "Android 图片读取失败"));
    resolveFile(
      filePath,
      (entry) => {
        entry.file((file) => {
          const reader = new Reader();
          reader.onerror = fail;
          reader.onloadend = () => {
            try {
              resolve(base64FromDataUrl(String(reader.result || "")));
            } catch (error) {
              reject(error);
            }
          };
          reader.readAsDataURL(file);
        }, fail);
      },
      fail,
    );
  });
}

export function imagePathToBase64(filePath: string) {
  const runtime = uni as typeof uni & {
    getFileSystemManager?: () => {
      readFile: (options: {
        filePath: string;
        encoding: "base64";
        success: (result: { data: string | ArrayBuffer }) => void;
        fail: (error: { errMsg?: string }) => void;
      }) => void;
    };
  };
  const appPlusReader = readAppPlusImageAsBase64(filePath);
  if (appPlusReader) return appPlusReader;
  if (runtime.getFileSystemManager) {
    return new Promise<string>((resolve, reject) => {
      runtime.getFileSystemManager?.().readFile({
        filePath,
        encoding: "base64",
        success: (result) => resolve(String(result.data)),
        fail: (error) =>
          reject(new RequestError(error.errMsg || "图片读取失败")),
      });
    });
  }
  if (typeof fetch !== "undefined" && typeof FileReader !== "undefined") {
    return fetch(filePath)
      .then((response) => response.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve(
                String(reader.result || "")
                  .split(",")
                  .pop() || "",
              );
            reader.onerror = () => reject(new RequestError("图片读取失败"));
            reader.readAsDataURL(blob);
          }),
      );
  }
  return Promise.reject(new RequestError("当前平台暂不支持图片读取"));
}
