<template>
  <view v-if="visible" class="popup-mask" @click="$emit('cancel')">
    <view class="popup" @click.stop>
      <view class="popup-title">已拍照片</view>
      <text class="popup-subtitle">{{ itemName }}</text>

      <text class="photo-section-title">拍照上传</text>
      <scroll-view class="photo-scroll" scroll-y>
        <view class="photo-grid">
          <view v-for="photo in photos" :key="photo.id" class="photo-card">
            <image
              class="photo-preview"
              :src="photo.localPath || photo.fileUrl"
              mode="aspectFill"
              @click="preview(photo)"
            />
            <text
              v-if="photo.aiResult"
              :class="[
                'ai-status',
                photo.aiResult === '合规' ? 'success' : 'warning',
              ]"
            >
              <!-- v-if="photo.aiResult" -->
              <!-- AI:未识别到对象 -->
              AI:{{ photo.aiResult }}
            </text>
            <text class="upload-status">
              {{ statusText(photo) }}
            </text>
            <button
              v-if="photo.uploadStatus === 'failed'"
              class="photo-action retry-btn"
              @click="$emit('retry', photo.id)"
            >
              重试
            </button>
            <button
              class="photo-action delete-btn"
              :disabled="isDeleting(photo.id)"
              @click="$emit('remove', photo.id)"
            >
              {{ isDeleting(photo.id) ? "…" : "×" }}
            </button>
          </view>
          <view
            v-if="canContinue"
            class="add-photo-card"
            @click="$emit('capture')"
          >
            <image
              class="add-photo-icon"
              src="/static/images/work-order/add-image.png"
              mode="aspectFit"
            />
            <text class="add-photo-text">+添加图片</text>
          </view>
        </view>
      </scroll-view>
      <view class="remark-block">
        <text class="remark-label">备注信息</text>
        <textarea
          class="remark-input"
          :value="remark"
          :maxlength="200"
          auto-height
          placeholder="请输入该检查项的备注"
          @input="handleRemarkInput"
        />
      </view>

      <view class="popup-actions">
        <button class="popup-btn cancel" @click="$emit('cancel')">取消</button>
        <button class="popup-btn confirm" @click="$emit('confirm')">
          确认
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { InspectionPhoto } from "@/modules/work-order/inspection/types";

const props = defineProps<{
  visible: boolean;
  itemName: string;
  photos: InspectionPhoto[];
  remark: string;
  canContinue: boolean;
  deletingPhotoIds?: string[];
}>();

const emit = defineEmits<{
  cancel: [];
  confirm: [];
  capture: [];
  remove: [photoId: string];
  retry: [photoId: string];
  remarkChange: [value: string];
}>();

interface UniInputEvent extends Event {
  detail?: { value?: string | number };
}

function handleRemarkInput(event: Event) {
  const detailValue = (event as UniInputEvent).detail?.value;
  const targetValue = (event.target as HTMLTextAreaElement | null)?.value;
  emit("remarkChange", String(detailValue ?? targetValue ?? ""));
}

function isDeleting(photoId: string) {
  return props.deletingPhotoIds?.includes(photoId) === true;
}

function statusText(photo: InspectionPhoto) {
  if (photo.uploadStatus === "success") return "上传成功";
  if (photo.uploadStatus === "failed") return "上传失败";
  if (photo.uploadStatus === "uploading") return "上传中";
  return "待上传";
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
@import "@/styles/variables.scss";
@import "@/styles/mixins.scss";
.popup-mask {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: flex-end;
  background: rgba(11, 31, 68, 0.42);
}
.popup {
  box-sizing: border-box;
  width: 100%;
  max-height: 82vh;
  padding: 34rpx 30rpx calc(34rpx + env(safe-area-inset-bottom));
  border-radius: 34rpx 34rpx 0 0;
  background: #fff;
}
.popup-title {
  color: $text-main;
  font-size: 34rpx;
  font-weight: 800;
  text-align: center;
}
.popup-subtitle {
  display: block;
  margin-top: 8rpx;
  overflow: hidden;
  color: $info-color;
  font-size: 24rpx;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.photo-section-title {
  display: block;
  margin-top: 26rpx;
  color: #8291ab;
  font-size: 28rpx;
  font-weight: 700;
}
.photo-scroll {
  max-height: 34vh;
  margin-top: 16rpx;
}
.photo-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14rpx;
  padding: 2rpx;
}
.photo-card {
  position: relative;
  width: 100%;
  height: 160rpx;
  overflow: hidden;
  border-radius: 18rpx;
  background: #eaf0fa;
}
.photo-preview {
  width: 100%;
  height: 100%;
}
.ai-status {
  position: absolute;
  right: 0;
  top: 0;
  left: 0;
  padding: 8rpx;
  color: #fff;
  font-size: 20rpx;
  text-align: center;
  width: 65%;
  border-bottom-right-radius: 18rpx;
}
.success {
  background: rgba(28, 148, 92, 0.68);
}
.warning {
  background: rgba(255, 128, 0, 0.68);
}
.upload-status {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 8rpx;
  color: #fff;
  font-size: 20rpx;
  text-align: center;
  background: rgba(20, 32, 55, 0.68);
}
.photo-action {
  position: absolute;
  height: 38rpx;
  padding: 0 12rpx;
  border-radius: 19rpx;
  color: #fff;
  font-size: 20rpx;
  line-height: 38rpx;
  background: rgba(22, 39, 72, 0.75);
}
.photo-action::after,
.add-photo-card::after,
.popup-btn::after {
  border: 0;
}
.delete-btn {
  top: 7rpx;
  right: 7rpx;
  width: 38rpx;
  padding: 0;
  border-radius: 50%;
  font-size: 28rpx;
}

.delete-btn[disabled] {
  opacity: 0.65;
}
.retry-btn {
  right: 7rpx;
  bottom: 38rpx;
}
.add-photo-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  height: 160rpx;
  padding: 0;
  border: 2rpx solid #d9dee7;
  border-radius: 24rpx;
  background: #f5f7fa;
}
.add-photo-icon {
  width: 48rpx;
  height: 48rpx;
}
.add-photo-text {
  margin-top: 16rpx;
  color: #8b9ab4;
  font-size: 25rpx;
  line-height: 34rpx;
}
.remark-block {
  margin-top: 24rpx;
  padding: 22rpx;
  border-radius: 20rpx;
  background: #f7faff;
}
.remark-label {
  color: $text-main;
  font-size: 25rpx;
  font-weight: 700;
}
.remark-input {
  box-sizing: border-box;
  width: 100%;
  min-height: 82rpx;
  margin-top: 12rpx;
  padding: 16rpx 18rpx;
  border: 2rpx solid #e3eaf5;
  border-radius: 16rpx;
  color: $text-main;
  font-size: 24rpx;
  line-height: 34rpx;
  background: #fff;
}
.popup-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
  margin-top: 28rpx;
}
.popup-btn {
  @include flex-center;
  height: 86rpx;
  border-radius: 43rpx;
  font-size: 28rpx;
  font-weight: 700;
}
.popup-btn.cancel {
  color: $info-color;
  background: $info-bg;
}
.popup-btn.confirm {
  color: #fff;
  background: $confirm-btn-bg;
}
</style>

