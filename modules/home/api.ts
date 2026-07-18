import type { HomeOverview, HomeStatistics } from "@/modules/home/types";
import { request } from "@/utils/request";

export function getHomeOverviewApi() {
  return request<HomeOverview>({
    url: "/api/home/overview",
    method: "GET",
  });
}
// 首页统计
export function getHomeStatisticsApi(data: { userId: string }) {
  return request<HomeStatistics>({
    url: "/inspection/app/workOrder/v0.2/statistics",
    method: "POST",
    data,
  });
}
