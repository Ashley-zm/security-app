<template>
  <view class="work-order-page page safe-page">
    <AppNavbar title="安检工单" show-back right-icon="⌕" @right-click="focusSearch" />

    <view class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: activeStatus === tab.value }"
        @click="changeStatus(tab.value)"
      >
        {{ tab.label }}
      </button>
    </view>

    <view class="search-panel">
      <view class="search-box">
        <text class="search-icon">⌕</text>
        <input
          id="keywordInput"
          v-model="searchKeyword"
          class="search-input"
          confirm-type="search"
          placeholder="支持用户名 / 手机号 / 户号模糊查询"
          placeholder-class="placeholder"
          :focus="searchFocused"
          @confirm="handleSearch"
          @input="handleInput"
          @blur="searchFocused = false"
        />
        <button v-if="searchKeyword" class="clear-btn" @click="clearSearch">×</button>
      </view>
      <button class="filter-btn" @click="openFilter">筛选</button>
    </view>

    <view v-if="store.error" class="error-card">
      <view class="error-title">工单加载失败</view>
      <view class="error-desc">{{ store.error }}</view>
      <button class="retry-btn" @click="store.refresh()">重试</button>
    </view>

    <view v-else class="order-list">
      <WorkOrderCard
        v-for="item in store.list"
        :key="item.id"
        :item="item"
        @call="handleCall"
        @change-time="openChangeTime"
        @navigate="handleNavigate"
      />

      <view v-if="store.loading && !store.list.length" class="loading-text">工单加载中...</view>
      <AppEmpty
        v-if="!store.loading && !store.list.length"
        title="暂无工单"
        desc="调整状态或搜索条件后再试"
        show-retry
        @retry="store.refresh()"
      />
      <view v-if="store.loading && store.list.length" class="footer-text">加载更多...</view>
      <view v-if="store.finished && store.list.length" class="footer-text">没有更多工单了</view>
    </view>

    <view v-if="popupVisible" class="popup-mask" @click="closePopup">
      <view class="popup" @click.stop>
        <view class="popup-title">修改预约时间</view>
        <view class="current-time">
          <text class="label">当前预约时间</text>
          <text class="value">{{ currentOrder?.appointmentTime }}</text>
        </view>

        <view class="picker-row">
          <picker mode="date" :value="appointmentDate" @change="handleDateChange">
            <view class="picker-field">
              <text>日期</text>
              <text>{{ appointmentDate || '请选择日期' }}</text>
            </view>
          </picker>
          <picker mode="time" :value="appointmentTime" @change="handleTimeChange">
            <view class="picker-field">
              <text>时间</text>
              <text>{{ appointmentTime || '请选择时间' }}</text>
            </view>
          </picker>
        </view>

        <view class="popup-actions">
          <button class="popup-btn cancel" @click="closePopup">取消</button>
          <button class="popup-btn confirm" :disabled="updating" @click="confirmChangeTime">
            {{ updating ? '提交中...' : '确认修改' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import AppEmpty from '@/components/AppEmpty.vue'
import AppNavbar from '@/components/AppNavbar.vue'
import WorkOrderCard from '@/components/WorkOrderCard.vue'
import { useWorkOrderStore } from '@/stores/workOrder'
import type { WorkOrder, WorkOrderStatus } from '@/types/workOrder'

type TabValue = WorkOrderStatus | 'all'

const store = useWorkOrderStore()
const searchKeyword = ref('')
const searchFocused = ref(false)
const popupVisible = ref(false)
const currentOrder = ref<WorkOrder | null>(null)
const appointmentDate = ref('')
const appointmentTime = ref('')
const updating = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

const tabs: Array<{ label: string; value: TabValue }> = [
  { label: '待执行', value: 'pending' },
  { label: '进行中', value: 'processing' },
  { label: '已完成', value: 'completed' },
  { label: '全部', value: 'all' }
]

const activeStatus = computed(() => store.queryParams.status || 'all')

onMounted(() => {
  searchKeyword.value = store.queryParams.keyword || ''
  store.refresh()
})

onPullDownRefresh(async () => {
  await store.refresh()
  uni.stopPullDownRefresh()
})

onReachBottom(() => {
  store.loadMore()
})

function focusSearch() {
  searchFocused.value = false
  nextTick(() => {
    searchFocused.value = true
  })
}

function changeStatus(status: TabValue) {
  if (activeStatus.value === status) return
  store.setStatus(status)
  store.refresh()
}

function handleInput() {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    handleSearch()
  }, 300)
}

function handleSearch() {
  store.setKeyword(searchKeyword.value.trim())
  store.refresh()
}

function clearSearch() {
  searchKeyword.value = ''
  handleSearch()
}

function openFilter() {
  uni.showActionSheet({
    itemList: tabs.map((tab) => tab.label),
    success: (res) => {
      const selected = tabs[res.tapIndex]
      if (selected) {
        changeStatus(selected.value)
      }
    }
  })
}

function handleCall(item: WorkOrder) {
  if (!item.userPhone) {
    uni.showToast({
      title: '用户手机号为空',
      icon: 'none'
    })
    return
  }

  uni.makePhoneCall({
    phoneNumber: item.userPhone
  })
}

function handleNavigate(item: WorkOrder) {
  if (!item.latitude || !item.longitude) {
    uni.showToast({
      title: '暂无位置信息，无法导航',
      icon: 'none'
    })
    return
  }

  uni.openLocation({
    latitude: item.latitude,
    longitude: item.longitude,
    name: item.userName,
    address: item.address,
    scale: 16
  })
}

function openChangeTime(item: WorkOrder) {
  currentOrder.value = item
  const [date = '', time = ''] = item.appointmentTime.split(' ')
  appointmentDate.value = date
  appointmentTime.value = time
  popupVisible.value = true
}

function closePopup() {
  if (updating.value) return
  popupVisible.value = false
}

function handleDateChange(event: { detail: { value: string | number } }) {
  appointmentDate.value = String(event.detail.value)
}

function handleTimeChange(event: { detail: { value: string | number } }) {
  appointmentTime.value = String(event.detail.value)
}

async function confirmChangeTime() {
  if (!currentOrder.value) return
  if (!appointmentDate.value || !appointmentTime.value) {
    uni.showToast({
      title: '请选择新的预约时间',
      icon: 'none'
    })
    return
  }

  updating.value = true
  try {
    await store.updateAppointmentTime(currentOrder.value.id, `${appointmentDate.value} ${appointmentTime.value}`)
    popupVisible.value = false
    uni.showToast({
      title: '预约时间修改成功',
      icon: 'success'
    })
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '预约时间修改失败',
      icon: 'none'
    })
  } finally {
    updating.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.work-order-page {
  padding: 0 24rpx 32rpx;
}

.tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
  margin-top: 10rpx;
  padding: 10rpx;
  border-radius: 28rpx;
  background: #eaf1ff;
}

.tab-item {
  @include flex-center;
  height: 68rpx;
  border-radius: 22rpx;
  color: $text-secondary;
  font-size: 25rpx;
  font-weight: 600;
}

.tab-item.active {
  color: $primary-color;
  background: #ffffff;
  box-shadow: 0 8rpx 18rpx rgba(22, 119, 255, 0.12);
}

.search-panel {
  display: flex;
  gap: 16rpx;
  margin-top: 22rpx;
}

.search-box {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  height: 84rpx;
  padding: 0 18rpx;
  border-radius: 42rpx;
  background: #ffffff;
  box-shadow: $shadow-card;
}

.search-icon {
  margin-right: 10rpx;
  color: $text-muted;
  font-size: 28rpx;
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 84rpx;
  color: $text-main;
  font-size: 26rpx;
}

.placeholder {
  color: #a7b3cc;
}

.clear-btn {
  @include flex-center;
  width: 48rpx;
  height: 48rpx;
  border-radius: 24rpx;
  color: $text-secondary;
  font-size: 32rpx;
  background: #eef3fb;
}

.filter-btn {
  @include flex-center;
  flex-shrink: 0;
  width: 112rpx;
  height: 84rpx;
  border-radius: 42rpx;
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 700;
  background: $primary-color;
  box-shadow: 0 12rpx 24rpx rgba(22, 119, 255, 0.18);
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  margin-top: 24rpx;
}

.loading-text,
.footer-text {
  padding: 32rpx 0;
  color: $text-secondary;
  font-size: 25rpx;
  text-align: center;
}

.error-card {
  margin-top: 28rpx;
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

.popup-mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  background: rgba(11, 31, 68, 0.42);
}

.popup {
  width: 100%;
  padding: 34rpx 30rpx calc(34rpx + env(safe-area-inset-bottom));
  border-radius: 34rpx 34rpx 0 0;
  background: #ffffff;
}

.popup-title {
  color: $text-main;
  font-size: 34rpx;
  font-weight: 800;
  text-align: center;
}

.current-time {
  margin-top: 28rpx;
  padding: 24rpx;
  border-radius: 20rpx;
  background: #f7faff;
}

.label {
  display: block;
  color: $text-secondary;
  font-size: 24rpx;
}

.value {
  display: block;
  margin-top: 8rpx;
  color: $text-main;
  font-size: 30rpx;
  font-weight: 700;
}

.picker-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
  margin-top: 22rpx;
}

.picker-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 88rpx;
  padding: 0 22rpx;
  border-radius: 20rpx;
  color: $text-main;
  font-size: 26rpx;
  background: #f7faff;
}

.popup-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
  margin-top: 34rpx;
}

.popup-btn {
  @include flex-center;
  height: 86rpx;
  border-radius: 43rpx;
  font-size: 28rpx;
  font-weight: 700;
}

.popup-btn.cancel {
  color: $text-secondary;
  background: #eef3fb;
}

.popup-btn.confirm {
  color: #ffffff;
  background: linear-gradient(135deg, #1677ff 0%, #38a4ff 100%);
}
</style>
