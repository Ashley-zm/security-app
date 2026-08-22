export type AssistantRole = "user" | "assistant";

export interface AssistantAgent {
  id: string;
  data: { id?: string; name?: string; [key: string]: unknown };
  updated_at?: string;
  created_at?: string;
  editable?: boolean;
}

export interface AssistantCredential {
  id: string;
  data: {
    id?: string;
    name?: string;
    type: string;
    base_url?: string | null;
    [key: string]: unknown;
  };
  editable?: boolean;
}

export interface AssistantModel {
  type: string;
  name: string;
  display_name?: string;
  input_types?: string[];
  [key: string]: unknown;
}

export interface AssistantModelConfig {
  type: string;
  credential_id: string;
  model: string;
  parameters: Record<string, unknown>;
}

export interface AssistantKnowledgeBase {
  id: string;
  name?: string;
  [key: string]: unknown;
}

export interface AssistantKnowledgeConfig {
  knowledge_base_ids: string[];
  parameters: {
    mode: "agentic" | "static";
    [key: string]: unknown;
  };
}

export interface AssistantTextContent {
  id?: string;
  type: "text";
  text: string;
  created_at?: string;
  finished_at?: string;
}

export interface AssistantDataContent {
  id?: string;
  type: "data";
  source:
    | { type: "base64"; media_type: string; data: string }
    | { type: "url"; media_type?: string; url: string };
  name?: string;
  created_at?: string;
  finished_at?: string;
}

export interface AssistantHintContent {
  id?: string;
  type: "hint";
  hint: string;
  created_at?: string;
  finished_at?: string;
  [key: string]: unknown;
}

export type AssistantContent =
  | AssistantTextContent
  | AssistantDataContent
  | AssistantHintContent
  | { type: string; [key: string]: unknown };

export interface AssistantMessage {
  id: string;
  name?: string;
  role: AssistantRole;
  content: AssistantContent[];
  metadata?: Record<string, unknown>;
  created_at?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  } | null;
  finished_at?: string | null;
  finished_reason?: string | null;
  error?: { message?: string; [key: string]: unknown } | null;
}

export interface AssistantSessionState {
  session_id: string;
  summary?: string;
  context?: AssistantMessage[];
  [key: string]: unknown;
}

export interface AssistantSession {
  id: string;
  agent_id: string;
  updated_at?: string;
  created_at?: string;
  config: {
    name?: string;
    workspace_id?: string;
    chat_model_config?: AssistantModelConfig;
    knowledge_config?: AssistantKnowledgeConfig | null;
    [key: string]: unknown;
  };
  state: AssistantSessionState;
  [key: string]: unknown;
}

export interface AssistantSessionItem {
  session: AssistantSession;
  is_running: boolean;
}

export interface AssistantImageDraft {
  id: string;
  path: string;
  name: string;
  mediaType: string;
  base64: string;
}

export interface AssistantSendMessageParams {
  agentId: string;
  sessionId: string;
  text?: string;
  images?: AssistantImageDraft[];
}

export interface AssistantStreamEvent {
  id?: string;
  type?: string;
  session_id?: string;
  reply_id?: string;
  block_id?: string;
  tool_call_id?: string;
  tool_call_name?: string;
  model_name?: string;
  media_type?: string;
  data?: string;
  url?: string;
  state?: string;
  input_tokens?: number;
  output_tokens?: number;
  name?: string;
  title?: string;
  first_level_title?: string;
  table_title?: string;
  value?: Record<string, unknown>;
  tool_calls?: Array<Record<string, unknown>>;
  text?: string;
  delta?: string | { text?: string; content?: string };
  content?: string | AssistantContent[];
  finished_reason?: string;
  error?: { message?: string; [key: string]: unknown };
  [key: string]: unknown;
}

export interface AssistantStreamMedia {
  id: string;
  mediaType: string;
  data?: string;
  url?: string;
}

export interface AssistantStreamSnapshot {
  replyId?: string;
  text: string;
  thinking: string;
  tableTitle?: string;
  media: AssistantStreamMedia[];
}
export interface AssistantStreamResult extends AssistantStreamSnapshot {
  replyId?: string;
  text: string;
  finishedReason?: string;
}

/**
 * 兼容仍由通用 mock 层引用的旧助手类型。
 * 新 Agent 页面不再使用这两个结构。
 */
export interface AssistantAskParams {
  question: string;
  history?: Array<{
    role: AssistantRole;
    content: string;
  }>;
}

export interface AssistantAnswer {
  id: string;
  answer: string;
  checklist: string[];
  suggestions: string[];
  references: string[];
}
