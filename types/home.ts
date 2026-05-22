import type { WorkOrder } from './workOrder'

export interface HomeOverview {
  pendingCount: number
  completedCount: number
  warningCount: number
  unreadCount: number
  recentOrders: WorkOrder[]
}

export type QuickEntryIcon = 'assistant' | 'work-order' | 'scan' | 'message' | 'plugin'

export interface QuickEntry {
  title: string
  subtitle: string
  icon: QuickEntryIcon
  path: string
  highlight?: boolean
  badge?: string
}
