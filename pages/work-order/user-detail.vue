<template>
  <view class="user-detail-page page safe-page">
    <AppNavbar title="用户信息" show-back />

    <view v-if="loading" class="state-view">加载中...</view>

    <view v-else-if="error" class="error-card">
      <text class="error-title">用户详情加载失败</text>
      <text class="error-desc">{{ error }}</text>
      <button class="retry-btn" @click="loadDetail">重新加载</button>
    </view>

    <scroll-view v-else-if="detail" class="detail-scroll" scroll-y :show-scrollbar="false">
      <view class="detail-content">
        <view class="section-block">
          <text class="section-title">工单信息</text>
          <view class="work-order-card">
            <view class="work-order-top">
              <text class="work-order-no">{{ displayValue(detail.workOrder.workOrderNo) }}</text>
              <text class="status-tag" :class="workOrderStatusClass">{{ workOrderStatusText }}</text>
            </view>
            <text class="work-order-name">{{ displayValue(detail.workOrder.workOrderName) }}</text>
          </view>
        </view>

        <view class="section-block">
          <text class="section-title">用户信息</text>
          <view class="info-card">
            <view class="info-row with-action">
              <text class="info-label">户名：</text>
              <text class="info-value">{{ displayValue(detail.workOrderUser.householdName) }}</text>
              <button class="phone-btn" @click="makePhoneCall">
                <u-icon name="phone-fill" color="#1677FF" size="17" />
              </button>
            </view>
            <view v-for="item in userInfoRows" :key="item.label" class="info-row" :class="{ 'address-row': item.isAddress }">
              <text class="info-label">{{ item.label }}：</text>
              <text class="info-value">{{ item.value }}</text>
            </view>
          </view>
        </view>

        <view class="section-block history-section">
          <text class="section-title">安检历史</text>
          <view v-if="historyList.length" class="history-list">
            <view v-for="record in historyList" :key="record.id" class="history-card">
              <view class="history-main">
                <view class="history-row">
                  <text class="info-label">安检时间：</text>
                  <text class="info-value">{{ displayValue(record.inspectionFinishTime) }}</text>
                </view>
                <view class="history-row">
                  <text class="info-label">安检员：</text>
                  <text class="info-value">{{ displayValue(record.inspectorName) }}</text>
                </view>
                <view class="history-row">
                  <text class="info-label">隐患数：</text>
                  <text class="info-value">{{ displayValue(record.dangerCount) }}</text>
                </view>
                <view class="history-row result-row">
                  <text class="info-label">安检结果：</text>
                  <text class="result-tag" :class="getResultClass(record.inspectionResult)">
                    {{ getResultText(record.inspectionResult) }}
                  </text>
                </view>
              </view>
              <u-icon name="arrow-right" color="#9AA8C5" size="15" />
            </view>
          </view>
          <view v-else class="history-empty">暂无安检历史</view>
        </view>
      </view>
    </scroll-view>

    <view v-if="detail" class="inspection-actions">
      <button v-for="action in inspectionActions" :key="action.mode" class="inspection-action"
        :class="action.className" @click="handleInspectionAction(action.label)">
        <image class="action-icon" :src="getActionIcon(action.mode)" mode="aspectFit" />
        <text class="action-title">{{ action.label }}</text>
        <text class="action-desc">{{ action.desc }}</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import AppNavbar from '@/components/AppNavbar.vue'
import { getWorkOrderUserDetailApi } from '@/modules/work-order/api'
import type { DictDataVO } from '@/modules/common/types'
import type { InspectionHistoryRecord, WorkOrderUserDetailResult, WorkOrderUserInfoRow } from '@/modules/work-order/types'
import { getDictLabelByType, getDictLabelByValue, getDictsByTypes } from '@/utils/common'


const workOrderUserId = ref('')
const appointmentTimeFallback = ref('')
const detail = ref<WorkOrderUserDetailResult | null>(null)
const loading = ref(false)
const error = ref('')
const workOrderStatusText = ref('--')
const inspectionResultDict = ref<DictDataVO[]>([])

const inspectionActions = [
  { mode: 1, label: 'AI 安检', desc: '智能识别记录', icon: 'AI', className: 'is-ai' },
  { mode: 2, label: '人工安检', desc: '手动逐项录入', icon: '人', className: 'is-manual' },
  { mode: 3, label: '无法安检', desc: '异常情况记录', icon: '−', className: 'is-unable' }
]

const historyList = computed<InspectionHistoryRecord[]>(() => detail.value?.historyList || [])

const userInfoRows = computed<WorkOrderUserInfoRow[]>(() => {
  const user = detail.value?.workOrderUser
  return [
    { label: '户号', value: displayValue(user?.householdNo) },
    { label: '手机号码', value: displayValue(user?.mobilePhone) },
    { label: '表号', value: displayValue(user?.meterNo) },
    { label: '预约时间', value: displayValue(user?.appointmentTime || appointmentTimeFallback.value) },
    { label: '地址', value: displayValue(user?.userAddress), isAddress: true }
  ]
})

const workOrderStatusClass = computed(() => getUserStatusClass(detail.value?.workOrder.status))

onLoad((options) => {
  workOrderUserId.value = decodeURIComponent(String(options?.id || options?.workOrderUserId || ''))
  appointmentTimeFallback.value = decodeURIComponent(String(options?.appointmentTime || ''))
  loadDictionaries()
  loadDetail()
})

onPullDownRefresh(async () => {
  await Promise.all([loadDictionaries(), loadDetail()])
  uni.stopPullDownRefresh()
})

async function loadDictionaries() {
  const dicts = await getDictsByTypes(['inspection_result'])
  inspectionResultDict.value = dicts.inspection_result || []
}

async function loadDetail() {
  if (!workOrderUserId.value) {
    error.value = '缺少安检用户 ID'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const result = await getWorkOrderUserDetailApi(workOrderUserId.value)
    detail.value = result
    await resolveWorkOrderStatus(result.workOrder.status)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '用户详情加载失败'
  } finally {
    loading.value = false
  }
}

async function resolveWorkOrderStatus(status?: string | number | null) {
  try {
    workOrderStatusText.value = await getDictLabelByType('work_order_status', String(status ?? ''))
  } catch (error) {
    workOrderStatusText.value = ''
  }
  workOrderStatusText.value = workOrderStatusText.value || statusLabelFallback(status)
}

function displayValue(value?: string | number | null) {
  if (value === undefined || value === null || value === '') return '--'
  return String(value)
}

function statusLabelFallback(status?: string | number | null) {
  const labelMap: Record<string, string> = {
    '1': '待安检',
    '2': '安检中',
    '3': '已完成',
    '4': '安检失败',
    '5': '已取消'
  }
  return labelMap[String(status ?? '')] || '--'
}

function getUserStatusClass(status?: string | number | null) {
  const classMap: Record<string, string> = {
    '1': 'is-pending',
    '2': 'is-processing',
    '3': 'is-completed',
    '4': 'is-failed',
    '5': 'is-canceled'
  }
  return classMap[String(status ?? '')] || 'is-pending'
}

function getResultText(result?: string | number | null) {
  if (result === undefined || result === null || result === '') return '--'
  const value = String(result)
  const fallback: Record<string, string> = {
    '1': '合格',
    '2': '不合格',
    '3': '无法安检'
  }
  return getDictLabelByValue(inspectionResultDict.value, value) || fallback[value] || value
}

function getResultClass(result?: string | number | null) {
  const classMap: Record<string, string> = {
    '1': 'is-passed',
    '2': 'is-failed',
    '3': 'is-unable'
  }
  return classMap[String(result ?? '')] || 'is-unable'
}

function makePhoneCall() {
  const phone = detail.value?.workOrderUser.mobilePhone
  if (!phone) {
    uni.showToast({ title: '用户手机号码为空', icon: 'none' })
    return
  }
  uni.makePhoneCall({ phoneNumber: phone })
}

function getActionIcon(mode: number) {
  const iconMap: Record<number, string> = {
    1: '/static/images/ai.svg',
    2: '/static/images/person.svg',
    3: '/static/images/unable.svg'
  }
  return iconMap[mode] || ''
}


function handleInspectionAction(actionName: string) {
  uni.showToast({
    title: actionName + '功能待接入',
    icon: 'none'
  })
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.user-detail-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: $bg-page;
}

.detail-scroll {
  flex: 1;
  min-height: 0;
}

.detail-content {
  padding: 24rpx 24rpx 40rpx;
}

.section-block + .section-block {
  margin-top: 42rpx;
}

.section-title {
  display: block;
  margin: 0 8rpx 20rpx;
  color: $text-main;
  font-size: 30rpx;
  font-weight: 800;
  line-height: 42rpx;
}

.work-order-card,
.info-card,
.history-card,
.history-empty,
.error-card {
  background: #fff;
  border-radius: $card-radius;
  box-shadow: $shadow-card;
}

.work-order-card {
  padding: 28rpx 32rpx 32rpx;
}

.work-order-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.work-order-no {
  min-width: 0;
  overflow: hidden;
  color: $info-color;
  font-size: 26rpx;
  line-height: 38rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-tag {
  @include flex-center;
  flex-shrink: 0;
  min-width: 108rpx;
  height: 52rpx;
  padding: 0 18rpx;
  border-radius: 28rpx;
  font-size: 24rpx;
  font-weight: 700;
}

.status-tag.is-pending,
.status-tag.is-processing {
  color: $primary-color;
  background: $primary-bg;
}

.status-tag.is-completed {
  color: $success-color;
  background: $success-bg;
}

.status-tag.is-failed {
  color: $error-color;
  background: $error-bg;
}

.status-tag.is-canceled {
  color: $info-color;
  background: $info-bg;
}

.work-order-name {
  display: block;
  margin-top: 26rpx;
  color: $text-main;
  font-size: 30rpx;
  font-weight: 800;
  line-height: 44rpx;
}

.info-card {
  padding: 18rpx 32rpx;
}

.info-row,
.history-row {
  display: flex;
  align-items: flex-start;
  min-width: 0;
  padding: 10rpx 0;
}

.info-row.with-action {
  align-items: center;
}

.info-label {
  width: 130rpx;
  flex: 0 0 auto;
  color: #8b9ab7;
  font-size: 26rpx;
  font-weight: 600;
  line-height: 38rpx;
}

.info-value {
  min-width: 0;
  color: $text-main;
  font-size: 27rpx;
  font-weight: 700;
  line-height: 38rpx;
  word-break: break-all;
}

.info-row:not(.address-row) .info-value,
.history-row .info-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.phone-btn {
  @include flex-center;
  flex: 0 0 54rpx;
  width: 54rpx;
  height: 54rpx;
  margin-left: auto;
  padding: 0;
  border-radius: 50%;
  background: $primary-bg;
}

.phone-btn::after,
.inspection-action::after,
.retry-btn::after {
  border: 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}

.history-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx 32rpx;
}

.history-main {
  flex: 1;
  min-width: 0;
}

.history-row {
  padding: 4rpx 0;
}

.result-row {
  align-items: center;
}

.result-tag {
  @include flex-center;
  min-width: 76rpx;
  height: 46rpx;
  padding: 0 16rpx;
  border-radius: 24rpx;
  font-size: 23rpx;
  font-weight: 700;
}

.result-tag.is-passed {
  color: #fff;
  background: $success-color;
}

.result-tag.is-failed {
  color: #fff;
  background: $error-color;
}

.result-tag.is-unable {
  color: $info-color;
  background: $info-bg;
}

.history-empty {
  padding: 44rpx 0;
  color: $info-color;
  font-size: 26rpx;
  text-align: center;
}

.inspection-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  padding: 18rpx 24rpx calc(18rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -8rpx 24rpx rgba(28, 83, 171, 0.05);
}

.inspection-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 120rpx;
  padding: 0 4rpx;
  border-radius: 20rpx;
  background: #f5f8ff;
}

.inspection-action.is-unable {
  border: 2rpx solid $border-color;
  background: #fff;
}

.action-icon {
  @include flex-center;
  width: 32rpx;
  height: 28rpx;
  color: $primary-color;
  font-size: 23rpx;
  font-weight: 800;
  line-height: 28rpx;
}

.inspection-action.is-unable .action-icon {
  color: $info-color;
}

.action-title {
  margin-top: 5rpx;
  color: $primary-color;
  font-size: 25rpx;
  font-weight: 800;
  line-height: 34rpx;
  white-space: nowrap;
}

.action-desc {
  margin-top: 2rpx;
  overflow: hidden;
  color: $text-muted;
  font-size: 19rpx;
  line-height: 26rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.state-view {
  @include flex-center;
  flex: 1;
  color: $info-color;
  font-size: 27rpx;
}

.error-card {
  margin: 24rpx;
  padding: 36rpx 32rpx;
}

.error-title {
  display: block;
  color: $error-color;
  font-size: 30rpx;
  font-weight: 800;
}

.error-desc {
  display: block;
  margin-top: 14rpx;
  color: $info-color;
  font-size: 25rpx;
  line-height: 36rpx;
}

.retry-btn {
  @include flex-center;
  width: 180rpx;
  height: 68rpx;
  margin: 28rpx 0 0;
  border-radius: 34rpx;
  color: #fff;
  font-size: 25rpx;
  background: $primary-color;
}
</style>
