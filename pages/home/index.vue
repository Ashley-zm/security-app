<template>
  <view class="home-page">
    <view class="hero" :style="heroStyle">
      <view class="hero-glow hero-glow-left" />
      <view class="hero-glow hero-glow-right" />
      <view class="hero-content">
        <view class="greeting-row">
          <text class="greeting">您好，{{ nickName }}安检员</text>
          <!-- <text class="greeting">您好，{{ userName }}安检员</text> -->
          <text class="date-pill">{{ currentDate }}</text>
        </view>

        <view class="agent-row">
          <view class="agent-copy">
            <text class="agent-title">AI Agent 安检</text>
            <text class="agent-subtitle">智能工具，高效安检</text>
          </view>
          <button class="agent-button" @click="goAgentCenter">
            <text>进入Agent中心</text>
            <text class="agent-arrow">→</text>
          </button>
        </view>
      </view>
    </view>

    <view class="statistics-card">
      <view class="summary-grid">
        <view class="summary-item">
          <text class="summary-label">今日待检</text>
          <text class="summary-value pending-value">
            {{ formatCount(statistics?.todayPendingCount) }}
          </text>
        </view>
        <view class="summary-item align-right">
          <text class="summary-label">高风险用户</text>
          <text class="summary-value risk-value">
            {{ formatCount(statistics?.highRiskUserCount) }}
          </text>
        </view>
      </view>

      <view class="card-divider" />

      <view class="overview-head">
        <text class="overview-title">今日安检概览</text>
        <!-- <text class="today-badge">今日</text> -->
      </view>

      <view class="overview-list">
        <view class="overview-item">
          <view class="overview-icon-wrap">
            <image
              class="overview-icon"
              src="/static/images/Neighborhood.svg"
              mode="aspectFit"
            />
          </view>
          <text class="overview-label">安检小区数</text>
          <text class="overview-count">
            {{ formatCount(statistics?.inspectionCommunityCount) }}
          </text>
        </view>

        <view class="overview-item">
          <view class="overview-icon-wrap">
            <image
              class="overview-icon"
              src="/static/images/households.svg"
              mode="aspectFit"
            />
          </view>
          <text class="overview-label">安检户数</text>
          <text class="overview-count">
            {{ formatCount(statistics?.inspectionUserCount) }}
          </text>
        </view>
      </view>

      <view class="loading-mask" v-if="loading && !statistics">
        <uni-load-more
          status="loading"
          color="#1677FF"
          content-text="数据加载中..."
        />
      </view>

      <view v-if="loadError && !loading" class="error-bar">
        <text class="error-text">{{ loadError }}</text>
        <button class="retry-button" @click="loadStatistics">重新加载</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import { getHomeStatisticsApi } from "@/modules/home/api";
import type { HomeStatistics } from "@/modules/home/types";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 0;
const statistics = ref<HomeStatistics | null>(null);
const loading = ref(false);
const loadError = ref("");
const currentDate = ref(formatCurrentDate());

const userName = computed(() => {
  const name = String(userStore.userInfo?.userName || "").trim();
  return name || "安检员";
});
const nickName = computed(() => {
  const name = String(userStore.userInfo?.nickName || "").trim();
  return name || "安检员";
});
const heroStyle = computed(() => ({
  paddingTop: `${statusBarHeight}px`,
}));

onShow(() => {
  currentDate.value = formatCurrentDate();
  void loadStatistics();
});

onPullDownRefresh(async () => {
  await loadStatistics();
  uni.stopPullDownRefresh();
});

async function loadStatistics() {
  if (loading.value) return;

  loading.value = true;
  loadError.value = "";
  try {
    statistics.value = await getHomeStatisticsApi();
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : "首页统计数据加载失败";
  } finally {
    loading.value = false;
  }
}

function formatCount(value: unknown) {
  if (value === undefined || value === null || value === "") return "--";
  const count = Number(value);
  return Number.isFinite(count) ? String(count) : "--";
}

function formatCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function goAgentCenter() {
  // uni.navigateTo({ url: "/pages/home/test-index" });
  uni.navigateTo({ url: "/pages/assistant/index" });
}
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.home-page {
  min-height: 100vh;
  padding-bottom: calc(42rpx + env(safe-area-inset-bottom));
  overflow: hidden;
  background: $bg-page;
}

.hero {
  position: relative;
  min-height: 442rpx;
  overflow: hidden;
  background: linear-gradient(135deg, #146fee 0%, #3190dfb8 100%);
}

.hero::after {
  position: absolute;
  right: -120rpx;
  bottom: -180rpx;
  width: 520rpx;
  height: 360rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  content: "";
  transform: rotate(-16deg);
}

.hero-content {
  position: relative;
  z-index: 2;
  padding: 48rpx 42rpx 150rpx;
}

.hero-glow {
  position: absolute;
  border-radius: 50%;
  // filter: blur(4rpx);
  pointer-events: none;
}

.hero-glow-left {
  top: 80rpx;
  left: -150rpx;
  width: 360rpx;
  height: 360rpx;
  background: rgba(25, 100, 220, 0.28);
}

.hero-glow-right {
  top: -180rpx;
  right: -90rpx;
  width: 420rpx;
  height: 420rpx;
  background: #5daafb40;
}

.greeting-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.greeting {
  color: rgba(255, 255, 255, 0.88);
  font-size: 27rpx;
  line-height: 38rpx;
}

.date-pill {
  padding: 5rpx 18rpx;
  border-radius: 9rpx;
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
  background: rgba(116, 159, 231, 0.36);
}

.agent-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  margin-top: 70rpx;
}

.agent-copy {
  min-width: 0;
}

.agent-title {
  display: block;
  color: #fff;
  font-size: 46rpx;
  font-weight: 800;
  line-height: 62rpx;
  letter-spacing: -1rpx;
  white-space: nowrap;
}

.agent-subtitle {
  display: block;
  margin-top: 5rpx;
  color: rgba(220, 233, 255, 0.78);
  font-size: 25rpx;
  line-height: 36rpx;
}

.agent-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  gap: 12rpx;
  width: 246rpx;
  height: 78rpx;
  padding: 0 16rpx;
  border: 2rpx solid rgba(208, 225, 255, 0.4);
  border-radius: 42rpx;
  color: #fff;
  font-size: 23rpx;
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(
    110deg,
    rgba(60, 132, 240, 0.52),
    rgba(53, 107, 206, 0.42)
  );
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.15);
}

.agent-button::after {
  border: 0;
}

.agent-button:active {
  opacity: 0.84;
}

.agent-arrow {
  margin-top: -2rpx;
  font-size: 31rpx;
  font-weight: 400;
}

.statistics-card {
  position: relative;
  z-index: 3;
  min-height: 830rpx;
  margin: -122rpx 38rpx 0;
  padding: 0 40rpx 52rpx;
  overflow: hidden;
  border: 1rpx solid rgba(225, 232, 244, 0.521);
  border-radius: 38rpx;
  backdrop-filter: blur(80rpx);
  background: linear-gradient(180deg, #ffffff00 0%, #ffffff 100%);
  box-shadow: $shadow-card;
  transition: opacity 0.2s ease;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: 72rpx 10rpx 60rpx;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.summary-item.align-right {
  align-items: flex-end;
}

.summary-label {
  color: rgba(239, 245, 255, 0.92);
  font-size: 24rpx;
  line-height: 34rpx;
}

.summary-value {
  margin-top: 10rpx;
  font-size: 52rpx;
  font-weight: 800;
  line-height: 60rpx;
}

.pending-value {
  color: #fff;
}

.risk-value {
  color: #ff3e51;
}

.card-divider {
  height: 2rpx;
  margin: 0 2rpx;
  background: rgba(215, 223, 236, 0.7);
}

.overview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 60rpx 2rpx 0;
}

.overview-title {
  color: $text-main;
  font-size: 31rpx;
  font-weight: 800;
  line-height: 44rpx;
}

.today-badge {
  padding: 8rpx 19rpx;
  border-radius: 11rpx;
  color: $primary-color;
  font-size: 21rpx;
  font-weight: 700;
  background: $primary-bg;
}

.overview-list {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  margin-top: 54rpx;
}

.overview-item {
  display: flex;
  align-items: center;
  min-height: 144rpx;
  padding: 0 34rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 12rpx 30rpx rgba(45, 82, 139, 0.035);
}

.overview-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 70rpx;
  width: 70rpx;
  height: 70rpx;
  border-radius: 20rpx;
  background: #edf3fb;
}

.overview-icon {
  width: 38rpx;
  height: 38rpx;
}

.overview-label {
  flex: 1;
  min-width: 0;
  margin-left: 28rpx;
  color: $text-main;
  font-size: 28rpx;
  font-weight: 700;
}

.overview-count {
  min-width: 62rpx;
  padding: 7rpx 17rpx;
  border-radius: 24rpx;
  color: #fff;
  font-size: 25rpx;
  font-weight: 700;
  line-height: 32rpx;
  text-align: center;
  background: $confirm-btn-bg;
}

.loading-mask {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  background: rgba(249, 251, 254, 0.86);
}

.error-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 30rpx;
  padding: 18rpx 22rpx;
  border-radius: 16rpx;
  background: #fff0f0;
}

.error-text {
  flex: 1;
  min-width: 0;
  color: #d84747;
  font-size: 22rpx;
  line-height: 32rpx;
}

.retry-button {
  flex-shrink: 0;
  color: #1677ff;
  font-size: 22rpx;
  font-weight: 700;
}

.retry-button::after {
  border: 0;
}

@media screen and (max-width: 360px) {
  .hero-content {
    padding-right: 30rpx;
    padding-left: 30rpx;
  }

  .agent-title {
    font-size: 40rpx;
  }

  .agent-button {
    width: 226rpx;
    font-size: 21rpx;
  }

  .statistics-card {
    margin-right: 28rpx;
    margin-left: 28rpx;
  }
}
</style>
