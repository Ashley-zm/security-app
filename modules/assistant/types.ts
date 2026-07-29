export interface AssistantAskParams {
  question: string;
  history?: AssistantConversationMessage[];
}
export interface AssistantConversationMessage {
  role: "user" | "assistant";
  content: string;
}
export interface AssistantAnswer {
  id: string;
  answer: string;
  checklist: string[];
  suggestions: string[];
  references: string[];
}
