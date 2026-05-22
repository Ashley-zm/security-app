import { request } from '@/utils/request'
import type { AssistantAnswer, AssistantAskParams } from '@/types/assistant'

export function askAssistantApi(data: AssistantAskParams) {
  return request<AssistantAnswer, AssistantAskParams>({
    url: '/api/assistant/ask',
    method: 'POST',
    data
  })
}
