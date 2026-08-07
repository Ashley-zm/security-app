<template>
  <view v-if="visible" class="popup-mask" @click="handleMaskClick">
    <view class="unable-popup" @click.stop>
      <view class="popup-handle" />
      <text class="popup-title">无法安检</text>
      <text class="section-label">无法安检原因</text>
      <view class="reason-list">
        <button
          v-for="option in reasonOptions"
          :key="option.value"
          class="reason-option"
          :class="{ active: selectedReason === option.value }"
          :disabled="operating"
          @click="$emit('reasonChange', option.value)"
        >
          {{ option.label }}
        </button>
      </view>

      <text class="section-label photo-label">拍照上传</text>
      <view class="photo-grid">
        <view v-for="photo in photos" :key="photo.id" class="photo-card">
          <image
            class="photo-image"
            :src="photo.localPath || photo.fileUrl"
            mode="aspectFill"
            @click="previewPhoto(photo)"
          />
          <text class="photo-status">{{ getPhotoStatus(photo) }}</text>
          <button
            class="delete-photo"
            :disabled="operating || deletingPhotoIds.includes(photo.id)"
            @click="$emit('removePhoto', photo.id)"
          >
            {{ deletingPhotoIds.includes(photo.id) ? "…" : "×" }}
          </button>
        </view>
        <view
          v-if="photos.length < maxPhotoCount"
          class="add-photo"
          :class="{ disabled: operating }"
          @click="capturePhoto"
        >
          <image
            class="add-photo-icon"
            src="/static/images/work-order/add-image.png"
            mode="aspectFit"
          />
          <text class="add-photo-text">+添加图片</text>
        </view>
      </view>

      <text class="section-label remark-label">无法安检备注</text>
      <textarea
        class="remark-input"
        :value="remark"
        :maxlength="200"
        :disabled="operating"
        placeholder="请输入无法安检的补充说明"
        @input="handleRemarkInput"
      />

      <view class="popup-actions">
        <button
          class="popup-button cancel"
          :disabled="operating"
          @click="$emit('cancel')"
        >
          取消
        </button>
        <button
          class="popup-button confirm"
          :loading="operating"
          :disabled="operating"
          @click="$emit('confirm')"
        >
          {{ operating ? "提交中..." : "确定" }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { InspectionPhoto } from "@/modules/work-order/inspection/types";

interface UnableReasonOption {
  label: string;
  value: string;
}

const props = defineProps<{
  visible: boolean;
  reasonOptions: readonly UnableReasonOption[];
  selectedReason: string;
  remark: string;
  photos: InspectionPhoto[];
  maxPhotoCount: number;
  operating: boolean;
  deletingPhotoIds: string[];
}>();

const emit = defineEmits<{
  cancel: [];
  confirm: [];
  capture: [];
  reasonChange: [value: string];
  remarkChange: [value: string];
  removePhoto: [photoId: string];
}>();

interface UniTextareaEvent extends Event {
  detail?: { value?: string | number };
}

function handleMaskClick() {
  if (!props.operating) emit("cancel");
}

function capturePhoto() {
  if (!props.operating && props.photos.length < props.maxPhotoCount) {
    emit("capture");
  }
}

function handleRemarkInput(event: Event) {
  const detailValue = (event as UniTextareaEvent).detail?.value;
  const targetValue = (event.target as HTMLTextAreaElement | null)?.value;
  emit("remarkChange", String(detailValue ?? targetValue ?? ""));
}

function getPhotoStatus(photo: InspectionPhoto) {
  if (photo.uploadStatus === "uploading") return "上传中";
  if (photo.uploadStatus === "success") return "已上传";
  if (photo.uploadStatus === "failed") return "上传失败";
  return "";
}

function previewPhoto(photo: InspectionPhoto) {
  const current = photo.localPath || photo.fileUrl;
  const urls = props.photos
    .map((item) => item.localPath || item.fileUrl)
    .filter((url): url is string => Boolean(url));
  if (current) uni.previewImage({ current, urls });
}
</script>

<style scoped lang="scss">
@import "@/styles/variables.scss";

.popup-mask {
  position: fixed;
  inset: 0;
  z-index: 400;
  display: flex;
  align-items: flex-end;
  background: rgba(13, 32, 65, 0.46);
}

.unable-popup {
  box-sizing: border-box;
  width: 100%;
  max-height: 88vh;
  padding: 16rpx 28rpx calc(28rpx + env(safe-area-inset-bottom));
  overflow-y: auto;
  border-radius: 34rpx 34rpx 0 0;
  background: #fff;
  box-shadow: 0 -12rpx 40rpx rgba(25, 54, 103, 0.14);
}

.popup-handle {
  width: 72rpx;
  height: 8rpx;
  margin: 0 auto 18rpx;
  border-radius: 4rpx;
  background: #dce3ef;
}

.popup-title {
  display: block;
  color: #18335f;
  font-size: 34rpx;
  font-weight: 900;
  text-align: center;
}

.section-label {
  display: block;
  margin-top: 30rpx;
  color: #7e8faa;
  font-size: 24rpx;
  font-weight: 700;
}

.reason-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
  margin-top: 16rpx;
}

.reason-option {
  height: 70rpx;
  padding: 0;
  border: 2rpx solid #3476df;
  border-radius: 18rpx;
  color: #285aab;
  font-size: 25rpx;
  font-weight: 700;
  line-height: 68rpx;
  background: #fff;
}

.reason-option::after,
.delete-photo::after,
.popup-button::after {
  border: 0;
}

.reason-option.active {
  color: #fff;
  background: linear-gradient(100deg, #347cf0, #5572e9);
  box-shadow: 0 7rpx 18rpx rgba(54, 116, 225, 0.22);
}

.photo-label {
  margin-top: 28rpx;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 14rpx;
}

.photo-card,
.add-photo {
  position: relative;
  box-sizing: border-box;
  height: 142rpx;
  overflow: hidden;
  border-radius: 18rpx;
}

.photo-card {
  background: #eaf0f8;
}

.photo-image {
  width: 100%;
  height: 100%;
}

.photo-status {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 5rpx 2rpx;
  color: #fff;
  font-size: 18rpx;
  text-align: center;
  background: rgba(24, 42, 73, 0.66);
}

.delete-photo {
  position: absolute;
  top: 7rpx;
  right: 7rpx;
  width: 38rpx;
  height: 38rpx;
  padding: 0;
  border-radius: 50%;
  color: #fff;
  font-size: 27rpx;
  line-height: 36rpx;
  background: rgba(25, 39, 64, 0.72);
}

.add-photo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #d9e0eb;
  background: #f4f6f9;
}

.add-photo.disabled {
  opacity: 0.5;
}

.add-photo-icon {
  width: 42rpx;
  height: 42rpx;
}

.add-photo-text {
  margin-top: 10rpx;
  color: #8796ad;
  font-size: 21rpx;
}

.remark-label {
  margin-top: 28rpx;
}

.remark-input {
  box-sizing: border-box;
  width: 100%;
  height: 126rpx;
  margin-top: 14rpx;
  padding: 18rpx 20rpx;
  border-radius: 18rpx;
  color: #263d62;
  font-size: 24rpx;
  line-height: 34rpx;
  background: #f4f6f9;
}

.popup-actions {
  display: grid;
  grid-template-columns: 0.72fr 1fr;
  gap: 18rpx;
  margin-top: 30rpx;
}

.popup-button {
  height: 78rpx;
  border-radius: 39rpx;
  font-size: 27rpx;
  font-weight: 700;
  line-height: 78rpx;
}

.popup-button.cancel {
  color: #8a98ae;
  background: #f2f4f7;
}

.popup-button.confirm {
  color: #fff;
  background: linear-gradient(100deg, #347cf0, #4b72e8);
  box-shadow: 0 8rpx 20rpx rgba(53, 116, 227, 0.24);
}

.popup-button[disabled] {
  opacity: 0.58;
}
</style>
