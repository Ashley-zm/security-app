<template>
  <view class="app-card">
    <slot />
  </view>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.app-card {
  background: #ffffff;
  border-radius: $card-radius;
  box-shadow: $shadow-card;
}
</style>
