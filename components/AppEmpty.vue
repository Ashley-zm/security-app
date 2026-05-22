<template>
  <view class="app-empty">
    <view class="empty-icon">□</view>
    <view class="empty-title">{{ title }}</view>
    <view v-if="desc" class="empty-desc">{{ desc }}</view>
    <button v-if="showRetry" class="empty-btn" @click="$emit('retry')">重新加载</button>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    desc?: string
    showRetry?: boolean
  }>(),
  {
    title: '暂无数据',
    desc: '',
    showRetry: false
  }
)

defineEmits<{
  retry: []
}>()
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.app-empty {
  @include flex-center;
  flex-direction: column;
  padding: 88rpx 32rpx;
  color: $text-secondary;
}

.empty-icon {
  @include flex-center;
  width: 112rpx;
  height: 112rpx;
  border-radius: 56rpx;
  color: #b8c6e2;
  font-size: 54rpx;
  background: #eef5ff;
}

.empty-title {
  margin-top: 24rpx;
  color: $text-main;
  font-size: 30rpx;
  font-weight: 600;
}

.empty-desc {
  margin-top: 10rpx;
  font-size: 24rpx;
}

.empty-btn {
  @include flex-center;
  min-width: 180rpx;
  height: 72rpx;
  margin-top: 28rpx;
  border-radius: 36rpx;
  color: #ffffff;
  font-size: 26rpx;
  background: $primary-color;
}
</style>
