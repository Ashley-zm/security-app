import type { WorkOrderListResult, WorkOrderQuery } from '@/types/workOrder'
import { request } from '@/utils/request'

export function getWorkOrderListApi(data: WorkOrderQuery) {
  return request<WorkOrderListResult, WorkOrderQuery>({
    url: '/api/work-orders',
    method: 'GET',
    data
  })
}

export function updateAppointmentTimeApi(id: string, appointmentTime: string) {
  return request<{ success: boolean }, { appointmentTime: string }>({
    url: `/api/work-orders/${id}/appointment-time`,
    method: 'POST',
    data: {
      appointmentTime
    }
  })
}
