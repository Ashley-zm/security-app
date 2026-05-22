<template>
  <view class="status-tag" :class="`status-${status}`">{{ statusName }}</view>
</template>

<script setup lang="ts">
import type { WorkOrderStatus } from '@/types/workOrder'

defineProps<{
  status: WorkOrderStatus
  statusName: string
}>()
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.status-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 112rpx;
  height: 48rpx;
  padding: 0 18rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
  font-weight: 600;
}

.status-pending {
  color: $primary-color;
  background: #eaf3ff;
}

.status-processing {
  color: $success-color;
  background: #e9fbf2;
}

.status-todo {
  color: $warning-color;
  background: #fff6e8;
}

.status-completed {
  color: #7d879c;
  background: #edf1f7;
}

.status-abnormal,
.status-timeout {
  color: $error-color;
  background: #fff0ef;
}
</style>
