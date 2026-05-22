import type { ChangePasswordParams, LoginParams, LoginResult } from '@/types/auth'
import type { AssistantAnswer, AssistantAskParams } from '@/types/assistant'
import type { HomeOverview } from '@/types/home'
import type { WorkOrder, WorkOrderListResult, WorkOrderQuery, WorkOrderStatus } from '@/types/workOrder'

interface MockOptions<T = unknown> {
  url: string
  method: string
  data?: T
}

let workOrders: WorkOrder[] = [
  {
    id: '1',
    orderNo: 'WO-202505-0001',
    userName: '张伟',
    userPhone: '13812345678',
    accountNo: 'HH2025050001',
    address: '上海市浦东新区世纪大道100号',
    appointmentTime: '2025-05-16 09:30',
    status: 'pending',
    statusName: '待执行',
    latitude: 31.2304,
    longitude: 121.4737,
    createTime: '2025-05-15 10:00:00'
  },
  {
    id: '2',
    orderNo: 'WO-202505-0002',
    userName: '李女士',
    userPhone: '13912342345',
    accountNo: 'HH2025050002',
    address: '上海市黄浦区南京东路188号',
    appointmentTime: '2025-05-16 10:15',
    status: 'processing',
    statusName: '进行中',
    latitude: 31.2382,
    longitude: 121.4903,
    createTime: '2025-05-15 11:00:00'
  },
  {
    id: '3',
    orderNo: 'WO-202505-0003',
    userName: '王先生',
    userPhone: '13688886666',
    accountNo: 'HH2025050003',
    address: '上海市静安区南京西路1266号',
    appointmentTime: '2025-05-16 13:30',
    status: 'todo',
    statusName: '待处理',
    latitude: 31.2298,
    longitude: 121.4599,
    createTime: '2025-05-15 11:20:00'
  },
  {
    id: '4',
    orderNo: 'WO-202505-0004',
    userName: '赵敏',
    userPhone: '13700137000',
    accountNo: 'HH2025050004',
    address: '上海市徐汇区漕溪北路18号',
    appointmentTime: '2025-05-17 09:00',
    status: 'completed',
    statusName: '已完成',
    latitude: 31.1884,
    longitude: 121.4368,
    createTime: '2025-05-15 12:10:00'
  },
  {
    id: '5',
    orderNo: 'WO-202505-0005',
    userName: '陈阿姨',
    userPhone: '13512341234',
    accountNo: 'HH2025050005',
    address: '上海市长宁区延安西路889号',
    appointmentTime: '2025-05-17 10:30',
    status: 'abnormal',
    statusName: '异常',
    latitude: 31.2147,
    longitude: 121.4241,
    createTime: '2025-05-15 14:00:00'
  },
  {
    id: '6',
    orderNo: 'WO-202505-0006',
    userName: '刘先生',
    userPhone: '',
    accountNo: 'HH2025050006',
    address: '上海市杨浦区四平路1239号',
    appointmentTime: '2025-05-17 15:45',
    status: 'timeout',
    statusName: '超时',
    createTime: '2025-05-15 15:20:00'
  },
  {
    id: '7',
    orderNo: 'WO-202505-0007',
    userName: '周佳',
    userPhone: '15888889999',
    accountNo: 'HH2025050007',
    address: '上海市虹口区四川北路1688号',
    appointmentTime: '2025-05-18 09:20',
    status: 'pending',
    statusName: '待执行',
    latitude: 31.2632,
    longitude: 121.4848,
    createTime: '2025-05-15 16:00:00'
  },
  {
    id: '8',
    orderNo: 'WO-202505-0008',
    userName: '孙女士',
    userPhone: '15012345678',
    accountNo: 'HH2025050008',
    address: '上海市闵行区沪闵路6088号',
    appointmentTime: '2025-05-18 11:00',
    status: 'processing',
    statusName: '进行中',
    latitude: 31.111,
    longitude: 121.3817,
    createTime: '2025-05-15 17:00:00'
  }
]

function delay<T>(data: T, ms = 320): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), ms)
  })
}

function login(data?: LoginParams): Promise<LoginResult> {
  if (!data?.mobile || !data?.password) {
    return Promise.reject(new Error('手机号或密码不能为空'))
  }

  if (data.password.length < 3) {
    return Promise.reject(new Error('密码错误，请重新输入'))
  }

  return delay({
    token: `mock-token-${Date.now()}`,
    userInfo: {
      id: 'u-1001',
      name: '安检员王明',
      mobile: data.mobile,
      employeeNo: 'AJ20250515',
      roleName: '燃气安检员'
    }
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

function queryWorkOrders(data?: WorkOrderQuery): Promise<WorkOrderListResult> {
  const params = {
    pageNo: 1,
    pageSize: 10,
    status: '',
    keyword: '',
    ...data
  }
  const keyword = (params.keyword || '').trim().toLowerCase()
  const status = params.status as WorkOrderStatus | 'all' | ''

  let list = [...workOrders]
  if (status && status !== 'all') {
    list = list.filter((item) => item.status === status)
  }
  if (keyword) {
    list = list.filter((item) => {
      return [item.userName, item.userPhone, item.accountNo].some((field) => field.toLowerCase().includes(keyword))
    })
  }

  const total = list.length
  const start = (params.pageNo - 1) * params.pageSize
  const end = start + params.pageSize

  return delay({
    list: list.slice(start, end),
    total
  })
}

function updateAppointmentTime(url: string, data?: { appointmentTime: string }) {
  const id = url.match(/\/api\/work-orders\/(.+)\/appointment-time/)?.[1]
  if (!id || !data?.appointmentTime) {
    return Promise.reject(new Error('预约时间不能为空'))
  }

  workOrders = workOrders.map((item) => {
    if (item.id !== id) return item
    return {
      ...item,
      appointmentTime: data.appointmentTime
    }
  })

  return delay({ success: true })
}

function getHomeOverview(): Promise<HomeOverview> {
  return delay({
    pendingCount: workOrders.filter((item) => item.status === 'pending').length,
    completedCount: workOrders.filter((item) => item.status === 'completed').length,
    warningCount: workOrders.filter((item) => ['abnormal', 'timeout'].includes(item.status)).length,
    unreadCount: 3,
    recentOrders: workOrders.slice(0, 5)
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

  if (url === '/api/auth/login' && method === 'POST') {
    return login(data as LoginParams) as Promise<T>
  }

  if (url === '/api/auth/change-password' && method === 'POST') {
    return changePassword(data as ChangePasswordParams) as Promise<T>
  }

  if (url === '/api/work-orders' && method === 'GET') {
    return queryWorkOrders(data as WorkOrderQuery) as Promise<T>
  }

  if (/^\/api\/work-orders\/.+\/appointment-time$/.test(url) && method === 'POST') {
    return updateAppointmentTime(url, data as { appointmentTime: string }) as Promise<T>
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
