<template>
  <view class="placeholder-page page safe-page">
    <AppNavbar title="统计" />
    <view class="summary-card">
      <view class="title">安检统计</view>
      <view class="desc">工单完成率、异常趋势、区域排名等统计能力将在这里展示。</view>
      <view class="metric-row">
        <view class="metric">
          <text class="num">86%</text>
          <text class="label">完成率</text>
        </view>
        <view class="metric">
          <text class="num green">24</text>
          <text class="label">本周完成</text>
        </view>
        <view class="metric">
          <text class="num red">3</text>
          <text class="label">异常预警</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import AppNavbar from '@/components/AppNavbar.vue'
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.placeholder-page {
  padding: 0 28rpx 32rpx;
}

.summary-card {
  margin-top: 24rpx;
  padding: 34rpx;
  background: #ffffff;
  border-radius: $card-radius;
  box-shadow: $shadow-card;
}

.title {
  color: $text-main;
  font-size: 36rpx;
  font-weight: 800;
}

.desc {
  margin-top: 14rpx;
  color: $text-secondary;
  font-size: 26rpx;
  line-height: 1.6;
}

.metric-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14rpx;
  margin-top: 30rpx;
}

.metric {
  @include flex-center;
  flex-direction: column;
  min-height: 150rpx;
  border-radius: 20rpx;
  background: #f7faff;
}

.num {
  color: $primary-color;
  font-size: 38rpx;
  font-weight: 800;
}

.num.green {
  color: $success-color;
}

.num.red {
  color: $error-color;
}

.label {
  margin-top: 10rpx;
  color: $text-secondary;
  font-size: 23rpx;
}
</style>
