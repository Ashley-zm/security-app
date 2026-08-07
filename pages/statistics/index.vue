<template>
  <view class="page" :style="{ paddingTop: `${statusBarHeight + 10}px` }">
    <view class="tabs">
      <view
        v-for="item in periods"
        :key="item.key"
        class="tab"
        :class="{ active: period === item.key }"
        @click="selectPeriod(item.key)"
        >{{ item.label }}</view
      >
    </view>
    <view v-if="period === 'custom'" class="custom-range">
      <view class="range-heading">
        <view>
          <text class="range-title">选择统计时间段</text>
          <text class="range-tip">默认查询最近一个月</text>
        </view>
        <text class="range-days">共 {{ selectedDays }} 天</text>
      </view>
      <view class="range-controls">
        <view class="date-picker" @click="openStartDatePicker">
          <view class="date-field">
            <text class="date-label">开始日期</text>
            <view class="date-value">
              <text>{{ startDate }}</text>
              <text class="calendar-icon">▦</text>
            </view>
          </view>
        </view>
        <text class="date-separator">至</text>
        <view class="date-picker" @click="openEndDatePicker">
          <view class="date-field">
            <text class="date-label">结束日期</text>
            <view class="date-value">
              <text>{{ endDate }}</text>
              <text class="calendar-icon">▦</text>
            </view>
          </view>
        </view>
        <button class="range-query" @click="applyCustomRange()">查询</button>
      </view>
    </view>

    <view class="metrics">
      <view class="metric">
        <text class="muted">完成工单数</text>
        <view>
          <b>{{ data.orders }}</b>
          <small>单</small>
        </view>
        <text class="ghost">☰</text>
      </view>
      <view class="metric">
        <text class="muted">完成用户数</text>
        <view>
          <b>{{ data.completed }}</b>
          <small>户</small>
        </view>
        <view class="people"><i /><i /><em /></view>
      </view>
      <view class="metric wide">
        <text class="muted">平均完成时长</text>
        <view>
          <b>{{ data.minutes }}</b>
          <small>min</small>
        </view>
        <view class="clock"><i /><em /></view>
      </view>
    </view>

    <view class="card goal-card">
      <view class="goal-heading">
        <view>
          <text class="title">{{
            period === "today" ? "今日目标进度" : "目标完成进度"
          }}</text>
          <text class="goal-subtitle">安检任务完成情况</text>
        </view>
        <view class="goal-status"><text class="status-dot" />进行中</view>
      </view>

      <view class="goal-main">
        <view class="donut-shell">
          <view class="donut" :style="donutStyle">
            <view class="donut-center">
              <text class="rate-value">{{ rate }}%</text>
              <text class="rate-label">目标达成</text>
            </view>
          </view>
        </view>
        <view class="goal-summary">
          <text class="completed-label">已完成安检</text>
          <view class="completed-value">
            <text>{{ data.completed }}</text>
            <text>户</text>
          </view>
          <text class="remaining-tip">
            距离目标还差 {{ remainingToGoal }} 户
          </text>
          <view class="mini-progress">
            <view :style="{ width: rate + '%' }" />
          </view>
        </view>
      </view>

      <view class="goal-stats">
        <view class="goal-stat target-stat">
          <view class="stat-icon">◎</view>
          <view>
            <text>目标户数</text>
            <text>{{ data.target }}<small>户</small></text>
          </view>
        </view>
        <view class="goal-stat failed-stat">
          <view class="stat-icon">!</view>
          <view>
            <text>安检失败</text>
            <text>{{ data.failed }}<small>户</small></text>
          </view>
        </view>
        <view class="goal-stat pending-stat">
          <view class="stat-icon">◷</view>
          <view>
            <text>待执行</text>
            <text>{{ pending }}<small>户</small></text>
          </view>
        </view>
      </view>
    </view>
    <view class="card trend-card">
      <view class="card-head">
        <text class="title">
          {{ period === "custom" ? "时间段安检趋势" : "近 5 日安检趋势" }}
        </text>
        <text class="unit-tag">单位/户</text>
      </view>
      <view class="chart">
        <view class="grid g1" /><view class="grid g2" /><view class="grid g3" />
        <view class="area" :style="{ clipPath: polygon }" />
        <view
          v-for="(line, index) in lines"
          :key="'l' + index"
          class="line"
          :style="line"
        />
        <view
          v-for="(point, index) in points"
          :key="'p' + index"
          class="point"
          :class="{ last: index === 4 }"
          :style="{ left: point.x + '%', top: point.y + '%' }"
        >
          <text class="bubble" :style="{ opacity: index === 4 ? 1 : 0.15 }">
            {{ point.value }}户
          </text>
        </view>
      </view>
      <view class="dates"
        ><text
          v-for="(item, index) in data.trend"
          :key="item.label"
          :class="{ today: index === 4 }"
          >{{ item.label }}</text
        ></view
      >
    </view>

    <view class="card rank-card">
      <text class="title">排查隐患类型排行</text>
      <view class="rank-list">
        <view v-for="item in data.ranks" :key="item.name">
          <view class="rank-head"
            ><text
              ><i :style="{ background: item.color }" />{{ item.name }}</text
            ><b>{{ item.value }}%</b></view
          >
          <view class="track"
            ><view :style="{ width: item.value + '%', background: item.color }"
          /></view>
        </view>
      </view>
    </view>
    <AppointmentTimePicker
      ref="startDatePickerRef"
      v-model="startDate"
      mode="date"
      title="选择开始日期"
      min-date="2020-01-01"
      :max-date="endDate"
      :allow-clear="false"
    />
    <AppointmentTimePicker
      ref="endDatePickerRef"
      v-model="endDate"
      mode="date"
      title="选择结束日期"
      :min-date="startDate"
      :max-date="today"
      :allow-clear="false"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import AppointmentTimePicker from "@/components/AppointmentTimePicker.vue";

type Period = "today" | "week" | "month" | "custom";
type Trend = { label: string; value: number };
type Rank = { name: string; value: number; color: string };
type Data = {
  orders: number;
  completed: number;
  minutes: number;
  target: number;
  failed: number;
  trend: Trend[];
  ranks: Rank[];
};

const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 0;
type DatePickerExpose = {
  open: (value?: string) => void;
};

const startDatePickerRef = ref<DatePickerExpose | null>(null);
const endDatePickerRef = ref<DatePickerExpose | null>(null);

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

const defaultEnd = new Date();
const defaultStart = new Date(defaultEnd);
defaultStart.setDate(defaultStart.getDate() - 30);
const today = formatDate(defaultEnd);
const startDate = ref(formatDate(defaultStart));
const endDate = ref(today);

const period = ref<Period>("today");
const periods: { key: Period; label: string }[] = [
  { key: "today", label: "今日" },
  { key: "week", label: "本周" },
  { key: "month", label: "本月" },
  { key: "custom", label: "自定义" },
];
const rankNames = [
  "橡胶软管老化",
  "缺少自闭阀门",
  "灶具无熄火保护",
  "钢管/阀门生锈",
];
const rankColors = ["#f43f65", "#ff9417", "#ff7849", "#ffc51b"];
const ranks = (values: number[]): Rank[] =>
  rankNames.map((name, i) => ({
    name,
    value: values[i],
    color: rankColors[i],
  }));

// 当前使用本地模拟数据，后续对接接口时替换此数据源即可。
const mock = reactive<Record<Period, Data>>({
  today: {
    orders: 26,
    completed: 81,
    minutes: 35,
    target: 100,
    failed: 10,
    trend: [
      { label: "06-06", value: 52 },
      { label: "06-07", value: 68 },
      { label: "06-08", value: 55 },
      { label: "06-09", value: 50 },
      { label: "今天", value: 81 },
    ],
    ranks: ranks([45, 25, 18, 12]),
  },
  week: {
    orders: 128,
    completed: 386,
    minutes: 32,
    target: 450,
    failed: 28,
    trend: [
      { label: "周一", value: 61 },
      { label: "周二", value: 75 },
      { label: "周三", value: 69 },
      { label: "周四", value: 82 },
      { label: "今天", value: 99 },
    ],
    ranks: ranks([42, 28, 19, 11]),
  },
  month: {
    orders: 486,
    completed: 1458,
    minutes: 30,
    target: 1800,
    failed: 126,
    trend: [
      { label: "第1周", value: 286 },
      { label: "第2周", value: 342 },
      { label: "第3周", value: 315 },
      { label: "第4周", value: 368 },
      { label: "本周", value: 412 },
    ],
    ranks: ranks([39, 27, 21, 13]),
  },
  custom: {
    orders: 312,
    completed: 936,
    minutes: 31,
    target: 1100,
    failed: 74,
    trend: [
      { label: "07-28", value: 156 },
      { label: "07-30", value: 183 },
      { label: "08-01", value: 175 },
      { label: "08-03", value: 201 },
      { label: "08-05", value: 221 },
    ],
    ranks: ranks([41, 26, 20, 13]),
  },
});
const data = computed(() => mock[period.value]);
const rate = computed(() =>
  Math.round((data.value.completed / data.value.target) * 100),
);
const pending = computed(() =>
  Math.max(0, data.value.target - data.value.completed - data.value.failed),
);
const remainingToGoal = computed(() =>
  Math.max(0, data.value.target - data.value.completed),
);
const donutStyle = computed(() => ({
  background: `conic-gradient(#315ff4 0%, #27b8ec ${rate.value}%, #e9eff8 ${rate.value}% 100%)`,
}));
const points = computed(() => {
  const values = data.value.trend.map((i) => i.value);
  const max = Math.max(...values) * 1.14;
  const min = Math.min(...values) * 0.8;
  return data.value.trend.map((item, i) => ({
    value: item.value,
    x: i * 25,
    y: ((max - item.value) / (max - min || 1)) * 74 + 8,
  }));
});
const lines = computed(() =>
  points.value.slice(0, -1).map((point, i) => {
    const next = points.value[i + 1];
    const dx = 155;
    const dy = (next.y - point.y) * 1.5;
    return {
      left: point.x + "%",
      top: point.y + "%",
      width: Math.sqrt(dx * dx + dy * dy) / 6.2 + "%",
      transform: `rotate(${(Math.atan2(dy, dx) * 180) / Math.PI}deg)`,
    };
  }),
);
const polygon = computed(
  () =>
    `polygon(${points.value.map((p) => `${p.x}% ${p.y}%`).join(",")},100% 100%,0 100%)`,
);

const selectedDays = computed(
  () =>
    Math.floor(
      (parseDate(endDate.value).getTime() -
        parseDate(startDate.value).getTime()) /
        86400000,
    ) + 1,
);

function selectPeriod(value: Period) {
  period.value = value;
}

function openStartDatePicker() {
  startDatePickerRef.value?.open(startDate.value);
}

function openEndDatePicker() {
  endDatePickerRef.value?.open(endDate.value);
}

function applyCustomRange(showToast = true) {
  const days = selectedDays.value;
  const target = Math.max(100, days * 36);
  const completed = Math.round(target * (0.78 + (days % 8) / 100));
  const failed = Math.min(
    target - completed,
    Math.max(6, Math.round(target * 0.07)),
  );
  const start = parseDate(startDate.value);
  const span = Math.max(
    0,
    parseDate(endDate.value).getTime() - start.getTime(),
  );
  const trendFactors = [0.78, 0.96, 0.88, 1.08, 1.18];

  Object.assign(mock.custom, {
    orders: Math.round(completed / 3),
    completed,
    minutes: 28 + (days % 6),
    target,
    failed,
    trend: trendFactors.map((factor, index) => {
      const date = new Date(start.getTime() + (span * index) / 4);
      return {
        label: formatDate(date).slice(5),
        value: Math.max(1, Math.round((completed / 5) * factor)),
      };
    }),
    ranks: ranks([41, 26, 20, 13]),
  });

  if (showToast) {
    uni.showToast({ title: "统计时间已更新", icon: "none" });
  }
}

applyCustomRange(false);
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 0 24rpx calc(40rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  background: #f4f7fc;
}
.tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6rpx;
  padding: 10rpx;
  border-radius: 25rpx;
  background: #fff;
  box-shadow: 0 8rpx 24rpx rgba(35, 70, 130, 0.06);
}
.tab {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 68rpx;
  border-radius: 18rpx;
  color: #71809e;
  font-size: 24rpx;
  font-weight: 600;
}
.tab.active {
  color: #fff;
  background: linear-gradient(135deg, #246cf5, #4656e8);
  box-shadow: 0 8rpx 18rpx rgba(53, 91, 235, 0.26);
}
.custom-range {
  margin-top: 22rpx;
  padding: 26rpx;
  border: 1rpx solid #dce7fa;
  border-radius: 25rpx;
  background:
    linear-gradient(
      135deg,
      rgba(235, 243, 255, 0.9),
      rgba(255, 255, 255, 0.96)
    ),
    #fff;
  box-shadow: 0 10rpx 26rpx rgba(37, 91, 183, 0.07);
}
.range-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.range-title {
  display: block;
  color: #19355f;
  font-size: 24rpx;
  font-weight: 800;
}
.range-tip {
  display: block;
  margin-top: 6rpx;
  color: #92a0b6;
  font-size: 19rpx;
}
.range-days {
  padding: 6rpx 13rpx;
  border-radius: 16rpx;
  color: #2872ef;
  font-size: 19rpx;
  font-weight: 700;
  background: #e5efff;
}
.range-controls {
  display: flex;
  align-items: flex-end;
  gap: 12rpx;
  margin-top: 23rpx;
}
.date-picker {
  flex: 1;
  min-width: 0;
}
.date-field {
  height: 82rpx;
  padding: 12rpx 16rpx;
  border: 1rpx solid #dfe6f2;
  border-radius: 16rpx;
  box-sizing: border-box;
  background: #fff;
}
.date-label {
  display: block;
  color: #96a2b5;
  font-size: 17rpx;
}
.date-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 5rpx;
  color: #314866;
  font-size: 21rpx;
  font-weight: 700;
  white-space: nowrap;
}
.calendar-icon {
  margin-left: 5rpx;
  color: #6b8fc8;
  font-size: 22rpx;
}
.date-separator {
  padding-bottom: 28rpx;
  color: #95a2b6;
  font-size: 19rpx;
}
.range-query {
  flex: 0 0 92rpx;
  height: 82rpx;
  padding: 0;
  border-radius: 17rpx;
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
  line-height: 82rpx;
  background: linear-gradient(135deg, #286ff1, #465ce8);
  box-shadow: 0 8rpx 17rpx rgba(45, 95, 225, 0.2);
}
.range-query::after {
  border: 0;
}
.range-query:active {
  opacity: 0.86;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20rpx;
  margin-top: 28rpx;
}
.metric {
  position: relative;
  height: 190rpx;
  padding: 30rpx 26rpx;
  overflow: hidden;
  box-sizing: border-box;
  border-radius: 26rpx;
  background: #fff;
}
.metric.wide {
  grid-column: 1/-1;
  height: 166rpx;
}
.muted {
  color: #8290aa;
  font-size: 24rpx;
}
.metric > view:nth-child(2) {
  display: flex;
  align-items: baseline;
  margin-top: 26rpx;
}
.metric b {
  color: #246cf4;
  font-size: 54rpx;
  line-height: 1;
}
.metric small {
  margin-left: 7rpx;
  color: #7790ba;
  font-size: 22rpx;
  font-weight: 600;
}
.ghost {
  position: absolute;
  right: -2rpx;
  bottom: -5rpx;
  width: 90rpx;
  height: 90rpx;
  border-radius: 17rpx 0 0;
  color: #fff;
  font-size: 68rpx;
  line-height: 78rpx;
  text-align: center;
  background: #eff1f4;
}
.people {
  position: absolute;
  right: -3rpx;
  bottom: -4rpx;
  width: 100rpx;
  height: 90rpx;
  opacity: 0.7;
}
.people i {
  position: absolute;
  top: 5rpx;
  width: 30rpx;
  height: 30rpx;
  border-radius: 50%;
  background: #e3e5e9;
}
.people i:first-child {
  left: 12rpx;
}
.people i:nth-child(2) {
  right: 11rpx;
}
.people em {
  position: absolute;
  right: 3rpx;
  bottom: 0;
  width: 98rpx;
  height: 43rpx;
  border-radius: 50% 50% 8rpx 8rpx;
  background: #e3e5e9;
}
.clock {
  position: absolute !important;
  right: -8rpx;
  bottom: -11rpx;
  width: 94rpx;
  height: 94rpx;
  margin: 0 !important;
  border: 10rpx solid #e7e8eb;
  border-radius: 50%;
  opacity: 0.7;
}
.clock i,
.clock em {
  position: absolute;
  left: 34rpx;
  width: 6rpx;
  border-radius: 4rpx;
  background: #e7e8eb;
  transform-origin: 50% 100%;
}
.clock i {
  top: 15rpx;
  height: 25rpx;
}
.clock em {
  top: 29rpx;
  height: 28rpx;
  transform: rotate(125deg);
}
.card {
  margin-top: 28rpx;
  padding: 34rpx;
  border-radius: 34rpx;
  box-sizing: border-box;
  background: #fff;
}
.title {
  color: #112445;
  font-size: 27rpx;
  font-weight: 800;
}
.goal-card {
  position: relative;
  overflow: hidden;
  border: 1rpx solid rgba(218, 228, 247, 0.8);
  background:
    radial-gradient(
      circle at 100% 0,
      rgba(80, 131, 255, 0.12),
      transparent 36%
    ),
    #fff;
  box-shadow: 0 14rpx 34rpx rgba(30, 73, 151, 0.08);
}
.goal-card::after {
  position: absolute;
  top: -66rpx;
  right: -54rpx;
  width: 160rpx;
  height: 160rpx;
  border: 22rpx solid rgba(91, 139, 255, 0.05);
  border-radius: 50%;
  content: "";
  pointer-events: none;
}
.goal-heading {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.goal-subtitle {
  display: block;
  margin-top: 8rpx;
  color: #93a0b6;
  font-size: 20rpx;
}
.goal-status {
  display: flex;
  align-items: center;
  height: 46rpx;
  padding: 0 17rpx;
  border: 1rpx solid #cfeee8;
  border-radius: 24rpx;
  color: #0a9f83;
  font-size: 20rpx;
  font-weight: 600;
  background: #edfbf7;
}
.status-dot {
  width: 9rpx;
  height: 9rpx;
  margin-right: 9rpx;
  border-radius: 50%;
  background: #17b897;
  box-shadow: 0 0 0 6rpx rgba(23, 184, 151, 0.11);
}
.goal-main {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 44rpx;
  margin-top: 34rpx;
  padding: 8rpx 14rpx 30rpx;
}
.donut-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 226rpx;
  width: 226rpx;
  height: 226rpx;
  border-radius: 50%;
  background: rgba(238, 244, 255, 0.75);
  box-shadow: 0 12rpx 28rpx rgba(51, 108, 226, 0.09);
}
.donut {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 206rpx;
  height: 206rpx;
  border-radius: 50%;
  transform: rotate(-35deg);
}
.donut-center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 158rpx;
  height: 158rpx;
  border-radius: 50%;
  background: #fff;
  box-shadow: inset 0 0 0 1rpx #edf2fa;
  transform: rotate(35deg);
}
.rate-value {
  color: #193b7a;
  font-size: 46rpx;
  font-weight: 900;
  line-height: 1;
}
.rate-label {
  margin-top: 9rpx;
  color: #8796ae;
  font-size: 19rpx;
}
.goal-summary {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}
.completed-label {
  color: #71819d;
  font-size: 22rpx;
}
.completed-value {
  display: flex;
  align-items: baseline;
  margin-top: 9rpx;
  color: #286ef0;
}
.completed-value text:first-child {
  font-size: 52rpx;
  font-weight: 900;
  line-height: 1;
}
.completed-value text:last-child {
  margin-left: 9rpx;
  font-size: 21rpx;
  font-weight: 600;
}
.remaining-tip {
  margin-top: 18rpx;
  color: #8997ad;
  font-size: 20rpx;
}
.mini-progress {
  height: 12rpx;
  margin-top: 18rpx;
  overflow: hidden;
  border-radius: 8rpx;
  background: #e9eef7;
}
.mini-progress view {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #315ff4, #27b8ec);
  box-shadow: 0 3rpx 8rpx rgba(49, 95, 244, 0.2);
  transition: width 0.25s ease;
}
.goal-stats {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  padding-top: 26rpx;
  border-top: 1rpx solid #edf1f7;
}
.goal-stat {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 0;
  padding: 18rpx 13rpx;
  border-radius: 18rpx;
  background: #f6f8fc;
}
.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 38rpx;
  width: 38rpx;
  height: 38rpx;
  border-radius: 12rpx;
  color: #587092;
  font-size: 22rpx;
  font-weight: 800;
  background: #e8edf5;
}
.goal-stat > view:last-child {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.goal-stat > view:last-child > text:first-child {
  color: #8694aa;
  font-size: 18rpx;
  white-space: nowrap;
}
.goal-stat > view:last-child > text:last-child {
  margin-top: 4rpx;
  color: #263c5d;
  font-size: 27rpx;
  font-weight: 800;
}
.goal-stat small {
  margin-left: 4rpx;
  font-size: 16rpx;
  font-weight: 500;
}
.failed-stat {
  background: #fff5f6;
}
.failed-stat .stat-icon {
  color: #ef5369;
  background: #ffe3e7;
}
.failed-stat > view:last-child > text:last-child {
  color: #e94860;
}
.pending-stat {
  background: #fff9ee;
}
.pending-stat .stat-icon {
  color: #e9a11b;
  background: #ffedc9;
}
.pending-stat > view:last-child > text:last-child {
  color: #d88d0b;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.unit-tag {
  padding: 5rpx 13rpx;
  border-radius: 9rpx;
  color: #92a1b9;
  font-size: 19rpx;
  background: #f1f4f8;
}
.chart {
  position: relative;
  height: 158rpx;
  margin: 45rpx 5rpx 0;
}
.grid {
  position: absolute;
  right: 0;
  left: 0;
  border-top: 1rpx dashed #e8edf5;
}
.g1 {
  top: 8%;
}
.g2 {
  top: 48%;
}
.g3 {
  top: 88%;
}
.area {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(51, 123, 255, 0.15),
    rgba(51, 123, 255, 0.01)
  );
}
.line {
  position: absolute;
  z-index: 2;
  height: 5rpx;
  border-radius: 5rpx;
  background: #2876ff;
  transform-origin: left center;
}
.point {
  position: absolute;
  z-index: 3;
  width: 15rpx;
  height: 15rpx;
  margin: -7rpx 0 0 -7rpx;
  border: 4rpx solid #2876ff;
  border-radius: 50%;
  box-sizing: border-box;
  background: #fff;
}
.point.last {
  width: 20rpx;
  height: 20rpx;
  margin: -10rpx 0 0 -10rpx;
  border: 0;
  background: #f04459;
}
.bubble {
  position: absolute;
  bottom: 25rpx;
  left: 50%;
  padding: 5rpx 12rpx;
  border-radius: 7rpx;
  color: #fff;
  font-size: 18rpx;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  background: #162846;
  transform: translateX(-50%);
}
.dates {
  display: flex;
  justify-content: space-between;
  margin-top: 18rpx;
  color: #8796b0;
  font-size: 19rpx;
}
.dates .today {
  color: #1e6fff;
  font-weight: 800;
}
.rank-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  margin-top: 30rpx;
}
.rank-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10rpx;
  color: #162846;
  font-size: 21rpx;
}
.rank-head text {
  display: flex;
  align-items: center;
  color: #344664;
  font-size: 22rpx;
  font-weight: 600;
}
.rank-head i {
  width: 14rpx;
  height: 14rpx;
  margin-right: 13rpx;
  border-radius: 50%;
}
.track {
  height: 15rpx;
  overflow: hidden;
  border-radius: 10rpx;
  background: #edf1f6;
}
.track view {
  height: 100%;
  border-radius: inherit;
  transition: width 0.25s;
}
@media screen and (max-width: 360px) {
  .goal-main {
    gap: 20rpx;
    padding-right: 4rpx;
    padding-left: 4rpx;
  }
  .donut-shell {
    flex-basis: 196rpx;
    width: 196rpx;
    height: 196rpx;
  }
  .donut {
    width: 178rpx;
    height: 178rpx;
  }
  .donut-center {
    width: 138rpx;
    height: 138rpx;
  }
  .rate-value {
    font-size: 40rpx;
  }
  .goal-stats {
    gap: 8rpx;
  }
  .goal-stat {
    gap: 7rpx;
    padding-right: 8rpx;
    padding-left: 8rpx;
  }
}
</style>
