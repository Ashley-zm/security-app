import { defineStore } from 'pinia'
import { getWorkOrderListApi, updateAppointmentTimeApi } from '@/api/workOrder'
import type {  WorkOrder, WorkOrderQuery } from '@/types/workOrder'

interface WorkOrderState {
  list: WorkOrder[]
  total: number
  loading: boolean
  refreshing: boolean
  finished: boolean
  error: string
  queryParams: WorkOrderQuery
}
export const useWorkOrderStore = defineStore('workOrder', {
  state: (): WorkOrderState => ({
    list: [],
    total: 0,
    loading: false,
    refreshing: false,
    finished: false,
    error: '',
    queryParams: {
      status: '',
      workOrderName: '',
      sort: 2,
      pageNum: 1,
      pageNo: 1,
      pageSize: 10
    }
  }),
  actions: {
    setStatus(status: string) {
      this.queryParams.status = status === 'all' ? '' : status
      this.queryParams.pageNum = 1
      this.queryParams.pageNo = 1
    },
    setKeyword(keyword: string) {
      this.queryParams.workOrderName = keyword
      this.queryParams.keyword = keyword
      this.queryParams.pageNum = 1
      this.queryParams.pageNo = 1
    },
    setSort(sort: 1 | 2) {
      this.queryParams.sort = sort
      this.queryParams.pageNum = 1
      this.queryParams.pageNo = 1
    },
    async fetchList(reset = false) {
      if (this.loading) return
      this.loading = true
      this.error = ''
      try {
        const result = await getWorkOrderListApi({ ...this.queryParams })
        this.total = result.total
        this.list = reset ? result.list : [...this.list, ...result.list]
        this.finished = this.list.length >= result.total
      } catch (error) {
        this.error = error instanceof Error ? error.message : '工单加载失败'
      } finally {
        this.loading = false
        this.refreshing = false
      }
    },
    async refresh() {
      this.refreshing = true
      this.queryParams.pageNum = 1
      this.queryParams.pageNo = 1
      this.finished = false
      await this.fetchList(true)
    },
    async loadMore() {
      if (this.loading || this.finished) return
      this.queryParams.pageNum += 1
      this.queryParams.pageNo = this.queryParams.pageNum
      await this.fetchList(false)
    },
    async updateAppointmentTime(id: string, appointmentTime: string) {
      const result = await updateAppointmentTimeApi(id, appointmentTime)
      if (result.success) {
        await this.refresh()
      }
      return result
    }
  }
})