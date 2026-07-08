<template>
  <view class="work-order-page page safe-page">
    <AppNavbar title="安检工单" />

    <view class="tabs-wrap">
      <view class="tabs">
        <button v-for="tab in tabs" :key="tab.value" class="tab-item" :class="{ active: activeStatus === tab.value }"
          @click="changeStatus(tab.value)">
          {{ tab.label }}
        </button>
      </view>
    </view>

    <view class="search-panel">
      <view class="search-box">
        <input id="keywordInput" v-model="searchKeyword" class="search-input" confirm-type="search"
          placeholder="请输入安检工单编号、名称" placeholder-class="placeholder" :focus="searchFocused" @confirm="handleSearch"
          @blur="searchFocused = false" />
        <button v-if="searchKeyword" class="clear-btn" @click="clearSearch">×</button>
      </view>
      <button class="search-btn" @click="handleSearch">
        <text>查询</text>
      </button>
      <view class="time-sort-btn" @click="toggleTimeSort">
        <image class="time-sort-icon" :src="timeSortIcon" mode="aspectFit" />
      </view>
    </view>

    <view v-if="store.error" class="error-card">
      <view class="error-title">工单加载失败</view>
      <view class="error-desc">{{ store.error }}</view>
      <button class="retry-btn" @click="store.refresh()">重试</button>
    </view>

    <view v-else class="order-list">
      <button v-for="order in orderViews" :key="order.id" class="order-card" @click="openOrder(order)">
        <view class="order-top">
          <text class="plan-name">{{ order.planName }}</text>
          <text class="status-pill" :class="order.statusClass">{{ order.statusText }}</text>
        </view>

        <view class="order-no">{{ order.orderNo }}</view>

        <view class="stats-grid">
          <view v-for="stat in order.stats" :key="stat.label" class="stat-item" :class="stat.type">
            <text class="stat-label">{{ stat.label }}</text>
            <text class="stat-value">
              <text class="stat-number">{{ stat.value }}</text>
              <text class="stat-unit">户</text>
            </text>
          </view>
        </view>

        <view class="time-row">
          <text class="time-label">派单时间：</text>
          <text class="time-value">{{ order.dispatchTime }}</text>
        </view>
        <view class="time-row">
          <text class="time-label">{{ order.finishLabel }}：</text>
          <text class="time-value">{{ order.finishTime }}</text>
        </view>
      </button>

      <view v-if="store.loading && !store.list.length" class="loading-text">工单加载中...</view>
      <AppEmpty v-if="!store.loading && !store.list.length" title="暂无工单" desc="调整状态或搜索条件后再试" show-retry
        @retry="store.refresh()" />
      <view v-if="store.loading && store.list.length" class="footer-text">加载更多...</view>
      <view v-if="store.finished && store.list.length" class="footer-text">没有更多工单了</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import AppEmpty from '@/components/AppEmpty.vue'
import AppNavbar from '@/components/AppNavbar.vue'
import { useWorkOrderStore } from '@/stores/workOrder'
import type { WorkOrder, WorkOrderCardView, WorkOrderPageStatus, WorkOrderTabOption } from '@/types/workOrder'
import { getDictsByTypes } from '@/utils/common'

 getDictsByTypes(['danger_type', 'danger_level'], true).then((dicts) => {
  console.log('dicts', dicts)
})



const store = useWorkOrderStore()
const searchKeyword = ref('')
const searchFocused = ref(false)
const timeSort = ref<1 | 2>(store.queryParams.sort || 2)

const tabs: WorkOrderTabOption[] = [
  { label: '全部', value: 'all' },
  { label: '待处理', value: 1 },
  { label: '进行中', value: 2 },
  { label: '已完成', value: 3 },
  { label: '已结束', value: 5 },
  { label: '已取消', value: 4 }
]

const activeStatus = computed<WorkOrderPageStatus>(() => store.queryParams.status || 'all')
const timeSortIcon = computed(() => (
  timeSort.value === 1 ? '/static/images/shijianzhengxu.png' : '/static/images/shijiandaoxu.png'
))
const orderViews = computed<WorkOrderCardView[]>(() => {
  return store.list.map(formatOrder)
})

onMounted(() => {
  searchKeyword.value = store.queryParams.workOrderNoOrName || ''
  timeSort.value = store.queryParams.sort || 2
  store.refresh()
})

onPullDownRefresh(async () => {
  await store.refresh()
  uni.stopPullDownRefresh()
})

onReachBottom(() => {
  store.loadMore()
})

function changeStatus(status: WorkOrderPageStatus) {
  if (activeStatus.value === status) return
  store.setStatus(status)
  store.refresh()
}

function handleSearch() {
  store.setKeyword(searchKeyword.value.trim())
  store.refresh()
}

function clearSearch() {
  searchKeyword.value = ''
  handleSearch()
  nextTick(() => {
    searchFocused.value = true
  })
}

function toggleTimeSort() {
  timeSort.value = timeSort.value === 1 ? 2 : 1
  store.setSort(timeSort.value)
  store.refresh()
}

function openOrder(order: WorkOrderCardView) {
  uni.navigateTo({
    url: `/pages/work-order/person-list?id=${encodeURIComponent(order.id)}&orderNo=${encodeURIComponent(order.orderNo)}&title=${encodeURIComponent(order.planName)}`
  })
}

function formatOrder(item: WorkOrder): WorkOrderCardView {
  const total = item.userCount || 0
  const completed = item.completedCount || 0
  const failed = item.failedCount || 0
  const canceled = item.canceledCount || 0
  const pending = Math.max(total - completed - failed - canceled, 0)

  return {
    id: String(item.id),
    orderNo: item.workOrderNo || item.orderNo || '--',
    planName: item.workOrderName || '--',
    statusText: getStatusText(item.status),
    statusClass: getStatusClass(item.status),
    stats: [
      { label: '总用户数', value: total, type: 'total' },
      { label: '已完成', value: completed, type: 'success' },
      { label: '失败', value: failed, type: 'danger' },
      { label: '待安检', value: pending, type: 'primary' }
    ],
    dispatchTime: item.assignTime || item.createTime || '--',
    finishLabel: getFinishLabel(item.status),
    finishTime: getFinishTime(item)
  }
}

function getStatusText(status: WorkOrder['status']) {
  const statusMap: Record<number, string> = {
    1: '未开始',
    2: '进行中',
    3: '已完成',
    4: '已取消',
    5: '已结束'
  }
  return typeof status === 'number' ? statusMap[status] || '--' : '--'
}

function getStatusClass(status: WorkOrder['status']) {
  const classMap: Record<number, string> = {
    1: 'is-pending',
    2: 'is-processing',
    3: 'is-completed',
    4: 'is-canceled',
    5: 'is-ended'
  }
  return typeof status === 'number' ? classMap[status] || 'is-pending' : 'is-pending'
}

function getFinishLabel(status: WorkOrder['status']) {
  if (status === 3) return '完成时间'
  if (status === 4) return '取消时间'
  if (status === 5) return '结束时间'
  return '计划完成日期'
}

function getFinishTime(item: WorkOrder) {
  if (item.status === 3) return item.completeTime || item.planCompleteTime || '—'
  if (item.status === 4 || item.status === 5) return item.cancelTime || '—'
  return item.planCompleteTime || '—'
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.work-order-page {
  padding: 0 0 32rpx;
}

.tabs-wrap {
  width: 100%;
}

.tabs {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  align-items: center;
  width: 100%;
  gap: 4rpx;
  padding: 6rpx;
  background: #eaf1ff;
}

.tab-item {
  @include flex-center;
  min-width: 0;
  height: 60rpx;
  padding: 0 2rpx;
  border-radius: 22rpx;
  color: $text-secondary;
  font-size: 23rpx;
  font-weight: 600;
}

.tab-item.active {
  color: $primary-color;
  background: #ffffff;
  box-shadow: 0 8rpx 18rpx rgba(22, 119, 255, 0.12);
}

.search-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120rpx 80rpx;
  gap: 16rpx;
  align-items: center;
  padding: 26rpx 24rpx 32rpx;

}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
  height: 80rpx;
  padding: 0 22rpx;
  border-radius: 20rpx;
  background: #ffffff;
  box-shadow: 0 6px 16px rgba(4, 46, 138, 0.06), 0 2px 4px rgba(4, 46, 138, 0.03);
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 80rpx;
  color: $text-main;
  font-size: 26rpx;
}

.placeholder {
  color: #b5bdcc;
}

.clear-btn {
  @include flex-center;
  flex-shrink: 0;
  width: 44rpx;
  height: 44rpx;
  color: $text-muted;
  font-size: 32rpx;
}

.search-btn {
  @include flex-center;
  gap: 6rpx;
  height: 72rpx;
  border-radius: 20rpx;
  color: $primary-color;
  font-size: 28rpx;
  font-weight: 700;
  background: #ffffff;
  // box-shadow: 0 10rpx 20rpx rgba(22, 119, 255, 0.16);
  box-shadow: 0 6px 16px rgba(4, 46, 138, 0.06), 0 2px 4px rgba(4, 46, 138, 0.03);
}

.time-sort-btn {
  @include flex-center;
  gap: 8rpx;
  width: 70rpx;
  height: 72rpx;
  border-radius: 20rpx;
  color: $primary-color;
  font-size: 24rpx;
  font-weight: 700;
  background: #fff;
  box-shadow: 0 6px 16px rgba(4, 46, 138, 0.06), 0 2px 4px rgba(4, 46, 138, 0.03);
  // box-shadow: 0 10rpx 20rpx rgba(22, 119, 255, 0.16);
}

.time-sort-icon {
  width: 40rpx;
  height: 40rpx;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  padding: 0 24rpx;
}

.order-card {
  width: 100%;
  padding: 24rpx 24rpx 26rpx;
  text-align: left;
  background: #ffffff;
  border-radius: $card-radius;
  box-shadow: $shadow-card;
}

.order-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.order-no {
  @include text-ellipsis;
  margin-top: 8rpx;
  color: #9aa8c5;
  font-size: 25rpx;
  font-weight: 600;
  line-height: 1.4;
}

.status-pill {
  @include flex-center;
  flex-shrink: 0;
  min-width: 116rpx;
  height: 60rpx;
  padding: 0 20rpx;
  border-radius: 40rpx;
  font-size: 26rpx;
  font-weight: 700;
}

.status-pill.is-pending,
.status-pill.is-processing {
  color: $primary-color;
  background: #dcecff;
}

.status-pill.is-completed {
  color: $success-color;
  background: #ddf8d6;
}

.status-pill.is-ended,
.status-pill.is-canceled {
  color: $text-secondary;
  background: #eef3fb;
}

.status-pill.is-danger {
  color: $error-color;
  background: #fff0f0;
}

.status-pill.is-warning {
  color: $warning-color;
  background: #fff4df;
}

.plan-name {
  @include text-ellipsis;
  flex: 1;
  min-width: 0;
  color: #001a4d;
  font-size: 34rpx;
  font-weight: 800;
  line-height: 1.35;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 28rpx;
  padding: 24rpx 0;
  border-top: 1rpx solid #edf1f6;
  border-bottom: 1rpx solid #edf1f6;
  background: #ffffff;
}

.stat-item {
  position: relative;
  min-width: 0;
  text-align: center;
}

.stat-item+.stat-item::before {
  position: absolute;
  top: 6rpx;
  bottom: 6rpx;
  left: 0;
  width: 1rpx;
  background: #edf1f6;
  content: '';
}

.stat-label,
.stat-value {
  display: block;
  line-height: 1.35;
}

.stat-label {
  color: #9aa8c5;
  font-size: 24rpx;
  font-weight: 700;
}

.stat-value {
  margin-top: 10rpx;
  color: #001a4d;
}

.stat-number {
  font-size: 36rpx;
  font-weight: 900;
}

.stat-unit {
  margin-left: 3rpx;
  color: #7da8db;
  font-size: 22rpx;
  font-weight: 700;
}

.stat-item.success .stat-number,
.stat-item.success .stat-unit {
  color: #02c987;
}

.stat-item.danger .stat-number,
.stat-item.danger .stat-unit {
  color: #ff4040;
}

.stat-item.primary .stat-number,
.stat-item.primary .stat-unit {
  color: #3f86ff;
}

.time-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 24rpx;
  font-size: 27rpx;
  line-height: 1.35;
}

.time-row+.time-row {
  margin-top: 18rpx;
}

.time-label {
  flex-shrink: 0;
  color: #9aa8c5;
  font-weight: 700;
}

.time-value {
  @include text-ellipsis;
  flex: 1;
  min-width: 0;
  color: #001a4d;
  font-weight: 600;
  text-align: right;
}

.loading-text,
.footer-text {
  padding: 32rpx 0;
  color: $text-secondary;
  font-size: 25rpx;
  text-align: center;
}

.error-card {
  margin: 0 10rpx;
  padding: 36rpx 28rpx;
  background: #ffffff;
  border-radius: $card-radius;
  box-shadow: $shadow-card;
}

.error-title {
  color: $error-color;
  font-size: 30rpx;
  font-weight: 700;
}

.error-desc {
  margin-top: 12rpx;
  color: $text-secondary;
  font-size: 25rpx;
}

.retry-btn {
  @include flex-center;
  width: 180rpx;
  height: 72rpx;
  margin-top: 24rpx;
  border-radius: 36rpx;
  color: #ffffff;
  font-size: 26rpx;
  background: $primary-color;
}
</style>
