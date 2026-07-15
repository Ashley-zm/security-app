import { defineStore } from 'pinia'
import type { WorkOrderUserDetailResult } from '@/modules/work-order/types'

export const useInspectionStore = defineStore('inspection', {
  state: () => ({ detail: null as WorkOrderUserDetailResult | null }),
  actions: {
    setDetail(detail: WorkOrderUserDetailResult) { this.detail = detail },
    clear() { this.detail = null }
  }
})
