<template>
  <view v-if="photos.length" class="photo-list">
    <view v-for="photo in photos" :key="photo.id" class="photo-card">
      <image
        class="photo-image"
        :src="photo.localPath || photo.fileUrl"
        mode="aspectFill"
        @click="preview(photo)"
      />
      <view v-if="photo.uploadStatus !== 'success'" class="photo-mask">
        {{ statusText(photo) }}
      </view>
      <button
        v-if="photo.uploadStatus === 'failed'"
        class="retry"
        @click.stop="$emit('retry', photo.id)"
      >
        重试
      </button>
      <button class="remove" @click.stop="$emit('remove', photo.id)">×</button>
    </view>
  </view>
</template>
<script setup lang="ts">
import type { InspectionPhoto } from "@/modules/work-order/inspection/types";
const props = defineProps<{ photos: InspectionPhoto[] }>();
defineEmits<{ retry: [id: string]; remove: [id: string] }>();
function statusText(photo: InspectionPhoto) {
  return photo.uploadStatus === "failed"
    ? "上传失败"
    : photo.uploadStatus === "uploading"
      ? "上传中"
      : "待上传";
}
function preview(photo: InspectionPhoto) {
  const current = photo.localPath || photo.fileUrl;
  const urls = props.photos
    .map((item) => item.localPath || item.fileUrl)
    .filter((item): item is string => Boolean(item));
  if (current) uni.previewImage({ current, urls });
}
</script>
<style scoped lang="scss">
.photo-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 20rpx;
}
.photo-card {
  position: relative;
  width: 150rpx;
  height: 150rpx;
  overflow: hidden;
  border-radius: 16rpx;
  background: #eef3fb;
}
.photo-image {
  width: 100%;
  height: 100%;
}
.photo-mask {
  position: absolute;
  inset: auto 0 0;
  padding: 8rpx;
  color: #fff;
  font-size: 20rpx;
  text-align: center;
  background: rgba(20, 32, 55, 0.65);
}
button::after {
  border: 0;
}
.remove,
.retry {
  position: absolute;
  padding: 0;
  color: #fff;
  background: rgba(22, 39, 72, 0.72);
}
.remove {
  top: 6rpx;
  right: 6rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  font-size: 28rpx;
  line-height: 34rpx;
}
.retry {
  right: 8rpx;
  bottom: 36rpx;
  height: 38rpx;
  padding: 0 12rpx;
  border-radius: 18rpx;
  font-size: 20rpx;
  line-height: 38rpx;
}
</style>
