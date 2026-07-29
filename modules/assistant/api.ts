import { RequestError } from "@/utils/request";
import type {
  AssistantAnswer,
  AssistantAskParams,
} from "@/modules/assistant/types";

interface StreamChunk {
  id?: string;
  choices?: Array<{
    delta?: { content?: string };
    finish_reason?: string | null;
  }>;
  error?: { message?: string };
}
const API_BASE_URL = (
  import.meta.env.VITE_ASSISTANT_API_BASE_URL || "https://code.rayinai.com/v1"
).replace(/\/$/, "");
const API_KEY = import.meta.env.VITE_ASSISTANT_API_KEY || "";
const MODEL = import.meta.env.VITE_ASSISTANT_MODEL || "gpt-5.6-terra";
const SYSTEM_PROMPT = `你是燃气入户安检助手，面向一线安检人员提供准确、清晰、可执行的中文建议。严格返回 JSON 对象，不使用 Markdown 代码块：{"answer":"核心答复","checklist":["现场操作项"],"suggestions":["后续追问"],"references":["规范或安全提示"]}。紧急风险优先撤离、避免操作电器和产生火花、确保安全时关闭气源并联系当地抢险部门；不虚构法规，不指导超资质拆装维修。`;
function list(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" && Boolean(item.trim()),
      )
    : [];
}
function parse(content: string, id?: string): AssistantAnswer {
  const text = content.trim();
  const json = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const data = JSON.parse(json) as Partial<AssistantAnswer>;
    return {
      id: id || `assistant-${Date.now()}`,
      answer:
        typeof data.answer === "string" && data.answer.trim()
          ? data.answer.trim()
          : text,
      checklist: list(data.checklist),
      suggestions: list(data.suggestions),
      references: list(data.references),
    };
  } catch {
    return {
      id: id || `assistant-${Date.now()}`,
      answer: text || "模型未返回有效内容，请重新提问。",
      checklist: [],
      suggestions: [],
      references: [],
    };
  }
}
function answerPreview(content: string) {
  const match = /"answer"\s*:\s*"/.exec(content);
  if (!match) return "";
  let result = "";
  let escaped = false;
  for (const char of content.slice(match.index + match[0].length)) {
    if (escaped) {
      result += char === "n" ? "\n" : 
      char === "t" ? "\t" : char;
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') break;
    result += char;
  }
  return result;
}
export function askAssistantStreamApi(
  data: AssistantAskParams,
  onDelta: (content: string) => void,
) {
  if (!API_KEY)
    return Promise.reject(
      new RequestError(
        "未配置安检助手 API Key，请检查 VITE_ASSISTANT_API_KEY。",
      ),
    );
  return new Promise<AssistantAnswer>((resolve, reject) => {
    let buffer = "";
    let content = "";
    let responseId = "";
    let chunkReceived = false;
    const consumePayload = (payload: string) => {
      if (!payload || payload === "[DONE]") return;
      try {
        const chunk = JSON.parse(payload) as StreamChunk;
        if (chunk.error?.message) throw new RequestError(chunk.error.message);
        responseId ||= chunk.id || "";
        const delta = chunk.choices?.[0]?.delta?.content || "";
        console.log("delta", delta);

        if (delta) {
          content += delta;
          onDelta(answerPreview(content) || content);
        }
      } catch (error) {
        if (error instanceof RequestError) reject(error);
      }
    };
    const consume = (text: string) => {
      buffer += text;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";
      for (const line of lines) {
        const normalizedLine = line.trim();
        if (!normalizedLine) continue;
        const payload = normalizedLine.startsWith("data:")
          ? normalizedLine.slice(5).trim()
          : normalizedLine;
        if (payload.startsWith("{") || payload === "[DONE]")
          consumePayload(payload);
      }
    };
    const renderTypewriter = async (text: string) => {
      const step = text.length > 300 ? 4 : text.length > 120 ? 2 : 1;
      for (let index = step; index < text.length; index += step) {
        onDelta(text.slice(0, index));
        await new Promise((done) => setTimeout(done, 16));
      }
      onDelta(text);
    };
    const task = uni.request({
      url: `${API_BASE_URL}/chat/completions`,
      method: "POST",
      timeout: 60000,
      enableChunked: true,
      header: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      data: {
        model: MODEL,
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...(data.history || [])
            .filter((item) => item.content.trim())
            .slice(-10),
          { role: "user", content: data.question.trim() },
        ],
      },
      success: async (res) => {
        consume("\n");
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(
            new RequestError(`请求失败（${res.statusCode}）`, {
              statusCode: res.statusCode,
              response: res.data,
            }),
          );
          return;
        }
        if (!content && typeof res.data === "string") {
          consume(`${res.data}\n`);
          if (content && !chunkReceived)
            await renderTypewriter(answerPreview(content) || content);
        }
        if (!content) {
          reject(new RequestError("模型未返回有效内容，请稍后重试。"));
          return;
        }
        resolve(parse(content, responseId));
      },
      fail: (error) =>
        reject(new RequestError(error.errMsg || "流式请求失败，请稍后重试。")),
    });
    const streamTask = task as typeof task & {
      onChunkReceived?: (
        callback: (event: { data: ArrayBuffer }) => void,
      ) => void;
    };
    streamTask.onChunkReceived?.((event) =>
      consume(new TextDecoder("utf-8").decode(event.data, { stream: true })),
    );
  });
}
