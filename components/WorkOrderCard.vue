<template>
  <view class="work-order-card">
    <view class="card-header">
      <view class="order-info">
        <view class="order-no">{{ item.orderNo }}</view>
        <StatusTag :status="item.status" :status-name="item.statusName" />
      </view>
      <button class="phone-btn" @click="$emit('call', item)">☎</button>
    </view>

    <view class="address">{{ item.address }}</view>

    <view class="meta-grid">
      <view class="meta-item">
        <text class="meta-label">用户</text>
        <text class="meta-value">{{ item.userName }}</text>
      </view>
      <view class="meta-item">
        <text class="meta-label">手机号</text>
        <text class="meta-value">{{ item.userPhone || '暂无' }}</text>
      </view>
      <view class="meta-item">
        <text class="meta-label">户号</text>
        <text class="meta-value">{{ item.accountNo }}</text>
      </view>
      <view class="meta-item">
        <text class="meta-label">预约</text>
        <text class="meta-value">{{ item.appointmentTime }}</text>
      </view>
    </view>

    <view class="card-actions">
      <button class="action-btn secondary" @click="$emit('changeTime', item)">修改预约时间</button>
      <button class="action-btn primary" @click="$emit('navigate', item)">导航</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { WorkOrder } from '@/types/workOrder'
import StatusTag from './StatusTag.vue'

defineProps<{
  item: WorkOrder
}>()

defineEmits<{
  call: [item: WorkOrder]
  changeTime: [item: WorkOrder]
  navigate: [item: WorkOrder]
}>()
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.work-order-card {
  padding: 28rpx;
  background: #ffffff;
  border-radius: $card-radius;
  box-shadow: $shadow-card;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.order-info {
  min-width: 0;
}

.order-no {
  @include text-ellipsis;
  max-width: 470rpx;
  margin-bottom: 14rpx;
  color: $text-main;
  font-size: 30rpx;
  font-weight: 700;
}

.phone-btn {
  @include flex-center;
  flex-shrink: 0;
  width: 72rpx;
  height: 72rpx;
  border-radius: 36rpx;
  color: $primary-color;
  font-size: 34rpx;
  background: #eaf3ff;
}

.address {
  margin-top: 24rpx;
  color: $text-main;
  font-size: 29rpx;
  font-weight: 600;
  line-height: 1.5;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx 22rpx;
  margin-top: 24rpx;
  padding: 22rpx;
  border-radius: 20rpx;
  background: #f7faff;
}

.meta-item {
  min-width: 0;
}

.meta-label {
  display: block;
  margin-bottom: 8rpx;
  color: $text-secondary;
  font-size: 23rpx;
}

.meta-value {
  @include text-ellipsis;
  display: block;
  color: $text-main;
  font-size: 26rpx;
  font-weight: 600;
}

.card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  margin-top: 26rpx;
}

.action-btn {
  @include flex-center;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 27rpx;
  font-weight: 600;
}

.action-btn.secondary {
  color: $primary-color;
  background: #eaf3ff;
}

.action-btn.primary {
  color: #ffffff;
  background: linear-gradient(135deg, #1677ff 0%, #38a4ff 100%);
}
</style>
