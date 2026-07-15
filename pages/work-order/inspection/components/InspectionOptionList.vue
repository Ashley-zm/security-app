<template>
  <view class="option-list">
    <view
      v-for="option in enabledOptions"
      :key="String(option.id)"
      class="option-row"
      @click="toggle(option.id)"
    >
      <view class="option-copy">
        <text class="option-name">{{ option.subItemName }}</text>
        <text v-if="dangerLabel(option)" class="danger-label">
          【{{ dangerLabel(option) }}】
        </text>
      </view>
      <view
        class="selector"
        :class="{
          checked: isChecked(option.id),
          radio: inputType === INPUT_TYPE.RADIO,
        }"
      >
        <text v-if="isChecked(option.id)">✓</text>
      </view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed } from "vue";
import {
  INPUT_TYPE,
  SUB_ITEM_TYPE,
} from "@/pages/work-order/inspection/constants/inspection";
import type { DictDataVO } from "@/modules/common/types";
import { getDictLabelByValue } from "@/utils/common";
import type { InspectionTemplateSubItem } from "@/modules/work-order/inspection/types";
const props = defineProps<{
  options?: InspectionTemplateSubItem[];
  inputType: string;
  modelValue: string[];
  dangerLevelDict?: DictDataVO[];
}>();
const emit = defineEmits<{
  "update:modelValue": [value: string[]];
  change: [value: string[]];
}>();
const enabledOptions = computed(() =>
  (props.options || []).filter((item) => Number(item.enabled) === 1),
);
function isChecked(id: string | number) {
  return props.modelValue.includes(String(id));
}
function dangerLabel(option: InspectionTemplateSubItem) {
  if (
    String(option.subItemType) !== SUB_ITEM_TYPE.DANGER ||
    !option.dangerLevelName
  )
    return "";
  return (
    getDictLabelByValue(
      props.dangerLevelDict || [],
      String(option.dangerLevelName),
    ) || String(option.dangerLevelName)
  );
}
function toggle(id: string | number) {
  const value = String(id);
  const next =
    props.inputType === INPUT_TYPE.RADIO
      ? [value]
      : isChecked(value)
        ? props.modelValue.filter((item) => item !== value)
        : [...new Set([...props.modelValue, value])];
  emit("update:modelValue", next);
  emit("change", next);
}
</script>
<style scoped lang="scss">
.option-list {
  margin-top: 22rpx;
}
.option-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 0;
  border-top: 1rpx solid #edf1f8;
}
.option-copy {
  flex: 1;
  min-width: 0;
  line-height: 38rpx;
}
.option-name {
  color: #24375f;
  font-size: 27rpx;
  word-break: break-all;
}
.danger-label {
  color: #e85b69;
  font-size: 23rpx;
}
.selector {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 38rpx;
  width: 38rpx;
  height: 38rpx;
  border: 3rpx solid #bdc9de;
  border-radius: 8rpx;
  color: #fff;
  font-size: 24rpx;
}
.selector.radio {
  border-radius: 50%;
}
.selector.checked {
  border-color: #3578ed;
  background: #3578ed;
}
</style>
