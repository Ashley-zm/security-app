<template>
  <view class="audio-float" :class="statusClass">
    <view class="audio-state-icon">
      <view v-if="status === 'recording'" class="recording-dot" />
      <view v-else-if="isOperating" class="audio-spinner" />
      <text v-else class="audio-symbol">{{ stateSymbol }}</text>
    </view>
    <view class="audio-copy">
      <text class="audio-title">{{ stateTitle }}</text>
      <text class="audio-detail">{{ stateDetail }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { InspectionAudioStatus } from "@/modules/work-order/inspection/types";

const props = defineProps<{
  status: InspectionAudioStatus;
  duration: number;
  errorMessage?: string;
}>();

const isOperating = computed(() =>
  ["starting", "stopping", "uploading"].includes(props.status),
);

const statusClass = computed(() => ({
  recording: props.status === "recording",
  success: props.status === "uploaded",
  error: ["error", "upload_failed"].includes(props.status),
}));

const stateTitle = computed(() => {
  const titles: Record<InspectionAudioStatus, string> = {
    idle: "准备录音",
    starting: "正在启动录音",
    recording: "安检录音中",
    stopping: "正在结束录音",
    stopped: "录音已结束",
    uploading: "录音上传中",
    uploaded: "录音已保存",
    upload_failed: "录音上传失败",
    error: "录音异常",
  };
  return titles[props.status];
});

const stateDetail = computed(() => {
  if (props.status === "recording") return formatDuration(props.duration);
  if (["error", "upload_failed"].includes(props.status)) {
    return props.errorMessage || "请检查录音权限";
  }
  if (props.status === "uploaded") return "已关联当前工单";
  return "请勿关闭安检页面";
});

const stateSymbol = computed(() => {
  if (props.status === "uploaded") return "✓";
  if (["error", "upload_failed"].includes(props.status)) return "!";
  return "●";
});

function formatDuration(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}
</script>

<style scoped lang="scss">
.audio-float {
  position: fixed;
  top: 44%;
  right: 22rpx;
  z-index: 40;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  min-width: 214rpx;
  max-width: 310rpx;
  min-height: 76rpx;
  padding: 12rpx 18rpx 12rpx 14rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.34);
  border-radius: 38rpx 8rpx 8rpx 38rpx;
  color: #fff;
  background: rgba(37, 58, 96, 0.9);
  box-shadow: 0 10rpx 28rpx rgba(24, 44, 79, 0.22);
  transform: translateY(-50%);
  pointer-events: none;
  backdrop-filter: blur(12rpx);
}

.audio-state-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 42rpx;
  width: 42rpx;
  height: 42rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
}

.recording-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #ff6674;
  box-shadow: 0 0 0 0 rgba(255, 102, 116, 0.55);
  animation: recording-pulse 1.5s infinite;
}

.audio-spinner {
  width: 18rpx;
  height: 18rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: audio-spin 0.8s linear infinite;
}

.audio-symbol {
  font-size: 23rpx;
  font-weight: 900;
}

.audio-copy {
  min-width: 0;
  margin-left: 12rpx;
}

.audio-title,
.audio-detail {
  display: block;
}

.audio-title {
  font-size: 23rpx;
  font-weight: 800;
  line-height: 30rpx;
  white-space: nowrap;
}

.audio-detail {
  max-width: 220rpx;
  margin-top: 1rpx;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.74);
  font-size: 18rpx;
  line-height: 25rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audio-float.success {
  background: rgba(38, 125, 88, 0.92);
}

.audio-float.error {
  background: rgba(199, 76, 88, 0.94);
}

@keyframes recording-pulse {
  70% {
    box-shadow: 0 0 0 12rpx rgba(255, 102, 116, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(255, 102, 116, 0);
  }
}

@keyframes audio-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

