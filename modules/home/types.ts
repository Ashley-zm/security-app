import type { WorkOrder } from "@/modules/work-order/types";

export interface HomeOverview {
  pendingCount: number;
  completedCount: number;
  warningCount: number;
  unreadCount: number;
  recentOrders: WorkOrder[];
}

export type QuickEntryIcon =
  | "assistant"
  | "work-order"
  | "scan"
  | "message"
  | "plugin"
  | "audio";

export interface QuickEntry {
  title: string;
  subtitle: string;
  icon: QuickEntryIcon;
  path: string;
  highlight?: boolean;
  badge?: string;
}

export interface HomeStatistics {
  todayPendingCount: number; // 今日待检查数量
  highRiskUserCount: number; // 高风险用户数量
  inspectionCommunityCount: number; // 今日安检小区数量
  inspectionUserCount: number; // 今日总安检户数
}
