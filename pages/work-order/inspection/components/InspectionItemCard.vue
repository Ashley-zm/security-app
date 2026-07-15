<template>
  <view
    :id="`inspection-item-${String(item.id)}`"
    class="item-card"
    :class="{ error: errorActive, completed: form.completed }"
  >
    <view class="item-head">
      <view class="item-icon-wrap">
        <image
          class="item-icon"
          src="/static/images/item.png"
          mode="aspectFit"
        />
      </view>
      <view class="item-copy">
        <text class="item-name">{{ item.itemName }}</text>
        <text v-if="item.itemDesc" class="item-desc">
          {{ item.itemDesc }}
        </text>
      </view>
      <button
        v-if="String(item.photoRule) !== PHOTO_RULE.NONE"
        class="photo-btn"
        :disabled="photoDisabled"
        @click="$emit('choosePhoto')"
      >
        <image
          class="camera-icon"
          src="/static/images/camera.png"
          mode="aspectFit"
        />
        <text>{{ form.photos.length }}/{{ maxPhotos }}</text>
      </button>
    </view>
    <InspectionOptionList
      v-if="showsOptions"
      :model-value="form.selectedSubItemIds"
      :options="item.subItemList"
      :input-type="String(item.inputType)"
      :danger-level-dict="dangerLevelDict"
      @update:model-value="$emit('optionChange', $event)"
    />
    <input
      v-else
      class="inspection-input"
      type="text"
      :maxlength="maxLength"
      :value="form.inputValue"
      :placeholder="placeholder"
      @input="onInput"
    />
    <text
      v-if="item.checkStandard && item.checkStandard !== placeholder"
      class="standard"
    >
      检查标准：{{ item.checkStandard }}
    </text>
    <text v-if="form.remark" class="standard"> 备注：{{ form.remark }} </text>
    <view v-if="form.aiSuggestion" class="ai-suggestion">
      <text class="ai-title">✦ AI 建议</text>
      <text class="ai-text">{{ form.aiSuggestion }}</text>
    </view>
    <view v-if="disposalMeasures.length" class="disposal-section">
      <view class="disposal-head">
        <view class="disposal-title-wrap">
          <!-- <text class="disposal-title-icon">✓</text> -->
          <text class="disposal-title">处置措施</text>
        </view>
        <text class="disposal-hint">可多选</text>
      </view>
      <view class="disposal-options">
        <view
          v-for="measure in disposalMeasures"
          :key="measure.dictValue"
          class="disposal-option"
          :class="{
            selected: isDisposalSelected(measure.dictValue),
          }"
          hover-class="disposal-option-hover"
          @click="toggleDisposalMeasure(measure.dictValue)"
        >
          <text class="disposal-label">{{ measure.dictLabel }}</text>
          <view class="disposal-check">
            <text
              v-if="isDisposalSelected(measure.dictValue)"
              class="disposal-checkmark"
            >
              ✓
            </text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed } from "vue";
import {
  DEFAULT_MAX_INPUT_LENGTH,
  INPUT_TYPE,
  PHOTO_RULE,
  normalizeMaxPhotoCount,
} from "@/pages/work-order/inspection/constants/inspection";
import type {
  InspectionFormItem,
  InspectionTemplateItem,
} from "@/modules/work-order/inspection/types";
import InspectionOptionList from "./InspectionOptionList.vue";
import type { DictDataVO } from "@/modules/common/types";
const props = defineProps<{
  item: InspectionTemplateItem;
  form: InspectionFormItem;
  errorActive?: boolean;
  dangerLevelDict?: DictDataVO[];
  disposalMeasureDict?: DictDataVO[];
}>();
const emit = defineEmits<{
  optionChange: [value: string[]];
  inputChange: [value: string];
  disposalChange: [value: string[]];
  choosePhoto: [];
  retryPhoto: [id: string];
  removePhoto: [id: string];
}>();
const allowedDisposalMeasureIds = computed(() => {
  const values = String(props.item.disposalMeasures || "")
    .split(/[,，]/)
    .map((value) => value.trim())
    .filter(Boolean);
  return [...new Set(values)];
});
const disposalMeasures = computed(() => {
  const allowed = new Set(allowedDisposalMeasureIds.value);
  return (props.disposalMeasureDict || []).filter((measure) =>
    allowed.has(String(measure.dictValue)),
  );
});
const selectedDisposalMeasureSet = computed(
  () => new Set(props.form.selectedDisposalMeasures.map(String)),
);
const maxPhotos = computed(() =>
  normalizeMaxPhotoCount(props.item.maxPhotoCount),
);
const photoDisabled = computed(
  () => props.form.photos.length >= maxPhotos.value,
);
const showsOptions = computed(
  () =>
    String(props.item.inputType) === INPUT_TYPE.RADIO ||
    String(props.item.inputType) === INPUT_TYPE.CHECKBOX,
);
const placeholder = computed(
  () => props.item.itemDesc || props.item.checkStandard || "请输入",
);
const maxLength = computed(() =>
  props.item.maxInputLength && props.item.maxInputLength > 0
    ? props.item.maxInputLength
    : DEFAULT_MAX_INPUT_LENGTH,
);
function isDisposalSelected(value: string) {
  return selectedDisposalMeasureSet.value.has(String(value));
}

function toggleDisposalMeasure(value: string) {
  const measureId = String(value);
  const selected = [...props.form.selectedDisposalMeasures].map(String);
  const next = selected.includes(measureId)
    ? selected.filter((id) => id !== measureId)
    : [...selected, measureId];
  emit("disposalChange", [...new Set(next)]);
}

interface UniInputEvent extends Event {
  detail?: { value?: string | number };
}

function onInput(event: Event) {
  // uni-app 的 input 事件使用 detail.value，target.value 仅作为 H5 兼容兜底。
  const detailValue = (event as UniInputEvent).detail?.value;
  const targetValue = (event.target as HTMLInputElement | null)?.value;
  emit("inputChange", String(detailValue ?? targetValue ?? ""));
}
</script>
<style scoped lang="scss">
.item-card {
  padding: 28rpx;
  margin-top: 22rpx;
  border: 3rpx solid transparent;
  border-radius: 28rpx;
  background: #fff;
  box-shadow: 0 8rpx 28rpx rgba(39, 76, 140, 0.07);
  transition: 0.2s;
}
.item-card.error {
  border-color: #ff6978;
  box-shadow: 0 0 0 8rpx rgba(255, 105, 120, 0.1);
}
.item-head {
  display: flex;
  align-items: flex-start;
  gap: 18rpx;
}
.item-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 72rpx;
  width: 72rpx;
  height: 72rpx;
  border-radius: 18rpx;
  background: #f0edff;
}
.item-icon {
  width: 46rpx;
  height: 46rpx;
}
.item-copy {
  flex: 1;
  min-width: 0;
}
.item-name,
.item-desc {
  display: block;
}
.item-name {
  color: #20375f;
  font-size: 29rpx;
  font-weight: 800;
  line-height: 40rpx;
}
.item-desc {
  margin-top: 6rpx;
  color: #8b9ab7;
  font-size: 23rpx;
  line-height: 34rpx;
}
.photo-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  flex: 0 0 auto;
  height: 58rpx;
  padding: 0 18rpx;
  border-radius: 18rpx;
  color: #3474de;
  font-size: 22rpx;
  line-height: 58rpx;
  background: #eaf3ff;
}
.camera-icon {
  flex: 0 0 28rpx;
  width: 28rpx;
  height: 28rpx;
}
.photo-btn::after {
  border: 0;
}
.photo-btn[disabled] {
  opacity: 0.45;
}
.inspection-input {
  box-sizing: border-box;
  width: 100%;
  height: 84rpx;
  margin-top: 24rpx;
  padding: 0 24rpx;
  border: 2rpx solid #e4eaf4;
  border-radius: 16rpx;
  color: #24375f;
  background: #f8faff;
}
.standard {
  display: block;
  margin-top: 12rpx;
  color: #96a4bd;
  font-size: 22rpx;
  line-height: 32rpx;
}
.ai-suggestion {
  margin-top: 24rpx;
  padding: 22rpx 24rpx;
  border-radius: 18rpx;
  background: #f2edff;
}
.ai-title,
.ai-text {
  display: block;
  color: #7353c8;
}
.ai-title {
  font-size: 24rpx;
  font-weight: 800;
}
.ai-text {
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 36rpx;
}
.disposal-section {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 2rpx solid #edf1f7;
}

.disposal-head,
.disposal-title-wrap {
  display: flex;
  align-items: center;
}

.disposal-head {
  justify-content: space-between;
}

.disposal-title-wrap {
  gap: 10rpx;
}

.disposal-title-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34rpx;
  height: 34rpx;
  border-radius: 10rpx;
  color: #fff;
  font-size: 21rpx;
  font-weight: 800;
  background: #6f65dc;
}

.disposal-title {
  color: #243b65;
  font-size: 25rpx;
  font-weight: 800;
}

.disposal-hint {
  color: #9aa7bd;
  font-size: 21rpx;
}

.disposal-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 18rpx;
}

.disposal-option {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
  width: calc(50% - 8rpx);
  min-height: 72rpx;
  padding: 14rpx 16rpx 14rpx 20rpx;
  border: 2rpx solid #e1e7f1;
  border-radius: 16rpx;
  background: #f8faff;
  transition: 0.2s;
}

.disposal-option.selected {
  border-color: #766be0;
  background: #f0eeff;
  box-shadow: 0 4rpx 14rpx rgba(104, 91, 210, 0.12);
}

.disposal-option-hover {
  opacity: 0.78;
}

.disposal-label {
  flex: 1;
  min-width: 0;
  color: #536582;
  font-size: 23rpx;
  line-height: 32rpx;
  word-break: break-all;
}

.disposal-option.selected .disposal-label {
  color: #584db9;
  font-weight: 700;
}

.disposal-check {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 32rpx;
  width: 32rpx;
  height: 32rpx;
  border: 2rpx solid #bdc7d8;
  border-radius: 9rpx;
  background: #fff;
}

.disposal-option.selected .disposal-check {
  border-color: #6f65dc;
  background: #6f65dc;
}

.disposal-checkmark {
  color: #fff;
  font-size: 21rpx;
  font-weight: 900;
  line-height: 1;
}
</style>
