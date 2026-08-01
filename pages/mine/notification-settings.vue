<template>
  <view class="notification-page">
    <AppNavbar
      title="消息通知设置"
      :show-back="true"
      background-color="#ffffff"
    />
    <view class="settings-content">
      <view class="settings-section">
        <view class="section-title">工单通知</view>
        <view class="settings-card">
          <view
            v-for="item in orderSettings"
            :key="item.key"
            class="setting-row order-row"
          >
            <view class="setting-main">
              <view class="setting-icon" :class="item.iconClass">
                <image
                  class="setting-icon-image"
                  :src="item.icon"
                  mode="aspectFit"
                />
              </view>
              <view class="setting-copy">
                <text class="setting-title">{{ item.title }}</text>
                <text class="setting-desc">{{ item.description }}</text>
              </view>
            </view>
            <button
              class="setting-switch"
              :class="{ active: settings[item.key] }"
              :aria-label="item.title"
              @click="toggleSetting(item.key)"
            >
              <view class="switch-thumb" />
            </button>
          </view>
        </view>
      </view>

      <view class="settings-section">
        <view class="section-title">提醒方式</view>
        <view class="settings-card">
          <view class="setting-row">
            <view class="setting-main">
              <image
                class="line-icon"
                src="/static/images/mine/soundReminder.png"
                mode="aspectFit"
              />
              <text class="setting-title">声音提醒</text>
            </view>
            <button
              class="setting-switch"
              :class="{ active: settings.soundReminder }"
              aria-label="声音提醒"
              @click="toggleSetting('soundReminder')"
            >
              <view class="switch-thumb" />
            </button>
          </view>
          <view class="setting-row">
            <view class="setting-main">
              <image
                class="line-icon"
                src="/static/images/mine/vibrationReminder.png"
                mode="aspectFit"
              />
              <text class="setting-title">震动提醒</text>
            </view>
            <button
              class="setting-switch"
              :class="{ active: settings.vibrationReminder }"
              aria-label="震动提醒"
              @click="toggleSetting('vibrationReminder')"
            >
              <view class="switch-thumb" />
            </button>
          </view>
        </view>
      </view>

      <view class="settings-section">
        <view class="section-title">免打扰设置</view>
        <view class="settings-card">
          <view class="setting-row">
            <view class="setting-main">
              <image
                class="line-icon"
                src="/static/images/mine/doNotDisturb.png"
                mode="aspectFit"
              />
              <text class="setting-title">开启免打扰</text>
            </view>
            <button
              class="setting-switch"
              :class="{ active: settings.doNotDisturb }"
              aria-label="开启免打扰"
              @click="toggleSetting('doNotDisturb')"
            >
              <view class="switch-thumb" />
            </button>
          </view>
          <picker
            mode="time"
            :value="settings.quietStart"
            @change="handleTimeChange('quietStart', $event)"
          >
            <view class="setting-row time-row">
              <text class="time-label">开始时间</text>
              <view class="time-value">
                <text>{{ settings.quietStart }}</text>
                <text class="chevron">›</text>
              </view>
            </view>
          </picker>
          <picker
            mode="time"
            :value="settings.quietEnd"
            @change="handleTimeChange('quietEnd', $event)"
          >
            <view class="setting-row time-row">
              <text class="time-label">结束时间</text>
              <view class="time-value">
                <text>{{ settings.quietEnd }}</text>
                <text class="chevron">›</text>
              </view>
            </view>
          </picker>
        </view>
        <view class="quiet-tip">开启后，在免打扰时间段内不再收到消息提醒</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onUnmounted, reactive } from "vue";
import AppNavbar from "@/components/AppNavbar.vue";
import type {
  BooleanSettingKey,
  NotificationOrderSetting,
  NotificationSettings,
  TimeSettingKey,
} from "@/modules/mine/types";

const STORAGE_KEY = "CYC_NOTIFICATION_SETTINGS";

const defaults: NotificationSettings = {
  assignmentNotice: true,
  reassignmentNotice: true,
  cancellationNotice: true,
  soundReminder: true,
  vibrationReminder: true,
  doNotDisturb: false,
  quietStart: "22:00",
  quietEnd: "07:00",
};
const saved = uni.getStorageSync(STORAGE_KEY) as
  | Partial<NotificationSettings>
  | "";
const settings = reactive<NotificationSettings>({
  ...defaults,
  ...(saved && typeof saved === "object" ? saved : {}),
});
const orderSettings: NotificationOrderSetting[] = [

  {
    key: "assignmentNotice",
    title: "接收工单指派通知",
    description: "当有新工单指派给您时通知",
    icon: "/static/images/mine/assignment.png",
    iconClass: "icon-blue",
  },
  {
    key: "reassignmentNotice",
    title: "接收工单改派通知",
    description: "当工单被改派给您时通知",
    icon: "/static/images/mine/reassignment.png",
    iconClass: "icon-orange",
  },
  {
    key: "cancellationNotice",
    title: "接收工单取消通知",
    description: "当工单被取消时通知",
    icon: "/static/images/mine/cancellation.png",
    iconClass: "icon-green",
  },
];
function saveSettings() {
  uni.setStorageSync(STORAGE_KEY, { ...settings });
}

const soundPreview = uni.createInnerAudioContext();
soundPreview.src = "/static/audio/notification.mp3";
soundPreview.autoplay = false;

function playSoundPreview() {
  soundPreview.stop();
  soundPreview.seek(0);
  soundPreview.play();
}

onUnmounted(() => {
  soundPreview.destroy();
});

function playVibrationPreview() {
  uni.vibrateLong({
    success: function () {
      console.log("Vibration preview played successfully.");
    },
    fail: () => {
      console.log("Vibration not supported on this platform.");
    },
  });
}

function toggleSetting(key: BooleanSettingKey) {
  settings[key] = !settings[key];
  saveSettings();
  if (!settings[key]) return;
  if (key === "soundReminder") playSoundPreview();
  if (key === "vibrationReminder") playVibrationPreview();
}

function handleTimeChange(
  key: TimeSettingKey,
  event: { detail: { value: string } },
) {
  settings[key] = event.detail.value;
  saveSettings();
}
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";
.notification-page {
  min-height: 100vh;
  padding-bottom: calc(46rpx + env(safe-area-inset-bottom));
  background:
    radial-gradient(
      circle at 82% 20%,
      rgba(225, 237, 255, 0.8),
      transparent 34%
    ),
    $bg-page;
}
.settings-content {
  padding: 42rpx 36rpx 0;
}
.settings-section + .settings-section {
  margin-top: 42rpx;
}
.section-title {
  margin: 0 0 18rpx 10rpx;
  color: $text-main;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 42rpx;
}
.settings-card {
  overflow: hidden;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 10rpx 30rpx rgba(35, 84, 160, 0.035);
}
.setting-row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 98rpx;
  padding: 0 32rpx;
}
.setting-row::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 32rpx;
  height: 2rpx;
  background: $border-color;
  content: "";
}
.setting-row:last-child::after,
.settings-card > picker:last-child .setting-row::after {
  display: none;
}
.order-row {
  min-height: 128rpx;
}
.setting-main {
  display: flex;
  align-items: center;
  min-width: 0;
}
.setting-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.setting-title {
  color: $text-main;
  font-size: 29rpx;
  font-weight: 700;
  line-height: 40rpx;
}
.setting-desc {
  margin-top: 2rpx;
  color: $info-color;
  font-size: 23rpx;
  line-height: 32rpx;
}
.setting-icon {
  display: flex;
  flex: 0 0 68rpx;
  align-items: center;
  justify-content: center;
  width: 68rpx;
  height: 68rpx;
  margin-right: 28rpx;
  border-radius: 18rpx;
}
.icon-blue {
  background: linear-gradient(145deg, #36a5ff, #0879f8);
}
.icon-orange {
  background: linear-gradient(145deg, #ffbd42, #ff8613);
}
.icon-green {
  background: linear-gradient(145deg, #5cdaa5, #20b978);
}
.setting-icon-image {
  width: 38rpx;
  height: 38rpx;
}
.line-icon {
  position: relative;
  flex: 0 0 40rpx;
  width: 40rpx;
  height: 40rpx;
  margin-right: 28rpx;
}

.setting-switch {
  position: relative;
  flex: 0 0 88rpx;
  width: 88rpx;
  height: 52rpx;
  margin-left: 20rpx;
  padding: 0;
  border: 0;
  border-radius: 27rpx;
  background: #d8dee8;
  transition: background-color 0.18s ease;
}
.setting-switch::after {
  border: 0;
}
.setting-switch.active {
  background: #087ff5;
}
.switch-thumb {
  position: absolute;
  top: 5rpx;
  left: 5rpx;
  width: 42rpx;
  height: 42rpx;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2rpx 7rpx rgba(24, 51, 90, 0.25);
  transition: transform 0.18s ease;
}
.setting-switch.active .switch-thumb {
  transform: translateX(36rpx);
}
.setting-switch:active {
  opacity: 0.82;
}
.time-row {
  min-height: 96rpx;
  padding-left: 60rpx;
}
.time-label {
  color: $text-main;
  font-size: 28rpx;
  font-weight: 600;
}
.time-value {
  display: flex;
  align-items: center;
  gap: 12rpx;
  color: #6e80a2;
  font-size: 26rpx;
}
.chevron {
  color: #9ba9c1;
  font-size: 42rpx;
  font-weight: 300;
  line-height: 1;
}
.quiet-tip {
  margin: 20rpx 30rpx 0;
  color: #75829e;
  font-size: 23rpx;
  line-height: 34rpx;
}
button {
  line-height: normal;
}
</style>
