import type {
  WorkOrderListResult,
  WorkOrderQuery,
  WorkOrderUserDetailResult,
  WorkOrderUserListResult,
  WorkOrderUserAppointmentPayload,
  WorkOrderUserQuery,
  DeviceItem,
} from "@/modules/work-order/types";
import { request } from "@/utils/request";

// 获取工单列表
export function getWorkOrderListApi(data: WorkOrderQuery) {
  return request<WorkOrderListResult, WorkOrderQuery>({
    url: "/inspection/app/workOrder/v0.2/list",
    method: "GET",
    data,
  });
}

// 更新工单预约时间
export function updateAppointmentTimeApi(id: string, appointmentTime: string) {
  return request<{ success: boolean }, { appointmentTime: string }>({
    url: `/api/work-orders/${id}/appointment-time`,
    method: "POST",
    data: {
      appointmentTime,
    },
  });
}
// 查询工单下安检用户列表
export function getWorkOrderUserListApi(id: string, data: WorkOrderUserQuery) {
  return request<WorkOrderUserListResult, WorkOrderUserQuery>({
    url: `/inspection/app/workOrder/v0.2/${id}/users/list`,
    method: "GET",
    data,
  });
}
// 查询工单下安检用户详情
export function getWorkOrderUserDetailApi(workOrderUserId: string) {
  return request<WorkOrderUserDetailResult>({
    url: `/inspection/app/workOrder/v0.2/users/${workOrderUserId}/detail`,
    method: "GET",
  });
}
// 更新工单下安检用户预约时间
export function updateWorkOrderUserAppointmentApi(
  workOrderUserId: string,
  appointmentTime: string,
) {
  return request<void, WorkOrderUserAppointmentPayload>({
    url: `/inspection/app/workOrder/v0.2/users/${workOrderUserId}/appointment`,
    method: "POST",
    data: {
      workOrderUserId,
      appointmentTime,
    },
  });
}
// 查询APP端单条设备详情
export function getDeviceDetailApi(workOrderUserId: string, deviceId: string) {
  return request<DeviceItem>({
    url: `/inspection/app/workOrder/v0.2/users/${workOrderUserId}/devices/${deviceId}`,
    method: "GET",
  });
}
// 新增APP端用户设备信息
export function addDeviceApi(workOrderUserId: string, data: DeviceItem) {
  return request<void, DeviceItem>({
    url: `/inspection/app/workOrder/v0.2/users/${workOrderUserId}/devices`,
    method: "POST",
    data,
  });
}
// 更新APP端用户设备信息
export function updateDeviceApi(workOrderUserId: string, data: DeviceItem) {
  return request<void, DeviceItem>({
    url: `/inspection/app/workOrder/v0.2/users/${workOrderUserId}/devices/${data.id}/edit`,
    method: "POST",
    data,
  });
}
// 删除APP端用户设备信息
export function deleteDeviceApi(workOrderUserId: string, deviceId: string) {
  return request<void, DeviceItem>({
    url: `/inspection/app/workOrder/v0.2/users/${workOrderUserId}/devices/${deviceId}/delete`,
    method: "POST",
  });
}
