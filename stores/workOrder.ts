import { defineStore } from 'pinia'
import { getWorkOrderListApi, updateAppointmentTimeApi } from '@/api/workOrder'
import type { WorkOrder, WorkOrderQuery, WorkOrderStatus } from '@/types/workOrder'

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
      status: 'pending',
      keyword: '',
      pageNo: 1,
      pageSize: 6
    }
  }),
  actions: {
    setStatus(status: WorkOrderStatus | 'all') {
      this.queryParams.status = status
      this.queryParams.pageNo = 1
    },
    setKeyword(keyword: string) {
      this.queryParams.keyword = keyword
      this.queryParams.pageNo = 1
    },
    async fetchList(reset = false) {
      if (this.loading) return
      this.loading = true
      this.error = ''

      try {
        const params = {
          ...this.queryParams
        }
        const result = await getWorkOrderListApi(params)
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
      this.queryParams.pageNo = 1
      this.finished = false
      await this.fetchList(true)
    },
    async loadMore() {
      if (this.loading || this.finished) return
      this.queryParams.pageNo += 1
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
