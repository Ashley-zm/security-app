<template>
  <view class="message-page page safe-page">
    <AppNavbar title="消息" />
    <view class="message-list">
      <view v-for="item in messages" :key="item.title" class="message-card">
        <view class="message-dot" :class="item.type" />
        <view class="message-main">
          <view class="message-title">{{ item.title }}</view>
          <view class="message-desc">{{ item.desc }}</view>
          <view class="message-time">{{ item.time }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import AppNavbar from '@/components/AppNavbar.vue'

const messages = [
  {
    title: '新工单提醒',
    desc: '浦东新区新增 2 条待执行安检工单',
    time: '09:30',
    type: 'blue'
  },
  {
    title: '异常处理提醒',
    desc: '长宁区一处工单存在异常，请及时复核',
    time: '10:15',
    type: 'red'
  },
  {
    title: '预约变更',
    desc: '用户李女士预约时间已更新',
    time: '11:20',
    type: 'orange'
  }
]
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.message-page {
  padding: 0 28rpx 32rpx;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 24rpx;
}

.message-card {
  display: flex;
  gap: 20rpx;
  padding: 28rpx;
  background: #ffffff;
  border-radius: $card-radius;
  box-shadow: $shadow-card;
}

.message-dot {
  width: 18rpx;
  height: 18rpx;
  margin-top: 10rpx;
  border-radius: 9rpx;
}

.message-dot.blue {
  background: $primary-color;
}

.message-dot.red {
  background: $error-color;
}

.message-dot.orange {
  background: $warning-color;
}

.message-main {
  min-width: 0;
}

.message-title {
  color: $text-main;
  font-size: 30rpx;
  font-weight: 700;
}

.message-desc {
  margin-top: 10rpx;
  color: $text-secondary;
  font-size: 25rpx;
  line-height: 1.5;
}

.message-time {
  margin-top: 12rpx;
  color: $text-muted;
  font-size: 22rpx;
}
</style>
