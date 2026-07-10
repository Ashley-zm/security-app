
export interface WorkOrder {
  id: number | string
  workOrderNo?: string
  workOrderName?: string
  templateId?: number
  templateName?: string
  inspectionAreaId?: number
  inspectionAreaName?: string
  responsibleDeptId?: number
  responsibleDeptName?: string
  inspectorId?: number
  inspectorName?: string
  userCount?: number
  completedCount?: number
  failedCount?: number
  canceledCount?: number
  pendingCount?: number
  status: string
  assignStatus?: number
  assignTime?: string
  planCompleteTime?: string
  completeTime?: string
  cancelTime?: string

  orderNo?: string
  userName?: string
  userPhone?: string
  accountNo?: string
  address?: string
  appointmentTime?: string
  statusName?: string
  latitude?: number
  longitude?: number
  createTime?: string
}

export interface WorkOrderQuery {
  status?: string
  workOrderName?: string
  sort?: 1 | 2
  pageNum: number
  pageSize: number

  keyword?: string
  pageNo?: number
}

export interface WorkOrderListResult {
  list: WorkOrder[]
  total: number
}
export type WorkOrderStatType = 'total' | 'success' | 'danger' | 'primary'

export interface WorkOrderStatView {
  label: string
  value: number
  type: WorkOrderStatType
}

export interface WorkOrderCardView {
  id: string
  orderNo: string
  planName: string
  statusText: string
  statusClass: string
  stats: WorkOrderStatView[]
  dispatchTime: string
  finishLabel: string
  finishTime: string
}
export interface WorkOrderUser {
  id: number | string
  workOrderId: number | string
  planId?: number | string
  gasUserId?: number | string
  inspectionAreaId?: number | string
  inspectionAreaName?: string
  communityId?: number | string
  communityName?: string
  householdNo?: string
  householdName?: string
  userType?: string
  userAddress?: string
  mobilePhone?: string
  meterNo?: string
  meterStatus?: string
  gasUsageType?: string
  appointmentTime?: string | null
  inspectionStartTime?: string | null
  inspectionFinishTime?: string | null
  unableReason?: string | number | null
  inspectionResult?: string | number | null
  inspectionRecordId?: number | string | null
  finishTime?: string | null
  status: string | number
  remark?: string
}

export interface WorkOrderUserQuery {
  keyword?: string
  sort?: 1 | 2
  status?: string
  pageNum: number
  pageSize: number
}

export interface WorkOrderUserListResult {
  list: WorkOrderUser[]
  total: number
}

export interface WorkOrderUserDetail {
  id: number | string
  gasUserId?: number | string
  householdNo?: string
  householdName?: string
  userAddress?: string
  mobilePhone?: string
  meterNo?: string
  appointmentTime?: string | null
  status: string | number
}

export interface InspectionTemplateItem {
  id: number | string
  itemName?: string
  itemDesc?: string
  checkStandard?: string
  inputType?: string | number
  photoRule?: string | number
  maxPhotoCount?: number
  detectLabels?: Array<string | number>
  enabled?: number
}

export interface InspectionTemplateGroup {
  id: number | string
  groupName?: string
  itemList?: InspectionTemplateItem[]
}

export interface InspectionTemplate {
  id: number | string
  templateName?: string
  templateType?: string | number
  templateVersion?: string
  groupList?: InspectionTemplateGroup[]
}

export interface InspectionHistoryRecord {
  id: number | string
  recordNo?: string
  inspectionFinishTime?: string | null
  inspectorName?: string
  inspectionResult?: string | number | null
  dangerCount?: number | null
}

export interface WorkOrderUserDetailResult {
  workOrder: WorkOrder
  workOrderUser: WorkOrderUserDetail
  template?: InspectionTemplate
  historyList?: InspectionHistoryRecord[]
}
