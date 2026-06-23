<template>
  <view class="audio-record-page page safe-page">
    <AppNavbar title="录音测试" show-back />

    <view class="hero-card" :class="statusClass">
      <view class="hero-main">
        <view class="mic-orb">
          <view class="mic-head" />
          <view class="mic-stem" />
          <view class="mic-base" />
        </view>
        <view class="hero-copy">
          <text class="status-label">AudioRecordPlugin</text>
          <text class="status-title">{{ statusText }}</text>
          <text class="status-desc">{{ statusDesc }}</text>
        </view>
      </view>
      <view class="duration-row">
        <text class="duration-label">录音时长</text>
        <text class="duration-value">{{ formatDuration(duration) }}</text>
      </view>
    </view>

    <view class="card action-card">
      <view class="card-head">
        <view>
          <text class="card-title">录音操作</text>
          <text class="card-subtitle">{{ pluginStatus }}</text>
        </view>
        <text class="card-badge">{{ status }}</text>
      </view>

      <view class="button-row">
        <button class="action-btn primary" :disabled="status === 'recording' || operating" @click="startRecord">
          {{ operating && pendingAction === 'start' ? '启动中...' : '开始录音' }}
        </button>
        <button class="action-btn danger" :disabled="status !== 'recording' || operating" @click="stopRecord">
          {{ operating && pendingAction === 'stop' ? '结束中...' : '结束录音' }}
        </button>
      </view>
      <button class="sync-btn" :disabled="operating" @click="syncState">同步原生状态</button>

      <view v-if="errorMessage" class="error-box">{{ errorMessage }}</view>
    </view>

    <view class="card">
      <view class="card-head">
        <view>
          <text class="card-title">录音参数</text>
          <text class="card-subtitle">当前测试使用 AAC / MPEG-4 / m4a</text>
        </view>
      </view>
      <view class="param-grid">
        <view class="param-item">
          <text class="param-label">sampleRate</text>
          <text class="param-value">16000</text>
        </view>
        <view class="param-item">
          <text class="param-label">bitRate</text>
          <text class="param-value">64000</text>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="card-head">
        <view>
          <text class="card-title">录音文件</text>
          <text class="card-subtitle">结束录音后返回 App 专属目录文件路径</text>
        </view>
      </view>
      <view v-if="filePath" class="file-box">
        <text class="file-path" selectable>{{ filePath }}</text>
        <button class="copy-btn" @click="copyPath">复制路径</button>
      </view>
      <view v-else class="empty">暂无录音文件</view>
    </view>

    <view class="card">
      <view class="card-head">
        <view>
          <text class="card-title">最近回调</text>
          <text class="card-subtitle">展示插件 start / stop / state 返回值</text>
        </view>
      </view>
      <view v-if="lastResult" class="result-box">
        <text class="result-text">{{ lastResultText }}</text>
      </view>
      <view v-else class="empty">暂无回调</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppNavbar from '@/components/AppNavbar.vue'

type RecordStatus = 'idle' | 'recording' | 'stopped'
type PendingAction = 'start' | 'stop' | ''

interface RecordResult {
  success?: boolean
  status?: RecordStatus
  filePath?: string
  duration?: number
  message?: string
  [key: string]: unknown
}

interface AudioRecordPlugin {
  startRecord?: (
    options: {
      fileName?: string
      sampleRate?: number
      bitRate?: number
    },
    callback: (res?: RecordResult) => void
  ) => void
  stopRecord?: (options: Record<string, never>, callback: (res?: RecordResult) => void) => void
  getRecordState?: (options: Record<string, never>, callback: (res?: RecordResult) => void) => void
}

interface PlusRuntime {
  os?: {
    version?: string
  }
  android?: {
    requestPermissions?: (
      permissions: string[],
      success: (event: { granted?: string[] }) => void,
      fail: () => void
    ) => void
  }
}

let audioRecord: AudioRecordPlugin | null = null
let isAppPlusRuntime = false

// #ifdef APP-PLUS
isAppPlusRuntime = true
try {
  audioRecord = uni.requireNativePlugin('AudioRecordPlugin') as AudioRecordPlugin
} catch (error) {
  console.error('获取 AudioRecordPlugin 失败', error)
}
// #endif

const status = ref<RecordStatus>('idle')
const filePath = ref('')
const duration = ref(0)
const operating = ref(false)
const pendingAction = ref<PendingAction>('')
const errorMessage = ref('')
const lastResult = ref<RecordResult | null>(null)
let durationTimer: ReturnType<typeof setInterval> | null = null

const pluginStatus = computed(() => {
  if (!isAppPlusRuntime) {
    return '当前环境不支持原生录音插件，请使用 App 自定义基座'
  }
  return audioRecord ? 'AudioRecordPlugin 已加载' : 'AudioRecordPlugin 未加载'
})

const statusText = computed(() => {
  if (status.value === 'recording') return '录音中'
  if (status.value === 'stopped') return '录音已结束'
  return '未开始录音'
})

const statusDesc = computed(() => {
  if (!isAppPlusRuntime) return 'H5 可查看页面，真机录音需 Android 自定义基座'
  if (!audioRecord) return '请确认 nativeplugins 已勾选并重新制作自定义基座'
  if (status.value === 'recording') return '切到后台后前台服务会继续录音'
  if (status.value === 'stopped') return '已生成录音文件，可复制路径用于排查或上传'
  return '点击开始后会申请麦克风和通知权限'
})

const statusClass = computed(() => ({
  'is-recording': status.value === 'recording',
  'is-stopped': status.value === 'stopped',
  'is-error': Boolean(errorMessage.value)
}))

const lastResultText = computed(() => {
  return lastResult.value ? JSON.stringify(lastResult.value, null, 2) : ''
})

onShow(() => {
  syncState()
})

onBeforeUnmount(() => {
  stopDurationTimer()
})

function checkPlugin() {
  if (!isAppPlusRuntime) {
    errorMessage.value = '当前环境不支持原生录音插件，请使用 App 自定义基座'
    uni.showToast({
      title: '请使用 App 自定义基座',
      icon: 'none'
    })
    return false
  }

  if (!audioRecord?.startRecord || !audioRecord.stopRecord || !audioRecord.getRecordState) {
    errorMessage.value = 'AudioRecordPlugin 未加载'
    uni.showToast({
      title: 'AudioRecordPlugin 未加载',
      icon: 'none'
    })
    return false
  }

  return true
}

function syncState() {
  if (!audioRecord?.getRecordState) {
    updateDurationTimer()
    return
  }

  audioRecord.getRecordState({}, (res) => {
    if (!res?.success) return
    applyResult(res)
  })
}

async function startRecord() {
  if (operating.value || !checkPlugin()) return

  const granted = await requestAndroidPermissions()
  if (!granted) {
    errorMessage.value = '请在系统设置中开启麦克风权限后重试'
    uni.showModal({
      title: '权限提示',
      content: '请开启麦克风权限；Android 13 及以上还需要允许通知权限。',
      showCancel: false
    })
    return
  }

  operating.value = true
  pendingAction.value = 'start'
  errorMessage.value = ''

  audioRecord?.startRecord?.(
    {
      fileName: `record_${Date.now()}.m4a`,
      sampleRate: 16000,
      bitRate: 64000
    },
    (res) => {
      operating.value = false
      pendingAction.value = ''
      lastResult.value = res || null

      if (res?.success) {
        status.value = res.status || 'recording'
        filePath.value = ''
        duration.value = 0
        errorMessage.value = ''
        updateDurationTimer()
        showToast(res.message || '开始录音')
        return
      }

      errorMessage.value = res?.message || '开始录音失败'
      showToast(errorMessage.value)
      syncState()
    }
  )
}

function stopRecord() {
  if (operating.value || !checkPlugin()) return

  operating.value = true
  pendingAction.value = 'stop'
  errorMessage.value = ''

  audioRecord?.stopRecord?.({}, (res) => {
    operating.value = false
    pendingAction.value = ''
    lastResult.value = res || null

    if (res?.success) {
      applyResult(res)
      errorMessage.value = ''
      showToast(res.message || '录音结束', 'success')
      return
    }

    errorMessage.value = res?.message || '结束录音失败'
    showToast(errorMessage.value)
    syncState()
  })
}

function applyResult(res: RecordResult) {
  status.value = res.status || status.value
  filePath.value = res.filePath || ''
  duration.value = Number(res.duration || 0)
  lastResult.value = res
  updateDurationTimer()
}

function requestAndroidPermissions() {
  return new Promise<boolean>((resolve) => {
    // #ifdef APP-PLUS
    if (uni.getSystemInfoSync().platform !== 'android') {
      resolve(true)
      return
    }

    const plusRuntime = (globalThis as { plus?: PlusRuntime }).plus
    const permissions = ['android.permission.RECORD_AUDIO']
    const osVersion = Number.parseInt(plusRuntime?.os?.version || '0', 10)
    if (osVersion >= 13) {
      permissions.push('android.permission.POST_NOTIFICATIONS')
    }

    if (!plusRuntime?.android?.requestPermissions) {
      resolve(false)
      return
    }

    plusRuntime.android.requestPermissions(
      permissions,
      (event) => {
        resolve(Boolean(event.granted?.includes('android.permission.RECORD_AUDIO')))
      },
      () => resolve(false)
    )
    // #endif

    // #ifndef APP-PLUS
    resolve(false)
    // #endif
  })
}

function updateDurationTimer() {
  if (status.value === 'recording') {
    startDurationTimer()
    return
  }
  stopDurationTimer()
}

function startDurationTimer() {
  if (durationTimer) return
  durationTimer = setInterval(() => {
    duration.value += 1000
  }, 1000)
}

function stopDurationTimer() {
  if (!durationTimer) return
  clearInterval(durationTimer)
  durationTimer = null
}

function copyPath() {
  if (!filePath.value) return
  uni.setClipboardData({
    data: filePath.value,
    success: () => {
      showToast('已复制', 'success')
    }
  })
}

function showToast(title: string, icon: 'none' | 'success' = 'none') {
  uni.showToast({
    title,
    icon
  })
}

function formatDuration(ms: number) {
  const totalSec = Math.floor(ms / 1000)
  const minutes = String(Math.floor(totalSec / 60)).padStart(2, '0')
  const seconds = String(totalSec % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.audio-record-page {
  min-height: 100vh;
  padding: 0 28rpx 34rpx;
  background: $bg-page;
}

.hero-card {
  padding: 32rpx;
  border-radius: $card-radius;
  color: #ffffff;
  background: linear-gradient(135deg, #0b1f44 0%, #1677ff 100%);
  box-shadow: 0 18rpx 40rpx rgba(11, 31, 68, 0.16);
}

.hero-card.is-recording {
  background: linear-gradient(135deg, #fa3534 0%, #ff9900 100%);
  box-shadow: 0 18rpx 40rpx rgba(250, 53, 52, 0.2);
}

.hero-card.is-stopped {
  background: linear-gradient(135deg, #19be6b 0%, #4fcf8b 100%);
  box-shadow: 0 18rpx 40rpx rgba(25, 190, 107, 0.18);
}

.hero-card.is-error {
  background: linear-gradient(135deg, #fa3534 0%, #ff6f61 100%);
}

.hero-main {
  display: flex;
  align-items: center;
  gap: 22rpx;
}

.mic-orb {
  position: relative;
  @include flex-center;
  flex: 0 0 92rpx;
  width: 92rpx;
  height: 92rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.16);
  box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.2);
}

.mic-head {
  position: absolute;
  top: 22rpx;
  width: 24rpx;
  height: 34rpx;
  border: 5rpx solid #ffffff;
  border-radius: 16rpx;
}

.mic-stem {
  position: absolute;
  bottom: 22rpx;
  width: 5rpx;
  height: 18rpx;
  border-radius: 3rpx;
  background: #ffffff;
}

.mic-base {
  position: absolute;
  bottom: 18rpx;
  width: 30rpx;
  height: 5rpx;
  border-radius: 3rpx;
  background: #ffffff;
}

.hero-copy {
  min-width: 0;
  flex: 1;
}

.status-label,
.status-title,
.status-desc,
.duration-label,
.duration-value,
.card-title,
.card-subtitle,
.card-badge,
.param-label,
.param-value,
.file-path,
.result-text,
.empty,
.error-box {
  display: block;
}

.status-label {
  color: rgba(255, 255, 255, 0.78);
  font-size: 23rpx;
}

.status-title {
  margin-top: 10rpx;
  font-size: 42rpx;
  font-weight: 900;
  line-height: 1.15;
}

.status-desc {
  margin-top: 12rpx;
  color: rgba(255, 255, 255, 0.84);
  font-size: 24rpx;
  line-height: 1.45;
}

.duration-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 30rpx;
  padding: 22rpx 24rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.14);
}

.duration-label {
  color: rgba(255, 255, 255, 0.78);
  font-size: 24rpx;
}

.duration-value {
  font-size: 42rpx;
  font-weight: 900;
  letter-spacing: 0;
}

.card {
  margin-top: 24rpx;
  padding: 28rpx;
  border-radius: $card-radius;
  background: #ffffff;
  box-shadow: $shadow-card;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 22rpx;
}

.card-title {
  color: $text-main;
  font-size: 31rpx;
  font-weight: 800;
  line-height: 1.3;
}

.card-subtitle {
  margin-top: 8rpx;
  color: $text-secondary;
  font-size: 23rpx;
  line-height: 1.4;
}

.card-badge {
  flex-shrink: 0;
  padding: 8rpx 16rpx;
  border-radius: 22rpx;
  color: $primary-color;
  font-size: 22rpx;
  font-weight: 700;
  background: $primary-light;
}

.button-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
}

.action-btn,
.sync-btn,
.copy-btn {
  @include flex-center;
  font-weight: 700;
}

.action-btn {
  min-height: 86rpx;
  border-radius: 43rpx;
  color: #ffffff;
  font-size: 28rpx;
}

.action-btn.primary {
  background: linear-gradient(135deg, #1677ff 0%, #38a4ff 100%);
  box-shadow: 0 14rpx 26rpx rgba(22, 119, 255, 0.2);
}

.action-btn.danger {
  background: linear-gradient(135deg, #fa3534 0%, #ff7b65 100%);
  box-shadow: 0 14rpx 26rpx rgba(250, 53, 52, 0.18);
}

.action-btn[disabled],
.sync-btn[disabled] {
  opacity: 0.55;
}

.sync-btn {
  width: 100%;
  min-height: 78rpx;
  margin-top: 18rpx;
  border-radius: 39rpx;
  color: $primary-color;
  font-size: 26rpx;
  background: $primary-light;
}

.error-box {
  margin-top: 20rpx;
  padding: 18rpx 20rpx;
  border-radius: 18rpx;
  color: $error-color;
  font-size: 24rpx;
  line-height: 1.45;
  background: #fff1f0;
}

.param-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.param-item,
.file-box,
.result-box {
  padding: 20rpx;
  border-radius: 20rpx;
  background: #f8fbff;
}

.param-label {
  color: $text-secondary;
  font-size: 23rpx;
}

.param-value {
  margin-top: 10rpx;
  color: $text-main;
  font-size: 30rpx;
  font-weight: 800;
}

.file-path {
  color: $text-main;
  font-size: 24rpx;
  line-height: 1.5;
  word-break: break-all;
}

.copy-btn {
  width: 180rpx;
  min-height: 64rpx;
  margin-top: 18rpx;
  border-radius: 32rpx;
  color: #ffffff;
  font-size: 25rpx;
  background: $primary-color;
}

.result-text {
  color: $text-main;
  font-size: 23rpx;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.empty {
  padding: 18rpx 0;
  color: $text-muted;
  font-size: 24rpx;
}

@media (max-width: 420px) {
  .button-row,
  .param-grid {
    grid-template-columns: 1fr;
  }
}
</style>