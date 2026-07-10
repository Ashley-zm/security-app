import type { ChangePasswordParams } from '@/modules/auth/types'
import type { AssistantAnswer, AssistantAskParams } from '@/modules/assistant/types'
import type { HomeOverview } from '@/modules/home/types'

interface MockOptions<T = unknown> {
  url: string
  method: string
  data?: T
}

function delay<T>(data: T, ms = 320): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), ms)
  })
}

function changePassword(data?: ChangePasswordParams) {
  if (!data?.oldPassword || !data?.newPassword) {
    return Promise.reject(new Error('原密码和新密码不能为空'))
  }

  if (data.oldPassword.length < 3) {
    return Promise.reject(new Error('原密码错误，请重新输入'))
  }

  if (data.newPassword.length < 6 || data.newPassword.length > 20) {
    return Promise.reject(new Error('新密码长度需为 6-20 位'))
  }

  if (data.oldPassword === data.newPassword) {
    return Promise.reject(new Error('新密码不能与原密码相同'))
  }

  return delay({ success: true })
}

function getHomeOverview(): Promise<HomeOverview> {
  return delay({
    pendingCount: 0,
    completedCount: 0,
    warningCount: 0,
    unreadCount: 3,
    recentOrders: []
  })
}

const assistantKnowledge: Array<{
  keywords: string[]
  answer: string
  checklist: string[]
  suggestions: string[]
  references: string[]
}> = [
  {
    keywords: ['流程', '标准', '入户', '安检'],
    answer: '入户安检建议按“核验身份、确认环境、检查设施、记录结果、用户确认”的顺序执行。先确认用户与地址信息，再检查表具、阀门、软管、灶具连接、通风环境和报警装置，发现隐患时同步拍照并录入工单。',
    checklist: ['出示工牌并核对工单地址', '检查阀门、软管、接口和燃具状态', '完成现场拍照、隐患分类和用户签字'],
    suggestions: ['燃气泄漏如何处置', '阀门老化检查要点'],
    references: ['入户安检作业规范', '居民燃气设施检查记录要求']
  },
  {
    keywords: ['泄漏', '漏气', '异味', '报警'],
    answer: '疑似燃气泄漏时，优先保障现场安全。立即关闭表前阀或入户总阀，打开门窗通风，禁止开关电器、拨打室内电话或产生明火。人员撤离至安全区域后，再联系抢修或调度，并在工单中记录现场情况。',
    checklist: ['关闭阀门并疏散人员', '开窗通风，禁止明火和电气操作', '到安全区域联系抢修并上报异常'],
    suggestions: ['燃气泄漏检测注意事项', '异常工单如何记录'],
    references: ['燃气泄漏现场处置规范', '异常事件上报流程']
  },
  {
    keywords: ['阀门', '老化', '锈蚀', '关闭'],
    answer: '阀门检查重点看启闭是否顺畅、手柄是否松动、阀体是否锈蚀、接口处是否有泄漏痕迹。发现关闭不严、锈蚀严重、手柄缺失或用户无法正常操作时，应记录为隐患并建议更换。',
    checklist: ['观察阀体锈蚀、变形和接口状态', '轻操作确认启闭顺畅，不强行扳动', '对异常部位拍照并标注隐患等级'],
    suggestions: ['入户安检标准流程', '用户拒绝整改如何处理'],
    references: ['户内阀门检查要点', '隐患分级记录口径']
  },
  {
    keywords: ['不在家', '无人', '联系不上', '预约'],
    answer: '用户不在家时，先通过工单电话联系用户，确认是否可改约。无法联系时记录到访时间、现场照片或门牌信息，工单状态选择待处理或改约，并备注联系结果，避免直接关闭任务。',
    checklist: ['至少按要求完成电话联系', '记录到访凭证和联系结果', '填写改约时间或待处理原因'],
    suggestions: ['工单超时如何处理', '如何修改预约时间'],
    references: ['预约改期处理流程', '到访失败记录要求']
  },
  {
    keywords: ['软管', '胶管', '连接管', '超期'],
    answer: '软管检查需要确认是否超期、老化开裂、过长、穿墙、被压折或靠近热源。接口处应连接牢固并配有管卡。发现非金属软管老化、无管卡或连接不规范时，应提示用户整改。',
    checklist: ['查看软管生产日期和外观状态', '确认长度、走向和热源距离', '检查两端接口和管卡固定情况'],
    suggestions: ['阀门老化检查要点', '异常工单如何记录'],
    references: ['户内连接管检查要求', '燃具连接安全提示']
  }
]

function askAssistant(data?: AssistantAskParams): Promise<AssistantAnswer> {
  const question = data?.question?.trim()
  if (!question) {
    return Promise.reject(new Error('请输入需要咨询的问题'))
  }

  const matched =
    assistantKnowledge.find((item) => item.keywords.some((keyword) => question.includes(keyword))) ||
    assistantKnowledge[0]

  return delay({
    id: `assistant-${Date.now()}`,
    answer: matched.answer,
    checklist: matched.checklist,
    suggestions: matched.suggestions,
    references: matched.references
  })
}

export function mockRequest<T>(options: MockOptions): Promise<T> {
  const { url, method, data } = options

  if (url === '/api/auth/change-password' && method === 'POST') {
    return changePassword(data as ChangePasswordParams) as Promise<T>
  }


  if (url === '/api/home/overview' && method === 'GET') {
    return getHomeOverview() as Promise<T>
  }

  if (url === '/api/message/unread-count' && method === 'GET') {
    return delay({ count: 3 }) as Promise<T>
  }

  if (url === '/api/assistant/ask' && method === 'POST') {
    return askAssistant(data as AssistantAskParams) as Promise<T>
  }

  return Promise.reject(new Error(`Mock接口不存在：${method} ${url}`))
}
