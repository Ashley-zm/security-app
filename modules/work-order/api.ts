import type {
  WorkOrderListResult,
  WorkOrderQuery,
  WorkOrderUserDetailResult,
  WorkOrderUserListResult,
  WorkOrderUserAppointmentPayload,
  WorkOrderUserQuery
} from '@/modules/work-order/types'
import { request } from '@/utils/request'

// 获取工单列表
export function getWorkOrderListApi(data: WorkOrderQuery) {
  return request<WorkOrderListResult, WorkOrderQuery>({
    url: '/inspection/app/workOrder/v0.2/list',
    method: 'GET',
    data
  })
}

// 更新工单预约时间
export function updateAppointmentTimeApi(id: string, appointmentTime: string) {
  return request<{ success: boolean }, { appointmentTime: string }>({
    url: `/api/work-orders/${id}/appointment-time`,
    method: 'POST',
    data: {
      appointmentTime
    }
  })
}
// 查询工单下安检用户列表
export function getWorkOrderUserListApi(id: string | number, data: WorkOrderUserQuery) {
  return request<WorkOrderUserListResult, WorkOrderUserQuery>({
    url: `/inspection/app/workOrder/v0.2/${id}/users/list`,
    method: 'GET',
    data
  })
}

// 设置单户预约时间

export function getWorkOrderUserDetailApi(workOrderUserId: string | number) {
  return request<WorkOrderUserDetailResult>({
    url: `/inspection/app/workOrder/v0.2/users/${workOrderUserId}/detail`,
    method: 'GET'
  })
}


export function updateWorkOrderUserAppointmentApi(workOrderUserId: string | number, appointmentTime: string) {
  return request<void, WorkOrderUserAppointmentPayload>({
    url: `/inspection/app/workOrder/v0.2/users/${workOrderUserId}/appointment`,
    method: 'POST',
    data: {
      workOrderUserId,
      appointmentTime
    }
  })
}
