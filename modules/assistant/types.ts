export interface AssistantAskParams {
  question: string
}

export interface AssistantAnswer {
  id: string
  answer: string
  checklist: string[]
  suggestions: string[]
  references: string[]
}
