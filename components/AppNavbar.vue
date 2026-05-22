<template>
  <view class="navbar" :style="{ paddingTop: `${statusBarHeight}px` }">
    <view class="navbar-inner">
      <button v-if="showBack" class="nav-icon" @click="handleBack">‹</button>
      <view v-else class="nav-placeholder" />
      <view class="nav-title">{{ title }}</view>
      <button v-if="rightIcon" class="nav-icon" @click="$emit('rightClick')">
        <view v-if="rightIcon === 'trash'" class="trash-icon">
          <view class="trash-lid" />
          <view class="trash-body" />
          <view class="trash-line left" />
          <view class="trash-line right" />
        </view>
        <text v-else>{{ rightIcon }}</text>
      </button>
      <view v-else class="nav-placeholder" />
    </view>
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string
    showBack?: boolean
    rightIcon?: string
  }>(),
  {
    showBack: false,
    rightIcon: ''
  }
)

defineEmits<{
  rightClick: []
}>()

const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 0

function handleBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
    return
  }
  uni.switchTab({
    url: '/pages/home/index'
  })
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.navbar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(245, 248, 255, 0.96);
  backdrop-filter: blur(12px);
}

.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 24rpx;
}

.nav-title {
  color: $text-main;
  font-size: 34rpx;
  font-weight: 700;
}

.nav-icon,
.nav-placeholder {
  @include flex-center;
  width: 72rpx;
  height: 72rpx;
  border-radius: 36rpx;
  color: $text-main;
  font-size: 38rpx;
  background: transparent;
}

.nav-icon:active {
  background: #eaf1ff;
}

.trash-icon {
  position: relative;
  width: 34rpx;
  height: 38rpx;
}

.trash-lid {
  position: absolute;
  top: 6rpx;
  left: 5rpx;
  width: 24rpx;
  height: 4rpx;
  border-radius: 2rpx;
  background: $text-main;
}

.trash-lid::before {
  position: absolute;
  top: -5rpx;
  left: 8rpx;
  width: 8rpx;
  height: 4rpx;
  border-radius: 3rpx 3rpx 0 0;
  background: $text-main;
  content: '';
}

.trash-body {
  position: absolute;
  right: 6rpx;
  bottom: 4rpx;
  left: 6rpx;
  height: 25rpx;
  border: 4rpx solid $text-main;
  border-top: 0;
  border-radius: 0 0 5rpx 5rpx;
}

.trash-line {
  position: absolute;
  top: 17rpx;
  width: 3rpx;
  height: 14rpx;
  border-radius: 2rpx;
  background: $text-main;
}

.trash-line.left {
  left: 13rpx;
}

.trash-line.right {
  right: 13rpx;
}
</style>
