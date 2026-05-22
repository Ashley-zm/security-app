<template>
  <view class="home-page page safe-page">
    <view class="home-header" :style="{ paddingTop: `${statusBarHeight}px` }">
      <view>
        <view class="app-name">安检APP</view>
        <view class="hello">今日工作稳步推进中</view>
      </view>
      <button class="bell-btn" @click="goMessage">
        <text>铃</text>
        <text v-if="overview.unreadCount" class="dot" />
      </button>
    </view>

    <view class="banner">
      <view class="banner-text">
        <view class="banner-title">守护燃气安全</view>
        <view class="banner-subtitle">智能安检每一天</view>
      </view>
      <view class="banner-mark">SAFE</view>
    </view>

    <view class="data-card">
      <view class="data-item">
        <text class="data-num">{{ overview.pendingCount }}</text>
        <text class="data-label">今日待安检</text>
      </view>
      <view class="data-item">
        <text class="data-num success">{{ overview.completedCount }}</text>
        <text class="data-label">已完成</text>
      </view>
      <view class="data-item">
        <text class="data-num warning">{{ overview.warningCount }}</text>
        <text class="data-label">异常预警</text>
      </view>
    </view>

    <view class="section-head">
      <text class="section-title">快捷入口</text>
    </view>
    <view class="quick-grid">
      <button
        v-for="entry in quickEntries"
        :key="entry.title"
        class="quick-card"
        :class="{ highlight: entry.highlight }"
        @click="handleEntry(entry)"
      >
        <view class="quick-top">
          <view class="quick-icon" :class="`quick-icon-${entry.icon}`">
            <block v-if="entry.icon === 'assistant'">
              <text class="assistant-ai">AI</text>
              <view class="assistant-spark spark-left" />
              <view class="assistant-spark spark-right" />
            </block>
            <block v-else-if="entry.icon === 'work-order'">
              <view class="order-board">
                <view class="order-clip" />
                <view class="order-line long" />
                <view class="order-line short" />
              </view>
              <view class="order-check" />
            </block>
            <block v-else-if="entry.icon === 'scan'">
              <view class="scan-corner top-left" />
              <view class="scan-corner top-right" />
              <view class="scan-corner bottom-left" />
              <view class="scan-corner bottom-right" />
              <view class="scan-line" />
            </block>
            <block v-else-if="entry.icon === 'plugin'">
              <view class="plugin-chip">
                <view class="plugin-pin pin-left" />
                <view class="plugin-pin pin-right" />
              </view>
              <view class="plugin-signal" />
            </block>
            <block v-else>
              <view class="message-box">
                <view class="message-fold left" />
                <view class="message-fold right" />
              </view>
              <view class="message-dot" />
            </block>
          </view>
          <text v-if="entry.badge" class="quick-badge">{{ entry.badge }}</text>
        </view>
        <view class="quick-title">{{ entry.title }}</view>
        <view class="quick-subtitle">{{ entry.subtitle }}</view>
      </button>
    </view>

    <view class="ai-card">
      <view class="ai-content">
        <view class="ai-title">AI安检助手</view>
        <view class="ai-subtitle">智能问答 / 流程指导 / 异常处理</view>
        <view class="ai-desc">随时解答安检疑问，辅助高效完成工作</view>
      </view>
      <button class="ai-btn" @click="goAssistant">立即使用</button>
    </view>

    <view class="section-head">
      <text class="section-title">最近工单</text>
      <button class="more-btn" @click="goWorkOrder">查看全部</button>
    </view>
    <view class="recent-list">
      <button v-for="item in overview.recentOrders" :key="item.id" class="recent-item" @click="goWorkOrder">
        <view class="recent-main">
          <text class="recent-no">{{ item.orderNo }}</text>
          <text class="recent-address">{{ item.address }}</text>
          <text class="recent-time">{{ item.appointmentTime }}</text>
        </view>
        <StatusTag :status="item.status" :status-name="item.statusName" />
      </button>
    </view>

    <view class="recommend-card">
      <view class="recommend-title">AI 智能推荐</view>
      <view class="recommend-item">
        <text class="recommend-dot blue" />
        <text>重点区域燃气管道检查</text>
      </view>
      <view class="recommend-item">
        <text class="recommend-dot orange" />
        <text>燃气泄漏检测注意事项</text>
      </view>
      <button class="recommend-link" @click="goAssistant">查看详情</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { onPullDownRefresh } from '@dcloudio/uni-app'
import { getHomeOverviewApi } from '@/api/home'
import StatusTag from '@/components/StatusTag.vue'
import type { HomeOverview, QuickEntry } from '@/types/home'

const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 0

const overview = reactive<HomeOverview>({
  pendingCount: 0,
  completedCount: 0,
  warningCount: 0,
  unreadCount: 0,
  recentOrders: []
})

const quickEntries: QuickEntry[] = [
  {
    title: '安检助手',
    subtitle: '智能问答 贴心助手',
    icon: 'assistant',
    path: '/pages/assistant/index',
    highlight: true,
    badge: '推荐'
  },
  {
    title: '安检工单',
    subtitle: '任务处理',
    icon: 'work-order',
    path: '/pages/work-order/index'
  },
  {
    title: '扫一扫',
    subtitle: '快速识别',
    icon: 'scan',
    path: ''
  },
  {
    title: '消息通知',
    subtitle: '待办提醒',
    icon: 'message',
    path: '/pages/message/index'
  },
  {
    title: '插件检测',
    subtitle: '安卓原生能力校验',
    icon: 'plugin',
    path: '/pages/plugin-check/index'
  }
]

onMounted(() => {
  fetchOverview()
})

onPullDownRefresh(async () => {
  await fetchOverview()
  uni.stopPullDownRefresh()
})

async function fetchOverview() {
  const data = await getHomeOverviewApi()
  Object.assign(overview, data)
}

function handleEntry(entry: QuickEntry) {
  if (entry.title === '扫一扫') {
    uni.scanCode({
      fail: () => {
        uni.showToast({
          title: '当前环境暂不支持扫码',
          icon: 'none'
        })
      }
    })
    return
  }

  if (entry.path === '/pages/work-order/index' || entry.path === '/pages/message/index') {
    uni.switchTab({ url: entry.path })
    return
  }

  uni.navigateTo({ url: entry.path })
}

function goMessage() {
  uni.switchTab({
    url: '/pages/message/index'
  })
}

function goWorkOrder() {
  uni.switchTab({
    url: '/pages/work-order/index'
  })
}

function goAssistant() {
  uni.navigateTo({
    url: '/pages/assistant/index'
  })
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.home-page {
  padding: 0 28rpx 32rpx;
}

.home-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 24rpx;
}

.app-name {
  color: $text-main;
  font-size: 40rpx;
  font-weight: 800;
}

.hello {
  margin-top: 8rpx;
  color: $text-secondary;
  font-size: 25rpx;
}

.bell-btn {
  position: relative;
  @include flex-center;
  width: 78rpx;
  height: 78rpx;
  border-radius: 39rpx;
  color: $primary-color;
  font-size: 26rpx;
  background: #ffffff;
  box-shadow: $shadow-card;
}

.dot {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  width: 16rpx;
  height: 16rpx;
  border-radius: 8rpx;
  background: $error-color;
}

.banner {
  position: relative;
  min-height: 220rpx;
  padding: 38rpx;
  overflow: hidden;
  border-radius: 32rpx;
  background: linear-gradient(135deg, #1677ff 0%, #2fb8ff 100%);
  box-shadow: 0 18rpx 40rpx rgba(22, 119, 255, 0.22);
}

.banner-title {
  color: #ffffff;
  font-size: 42rpx;
  font-weight: 800;
}

.banner-subtitle {
  margin-top: 16rpx;
  color: rgba(255, 255, 255, 0.86);
  font-size: 28rpx;
}

.banner-mark {
  position: absolute;
  right: -8rpx;
  bottom: 18rpx;
  color: rgba(255, 255, 255, 0.16);
  font-size: 86rpx;
  font-weight: 900;
}

.data-card {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14rpx;
  margin-top: 24rpx;
  padding: 28rpx 16rpx;
  background: #ffffff;
  border-radius: $card-radius;
  box-shadow: $shadow-card;
}

.data-item {
  @include flex-center;
  flex-direction: column;
}

.data-num {
  color: $primary-color;
  font-size: 42rpx;
  font-weight: 800;
}

.data-num.success {
  color: $success-color;
}

.data-num.warning {
  color: $error-color;
}

.data-label {
  margin-top: 10rpx;
  color: $text-secondary;
  font-size: 24rpx;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 34rpx 4rpx 18rpx;
}

.more-btn {
  min-height: 52rpx;
  color: $primary-color;
  font-size: 25rpx;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20rpx;
}

.quick-card {
  min-height: 182rpx;
  padding: 24rpx;
  text-align: left;
  background: #ffffff;
  border-radius: $card-radius;
  box-shadow: $shadow-card;
}

.quick-card.highlight {
  background: linear-gradient(135deg, #ffffff 0%, #eaf5ff 100%);
  border: 2rpx solid rgba(22, 119, 255, 0.18);
}

.quick-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.quick-icon {
  position: relative;
  @include flex-center;
  flex-shrink: 0;
  width: 72rpx;
  height: 72rpx;
  overflow: hidden;
  border-radius: 24rpx;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 800;
}

.quick-icon-assistant {
  background: linear-gradient(135deg, #1677ff 0%, #54c8ff 100%);
  box-shadow: 0 10rpx 20rpx rgba(22, 119, 255, 0.22);
}

.quick-icon-work-order {
  background: linear-gradient(135deg, #19be6b 0%, #65d89b 100%);
  box-shadow: 0 10rpx 20rpx rgba(25, 190, 107, 0.2);
}

.quick-icon-scan {
  background: linear-gradient(135deg, #7c5cff 0%, #4aa6ff 100%);
  box-shadow: 0 10rpx 20rpx rgba(89, 97, 255, 0.2);
}

.quick-icon-message {
  background: linear-gradient(135deg, #ff9900 0%, #ffc44d 100%);
  box-shadow: 0 10rpx 20rpx rgba(255, 153, 0, 0.2);
}

.quick-icon-plugin {
  background: linear-gradient(135deg, #0b1f44 0%, #1677ff 100%);
  box-shadow: 0 10rpx 20rpx rgba(11, 31, 68, 0.18);
}

.assistant-ai {
  position: relative;
  z-index: 1;
  font-size: 25rpx;
  letter-spacing: 0;
}

.assistant-spark {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.72);
}

.spark-left {
  top: 16rpx;
  left: 14rpx;
  width: 8rpx;
  height: 8rpx;
}

.spark-right {
  right: 13rpx;
  bottom: 15rpx;
  width: 12rpx;
  height: 12rpx;
}

.order-board {
  position: relative;
  width: 34rpx;
  height: 42rpx;
  border: 4rpx solid #ffffff;
  border-radius: 8rpx;
}

.order-clip {
  position: absolute;
  top: -8rpx;
  left: 8rpx;
  width: 18rpx;
  height: 10rpx;
  border-radius: 6rpx;
  background: #ffffff;
}

.order-line {
  position: absolute;
  left: 8rpx;
  height: 4rpx;
  border-radius: 2rpx;
  background: rgba(255, 255, 255, 0.9);
}

.order-line.long {
  top: 15rpx;
  width: 18rpx;
}

.order-line.short {
  top: 26rpx;
  width: 12rpx;
}

.order-check {
  position: absolute;
  right: 14rpx;
  bottom: 16rpx;
  width: 16rpx;
  height: 9rpx;
  border-bottom: 4rpx solid #ffffff;
  border-left: 4rpx solid #ffffff;
  transform: rotate(-45deg);
}

.scan-corner {
  position: absolute;
  width: 18rpx;
  height: 18rpx;
}

.scan-corner.top-left {
  top: 16rpx;
  left: 16rpx;
  border-top: 4rpx solid #ffffff;
  border-left: 4rpx solid #ffffff;
}

.scan-corner.top-right {
  top: 16rpx;
  right: 16rpx;
  border-top: 4rpx solid #ffffff;
  border-right: 4rpx solid #ffffff;
}

.scan-corner.bottom-left {
  bottom: 16rpx;
  left: 16rpx;
  border-bottom: 4rpx solid #ffffff;
  border-left: 4rpx solid #ffffff;
}

.scan-corner.bottom-right {
  right: 16rpx;
  bottom: 16rpx;
  border-right: 4rpx solid #ffffff;
  border-bottom: 4rpx solid #ffffff;
}

.scan-line {
  width: 30rpx;
  height: 4rpx;
  border-radius: 2rpx;
  background: rgba(255, 255, 255, 0.85);
}

.message-box {
  position: relative;
  width: 40rpx;
  height: 30rpx;
  border: 4rpx solid #ffffff;
  border-radius: 8rpx;
}

.message-fold {
  position: absolute;
  top: 7rpx;
  width: 22rpx;
  height: 4rpx;
  border-radius: 2rpx;
  background: #ffffff;
}

.message-fold.left {
  left: -2rpx;
  transform: rotate(32deg);
}

.message-fold.right {
  right: -2rpx;
  transform: rotate(-32deg);
}

.message-dot {
  position: absolute;
  top: 13rpx;
  right: 12rpx;
  width: 12rpx;
  height: 12rpx;
  border: 3rpx solid #ffffff;
  border-radius: 50%;
  background: #ff4d43;
}

.plugin-chip {
  position: relative;
  width: 42rpx;
  height: 34rpx;
  border: 4rpx solid #ffffff;
  border-radius: 8rpx;
}

.plugin-chip::before {
  position: absolute;
  top: 9rpx;
  left: 9rpx;
  width: 14rpx;
  height: 8rpx;
  border-radius: 3rpx;
  background: rgba(255, 255, 255, 0.9);
  content: '';
}

.plugin-pin {
  position: absolute;
  bottom: -10rpx;
  width: 4rpx;
  height: 8rpx;
  border-radius: 2rpx;
  background: #ffffff;
}

.pin-left {
  left: 9rpx;
}

.pin-right {
  right: 9rpx;
}

.plugin-signal {
  position: absolute;
  top: 13rpx;
  right: 12rpx;
  width: 12rpx;
  height: 12rpx;
  border: 3rpx solid #ffffff;
  border-radius: 50%;
  background: $success-color;
}

.quick-badge {
  padding: 6rpx 14rpx;
  border-radius: 18rpx;
  color: $warning-color;
  font-size: 20rpx;
  background: #fff4df;
}

.quick-title {
  margin-top: 20rpx;
  color: $text-main;
  font-size: 30rpx;
  font-weight: 700;
}

.quick-subtitle {
  margin-top: 8rpx;
  color: $text-secondary;
  font-size: 23rpx;
}

.ai-card,
.recommend-card,
.recent-item {
  background: #ffffff;
  border-radius: $card-radius;
  box-shadow: $shadow-card;
}

.ai-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22rpx;
  margin-top: 26rpx;
  padding: 30rpx;
}

.ai-content {
  min-width: 0;
}

.ai-title {
  color: $text-main;
  font-size: 34rpx;
  font-weight: 800;
}

.ai-subtitle {
  margin-top: 10rpx;
  color: $primary-color;
  font-size: 25rpx;
  font-weight: 600;
}

.ai-desc {
  margin-top: 10rpx;
  color: $text-secondary;
  font-size: 24rpx;
}

.ai-btn {
  @include flex-center;
  flex-shrink: 0;
  width: 168rpx;
  height: 76rpx;
  border-radius: 38rpx;
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 700;
  background: linear-gradient(135deg, #1677ff 0%, #38a4ff 100%);
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.recent-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  width: 100%;
  padding: 24rpx;
  text-align: left;
}

.recent-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.recent-no,
.recent-address,
.recent-time {
  @include text-ellipsis;
  max-width: 440rpx;
}

.recent-no {
  color: $text-main;
  font-size: 28rpx;
  font-weight: 700;
}

.recent-address {
  margin-top: 8rpx;
  color: $text-secondary;
  font-size: 24rpx;
}

.recent-time {
  margin-top: 8rpx;
  color: $text-muted;
  font-size: 22rpx;
}

.recommend-card {
  margin-top: 26rpx;
  padding: 30rpx;
}

.recommend-title {
  color: $text-main;
  font-size: 32rpx;
  font-weight: 800;
}

.recommend-item {
  display: flex;
  align-items: center;
  margin-top: 20rpx;
  color: $text-secondary;
  font-size: 26rpx;
}

.recommend-dot {
  width: 14rpx;
  height: 14rpx;
  margin-right: 14rpx;
  border-radius: 7rpx;
}

.recommend-dot.blue {
  background: $primary-color;
}

.recommend-dot.orange {
  background: $warning-color;
}

.recommend-link {
  margin-top: 18rpx;
  min-height: 54rpx;
  color: $primary-color;
  font-size: 25rpx;
  text-align: left;
}
</style>
