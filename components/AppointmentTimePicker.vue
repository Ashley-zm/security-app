<template>
  <uni-popup
    ref="popupRef"
    type="bottom"
    :safe-area="false"
    @mask-click="cancel"
  >
    <view class="picker-panel">
      <view class="picker-handle" />
      <view class="picker-header">
        <button class="header-action cancel-action" @click="cancel">
          取消
        </button>
        <text class="picker-title">{{ title }}</text>
        <button class="header-action confirm-action" @click="confirm">
          确定
        </button>
      </view>
      <view class="selected-preview">
        <text class="preview-label">已选择</text>
        <text class="preview-value">{{ preview }}</text>
      </view>
      <picker-view
        v-if="mode === 'date'"
        class="picker-view"
        :value="dateIndexes"
        indicator-class="picker-indicator"
        @change="handleDatePickerChange"
      >
        <picker-view-column>
          <view v-for="item in yearOptions" :key="item" class="picker-option"
            >{{ item }} 年</view
          >
        </picker-view-column>
        <picker-view-column>
          <view v-for="item in monthOptions" :key="item" class="picker-option"
            >{{ pad(item) }} 月</view
          >
        </picker-view-column>
        <picker-view-column>
          <view v-for="item in dayOptions" :key="item" class="picker-option"
            >{{ pad(item) }} 日</view
          >
        </picker-view-column>
      </picker-view>
      <picker-view
        v-else
        class="picker-view"
        :value="selectedIndexes"
        indicator-class="picker-indicator"
        @change="handlePickerChange"
      >
        <picker-view-column>
          <view
            v-for="item in dateOptions"
            :key="item.value"
            class="picker-option"
          >
            {{ item.label }}
          </view>
        </picker-view-column>
        <picker-view-column>
          <view v-for="item in hourOptions" :key="item" class="picker-option">
            {{ item }} 时
          </view>
        </picker-view-column>
        <picker-view-column>
          <view v-for="item in minuteOptions" :key="item" class="picker-option">
            {{ item }} 分
          </view>
        </picker-view-column>
      </picker-view>
      <view v-if="allowClear" class="picker-footer">
        <button class="clear-action" @click="clearValue">
          {{ mode === "date" ? "清除日期" : "清除预约时间" }}
        </button>
      </view>
    </view>
  </uni-popup>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

interface DateOption {
  value: string;
  label: string;
}

interface PickerChangeEvent {
  detail: { value: number[] };
}

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    title?: string;
    mode?: "date" | "datetime";
    minDate?: string;
    maxDate?: string;
    maxDays?: number;
    minuteStep?: number;
    allowClear?: boolean;
  }>(),
  {
    modelValue: "",
    title: "选择预约时间",
    mode: "datetime",
    minDate: "",
    maxDate: "",
    maxDays: 365,
    minuteStep: 5,
    allowClear: true,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  confirm: [value: string];
  cancel: [];
}>();

const popupRef = ref<{ open: () => void; close: () => void } | null>(null);
const selectedIndexes = ref([0, 0, 0]);
const dateIndexes = ref([0, 0, 0]);
const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const dateOptions = computed<DateOption[]>(() => {
  const start = parseDate(props.minDate) || startOfToday();
  return Array.from({ length: Math.max(1, props.maxDays + 1) }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const value = formatDate(date);
    const prefix =
      index === 0 && value === formatDate(startOfToday()) ? "今天 " : "";
    return {
      value,
      label: `${prefix}${pad(date.getMonth() + 1)}月${pad(date.getDate())}日 ${weekdays[date.getDay()]}`,
    };
  });
});
const hourOptions = Array.from({ length: 24 }, (_, index) => pad(index));
const minuteOptions = computed(() => {
  const step = Math.min(30, Math.max(1, props.minuteStep));
  return Array.from({ length: Math.ceil(60 / step) }, (_, index) =>
    pad(index * step),
  );
});
const minSelectableDate = computed(() => parseDate(props.minDate));
const maxSelectableDate = computed(() => parseDate(props.maxDate));
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  const startYear = minSelectableDate.value?.getFullYear() || currentYear - 30;
  const endYear = maxSelectableDate.value?.getFullYear() || currentYear + 1;
  return Array.from(
    { length: Math.max(1, endYear - startYear + 1) },
    (_, index) => startYear + index,
  );
});
const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1);
const dayOptions = computed(() => {
  const year =
    yearOptions.value[dateIndexes.value[0]] || new Date().getFullYear();
  const month = monthOptions[dateIndexes.value[1]] || 1;
  return Array.from(
    { length: new Date(year, month, 0).getDate() },
    (_, index) => index + 1,
  );
});
const selectedDateOnlyValue = computed(() => {
  const year =
    yearOptions.value[dateIndexes.value[0]] || new Date().getFullYear();
  const month = monthOptions[dateIndexes.value[1]] || 1;
  const day = dayOptions.value[dateIndexes.value[2]] || 1;
  return [year, pad(month), pad(day)].join("-");
});
const selectedDate = computed(
  () => dateOptions.value[selectedIndexes.value[0]] || dateOptions.value[0],
);
const selectedHour = computed(
  () => hourOptions[selectedIndexes.value[1]] || "00",
);
const selectedMinute = computed(
  () => minuteOptions.value[selectedIndexes.value[2]] || "00",
);
const selectedValue = computed(
  () =>
    `${selectedDate.value.value} ${selectedHour.value}:${selectedMinute.value}`,
);
const preview = computed(() =>
  props.mode === "date"
    ? selectedDateOnlyValue.value
    : selectedDate.value.label +
      " " +
      selectedHour.value +
      ":" +
      selectedMinute.value,
);

function open(value = props.modelValue) {
  syncSelectedValue(value);
  popupRef.value?.open();
}

function syncSelectedValue(value: string) {
  if (props.mode === "date") {
    syncDateValue(value);
    return;
  }
  const matched = String(value || "")
    .trim()
    .match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}):(\d{2})/);
  const now = new Date();
  const dateValue = matched?.[1] || formatDate(now);
  const hourValue = matched?.[2] || pad(now.getHours());
  const rawMinute = Number(matched?.[3] || now.getMinutes());
  const minuteIndex = nearestMinuteIndex(rawMinute);
  const dateIndex = dateOptions.value.findIndex(
    (item) => item.value === dateValue,
  );
  const hourIndex = hourOptions.indexOf(hourValue);
  selectedIndexes.value = [
    Math.max(0, dateIndex),
    Math.max(0, hourIndex),
    minuteIndex,
  ];
}

function syncDateValue(value: string) {
  const fallback = maxSelectableDate.value || new Date();
  const date = parseDate(String(value || "").slice(0, 10)) || fallback;
  const yearIndex = yearOptions.value.indexOf(date.getFullYear());
  dateIndexes.value = [
    Math.max(0, yearIndex),
    Math.max(0, date.getMonth()),
    Math.max(0, date.getDate() - 1),
  ];
}

function nearestMinuteIndex(minute: number) {
  let bestIndex = 0;
  minuteOptions.value.forEach((item, index) => {
    if (
      Math.abs(Number(item) - minute) <
      Math.abs(Number(minuteOptions.value[bestIndex]) - minute)
    ) {
      bestIndex = index;
    }
  });
  return bestIndex;
}

function handlePickerChange(event: PickerChangeEvent) {
  selectedIndexes.value = event.detail.value.map(Number);
}

function handleDatePickerChange(event: PickerChangeEvent) {
  const indexes = event.detail.value.map(Number);
  dateIndexes.value = indexes;
  if (indexes[2] >= dayOptions.value.length) {
    dateIndexes.value[2] = dayOptions.value.length - 1;
  }
}

function confirm() {
  const value =
    props.mode === "date" ? selectedDateOnlyValue.value : selectedValue.value;
  const date = parseDate(value.slice(0, 10));
  if (
    !date ||
    (minSelectableDate.value && date < minSelectableDate.value) ||
    (maxSelectableDate.value && date > maxSelectableDate.value)
  ) {
    uni.showToast({ title: "请选择有效日期", icon: "none" });
    return;
  }
  emit("update:modelValue", value);
  emit("confirm", value);
  popupRef.value?.close();
}

function cancel() {
  popupRef.value?.close();
  emit("cancel");
}

function clearValue() {
  emit("update:modelValue", "");
  emit("confirm", "");
  popupRef.value?.close();
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

defineExpose({ open, close: () => popupRef.value?.close() });
</script>

<style lang="scss" scoped>
.picker-panel {
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom);
  border-radius: 34rpx 34rpx 0 0;
  background: #fff;
  box-shadow: 0 -16rpx 40rpx rgba(20, 48, 96, 0.13);
}
.picker-handle {
  width: 72rpx;
  height: 8rpx;
  margin: 16rpx auto 8rpx;
  border-radius: 5rpx;
  background: #dce3ee;
}
.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 82rpx;
  padding: 0 28rpx;
  border-bottom: 1rpx solid #edf1f7;
}
.picker-title {
  color: #142a4d;
  font-size: 29rpx;
  font-weight: 800;
}
.header-action {
  min-width: 92rpx;
  padding: 0;
  font-size: 25rpx;
  line-height: 64rpx;
  background: transparent;
}
.header-action::after,
.clear-action::after {
  border: 0;
}
.cancel-action {
  color: #8491a7;
  text-align: left;
}
.confirm-action {
  color: #246ff2;
  font-weight: 700;
  text-align: right;
}
.selected-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  height: 78rpx;
  background: #f5f8fe;
}
.preview-label {
  padding: 5rpx 11rpx;
  border-radius: 10rpx;
  color: #5273a7;
  font-size: 18rpx;
  background: #e5edfa;
}
.preview-value {
  color: #245dbb;
  font-size: 25rpx;
  font-weight: 700;
}
.picker-view {
  width: 100%;
  height: 420rpx;
}
.picker-option {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #63718a;
  font-size: 26rpx;
}
.picker-indicator {
  height: 76rpx;
  border-top: 1rpx solid #e4eaf4;
  border-bottom: 1rpx solid #e4eaf4;
  background: rgba(239, 245, 255, 0.65);
}
.picker-footer {
  padding: 12rpx 28rpx 22rpx;
  border-top: 1rpx solid #f0f3f8;
}
.clear-action {
  height: 68rpx;
  color: #ef5268;
  font-size: 23rpx;
  line-height: 68rpx;
  background: #fff3f5;
}
</style>
