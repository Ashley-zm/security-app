export type WorkOrderStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'todo'
  | 'abnormal'
  | 'timeout'

export interface WorkOrder {
  id: string
  orderNo: string
  userName: string
  userPhone: string
  accountNo: string
  address: string
  appointmentTime: string
  status: WorkOrderStatus
  statusName: string
  latitude?: number
  longitude?: number
  createTime: string
}

export interface WorkOrderQuery {
  status?: WorkOrderStatus | 'all' | ''
  keyword?: string
  pageNo: number
  pageSize: number
}

export interface WorkOrderListResult {
  list: WorkOrder[]
  total: number
}
