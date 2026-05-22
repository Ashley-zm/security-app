<template>
  <view class="plugin-page page safe-page">
    <AppNavbar title="插件检测" show-back />

    <view class="page-body">
      <view class="hero-card" :class="`hero-${pluginCheck.status}`">
        <view class="hero-main">
          <view class="status-icon" :class="`status-icon-${pluginCheck.status}`">
            <text>{{ pluginCheck.icon }}</text>
          </view>
          <view class="hero-copy">
            <view class="hero-title">AiDetectPlugin</view>
            <view class="hero-subtitle">安卓原生插件可用性检测</view>
          </view>
        </view>
        <view class="status-pill" :class="`status-pill-${pluginCheck.status}`">
          {{ pluginCheck.statusText }}
        </view>
      </view>

      <view class="result-card">
        <view class="card-title">检测结果</view>
        <view class="result-desc">{{ pluginCheck.description }}</view>
        <view v-if="pluginCheck.detail" class="result-detail">{{ pluginCheck.detail }}</view>

        <view class="info-list">
          <view class="info-row">
            <text class="info-label">插件名称</text>
            <text class="info-value">AiDetectPlugin</text>
          </view>
          <view class="info-row">
            <text class="info-label">检测方法</text>
            <text class="info-value">startDetect</text>
          </view>
          <view class="info-row">
            <text class="info-label">运行环境</text>
            <text class="info-value">{{ runtimeName }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">检测时间</text>
            <text class="info-value">{{ pluginCheck.lastChecked || '尚未完成' }}</text>
          </view>
        </view>

        <view class="check-actions">
          <button
            v-for="preset in detectPresets"
            :key="preset.engine"
            class="check-btn"
            :class="`check-btn-${preset.engine}`"
            :disabled="pluginCheck.status === 'checking'"
            @click="checkNativePlugin(preset)"
          >
            {{ pluginCheck.status === 'checking' ? '检测中' : preset.buttonText }}
          </button>
        </view>
      </view>

      <view class="config-card">
        <view class="card-title">模拟参数</view>
        <view v-for="preset in detectPresets" :key="preset.engine" class="config-group">
          <view class="config-title">{{ preset.configTitle }}</view>
          <view class="config-grid">
            <view
              v-for="item in getConfigItems(preset.options)"
              :key="`${preset.engine}-${item.label}`"
              class="config-item"
            >
              <text class="config-label">{{ item.label }}</text>
              <text class="config-value">{{ item.value }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="tips-card">
        <view class="card-title">检测说明</view>
        <view class="tip-item">
          <text class="tip-dot blue" />
          <text>仅 App-Plus 安卓运行环境可以调用 nativeplugins 原生插件。</text>
        </view>
        <view class="tip-item">
          <text class="tip-dot green" />
          <text>H5 预览会显示未运行，这是正常状态。</text>
        </view>
        <view class="tip-item">
          <text class="tip-dot orange" />
          <text>若安卓包内提示未检测到，请确认已使用包含该插件的自定义基座或正式包。</text>
        </view>
        <view class="tip-item">
          <text class="tip-dot blue" />
          <text>模拟检测会调用 startDetect 并打开原生 DetectActivity。</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import AppNavbar from '@/components/AppNavbar.vue'

type PluginCheckStatus = 'idle' | 'checking' | 'success' | 'error' | 'unsupported'

interface NativePluginResult {
  success?: boolean
  type?: string
  message?: string
  timestamp?: number
  [key: string]: unknown
}

interface NativePluginModule {
  startDetect?: (options: DetectOptions, callback: (result: NativePluginResult) => void) => NativePluginResult | void
}

type ReadyNativePluginModule = NativePluginModule & {
  startDetect: NonNullable<NativePluginModule['startDetect']>
}

interface DetectOptions {
  modelType: string
  engine: string
  modelName: string
  threshold: number
  detectInterval: number
  inputSize: number
}

interface DetectPreset {
  engine: string
  buttonText: string
  configTitle: string
  runningText: string
  options: DetectOptions
}

const pluginCheck = reactive({
  status: 'idle' as PluginCheckStatus,
  icon: 'GO',
  statusText: '待检测',
  description: '请选择 mock 或 ncnn 引擎，调用 AiDetectPlugin.startDetect 并传入对应参数',
  detail: '',
  lastChecked: ''
})

const detectPresets: DetectPreset[] = [
  {
    engine: 'mock',
    buttonText: '开始模拟mock 引擎检测',
    configTitle: 'mock 引擎参数',
    runningText: 'mock 引擎检测',
    options: {
      modelType: 'detection',
      engine: 'mock',
      modelName: 'mock_yolo',
      threshold: 0.5,
      detectInterval: 300,
      inputSize: 640
    }
  },
  {
    engine: 'ncnn',
    buttonText: '开始模拟ncnn 引擎检测',
    configTitle: 'ncnn 引擎参数',
    runningText: 'ncnn 引擎检测',
    options: {
      modelType: 'detection',
      engine: 'ncnn',
      modelName: 'yolov8n',
      threshold: 0.5,
      detectInterval: 300,
      inputSize: 640
    }
  }
]

const runtimeName = computed(() => {
  // #ifdef APP-PLUS
  return 'App-Plus'
  // #endif

  // #ifdef H5
  return 'H5'
  // #endif

  return '非 App-Plus'
})

const isAppPlusRuntime = (() => {
  let isAppPlus = false

  // #ifdef APP-PLUS
  isAppPlus = true
  // #endif

  return isAppPlus
})()

onMounted(() => {
  // #ifndef APP-PLUS
  updatePluginCheck('unsupported', '未运行', '当前环境不是 App-Plus，无法调用安卓原生插件')
  // #endif
})

function updatePluginCheck(
  status: PluginCheckStatus,
  statusText: string,
  description: string,
  detail = ''
) {
  const icons: Record<PluginCheckStatus, string> = {
    idle: 'GO',
    checking: '...',
    success: 'OK',
    error: '!',
    unsupported: '--'
  }

  pluginCheck.status = status
  pluginCheck.icon = icons[status]
  pluginCheck.statusText = statusText
  pluginCheck.description = description
  pluginCheck.detail = detail
  pluginCheck.lastChecked = formatTime(new Date())
}

function formatTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function checkNativePlugin(preset: DetectPreset) {
  if (!isAppPlusRuntime) {
    updatePluginCheck('unsupported', '未运行', '当前环境不是 App-Plus，无法调用安卓原生插件', formatConfigDetail(preset.options))
    return
  }

  updatePluginCheck('checking', '检测中', `正在调用 AiDetectPlugin.startDetect 进行${preset.runningText}`, formatConfigDetail(preset.options))

  const nativeUni = uni as unknown as {
    requireNativePlugin?: (name: string) => NativePluginModule | undefined
  }

  try {
    const plugin = nativeUni.requireNativePlugin?.('AiDetectPlugin')

    if (!hasStartDetect(plugin)) {
      updatePluginCheck('error', '未检测到', 'AiDetectPlugin.startDetect 未正确加载', '请确认 nativeplugins 已参与自定义基座或正式包打包')
      return
    }

    let settled = false
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        updatePluginCheck('error', '调用超时', '插件已加载，但 startDetect 方法未返回结果', '请检查原生插件回调是否正常触发')
      }
    }, 5000)

    const syncResult = plugin.startDetect(preset.options, (result) => {
      if (settled) {
        return
      }

      settled = true
      clearTimeout(timer)

      if (result?.success) {
        updatePluginCheck('success', '已启动', `${preset.runningText}已启动`, result.message || 'DetectActivity 已打开')
        return
      }

      updatePluginCheck('error', '异常', 'AiDetectPlugin 已返回，但结果不是成功状态', JSON.stringify(result || {}))
    })

    if (syncResult) {
      settled = true
      clearTimeout(timer)

      if (syncResult.success) {
        updatePluginCheck('success', '已启动', `${preset.runningText}已启动`, syncResult.message || 'DetectActivity 已打开')
        return
      }

      updatePluginCheck('error', '异常', 'AiDetectPlugin 已同步返回，但结果不是成功状态', JSON.stringify(syncResult))
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    updatePluginCheck('error', '调用失败', 'AiDetectPlugin 调用过程中发生异常', message)
  }
}

function getConfigItems(options: DetectOptions) {
  return [
    {
      label: 'modelType',
      value: options.modelType
    },
    {
      label: 'engine',
      value: options.engine
    },
    {
      label: 'modelName',
      value: options.modelName
    },
    {
      label: 'threshold',
      value: String(options.threshold)
    },
    {
      label: 'detectInterval',
      value: `${options.detectInterval}ms`
    },
    {
      label: 'inputSize',
      value: String(options.inputSize)
    }
  ]
}

function formatConfigDetail(options: DetectOptions) {
  return JSON.stringify(options)
}

function hasStartDetect(plugin: NativePluginModule | undefined): plugin is ReadyNativePluginModule {
  return Boolean(plugin && typeof plugin.startDetect === 'function')
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.plugin-page {
  min-height: 100vh;
}

.page-body {
  padding: 24rpx 28rpx 36rpx;
}

.hero-card,
.result-card,
.config-card,
.tips-card {
  background: #ffffff;
  border-radius: $card-radius;
  box-shadow: $shadow-card;
}

.hero-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 34rpx;
  overflow: hidden;
  border: 2rpx solid rgba(22, 119, 255, 0.08);
}

.hero-success {
  border-color: rgba(25, 190, 107, 0.22);
}

.hero-error {
  border-color: rgba(250, 53, 52, 0.18);
}

.hero-idle {
  border-color: rgba(22, 119, 255, 0.12);
}

.hero-main {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 22rpx;
}

.status-icon {
  @include flex-center;
  flex-shrink: 0;
  width: 92rpx;
  height: 92rpx;
  border-radius: 28rpx;
  color: #ffffff;
  font-size: 25rpx;
  font-weight: 800;
}

.status-icon-checking {
  background: linear-gradient(135deg, #1677ff 0%, #54c8ff 100%);
}

.status-icon-idle {
  background: linear-gradient(135deg, #0b1f44 0%, #1677ff 100%);
}

.status-icon-success {
  background: linear-gradient(135deg, #19be6b 0%, #65d89b 100%);
}

.status-icon-error {
  background: linear-gradient(135deg, #fa3534 0%, #ff7d74 100%);
}

.status-icon-unsupported {
  background: linear-gradient(135deg, #8b98b8 0%, #b3bed6 100%);
}

.hero-copy {
  min-width: 0;
}

.hero-title {
  color: $text-main;
  font-size: 38rpx;
  font-weight: 800;
}

.hero-subtitle {
  margin-top: 10rpx;
  color: $text-secondary;
  font-size: 25rpx;
}

.status-pill {
  flex-shrink: 0;
  padding: 8rpx 18rpx;
  border-radius: 22rpx;
  font-size: 23rpx;
  font-weight: 700;
}

.status-pill-checking {
  color: $primary-color;
  background: $primary-light;
}

.status-pill-idle {
  color: $primary-color;
  background: $primary-light;
}

.status-pill-success {
  color: $success-color;
  background: #eafaf2;
}

.status-pill-error {
  color: $error-color;
  background: #fff0ef;
}

.status-pill-unsupported {
  color: $text-secondary;
  background: #f0f3f9;
}

.result-card,
.config-card,
.tips-card {
  margin-top: 24rpx;
  padding: 30rpx;
}

.card-title {
  color: $text-main;
  font-size: 32rpx;
  font-weight: 800;
}

.result-desc {
  margin-top: 18rpx;
  color: $text-main;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 1.45;
}

.result-detail {
  margin-top: 12rpx;
  color: $text-secondary;
  font-size: 25rpx;
  line-height: 1.45;
  word-break: break-all;
}

.info-list {
  margin-top: 24rpx;
  border-top: 2rpx solid $border-color;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 22rpx 0;
  border-bottom: 2rpx solid $border-color;
}

.info-label {
  flex-shrink: 0;
  color: $text-secondary;
  font-size: 25rpx;
}

.info-value {
  min-width: 0;
  color: $text-main;
  font-size: 25rpx;
  font-weight: 700;
  text-align: right;
}

.check-actions {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 28rpx;
}

.check-btn {
  @include flex-center;
  width: 100%;
  height: 78rpx;
  margin-top: 0;
  border-radius: 39rpx;
  color: #ffffff;
  font-size: 27rpx;
  font-weight: 800;
  background: linear-gradient(135deg, #1677ff 0%, #38a4ff 100%);
}

.check-btn-ncnn {
  background: linear-gradient(135deg, #17233d 0%, #19be6b 100%);
}

.check-btn[disabled] {
  color: $text-muted;
  background: #f0f3f9;
}

.config-group {
  margin-top: 24rpx;
}

.config-title {
  color: $text-main;
  font-size: 26rpx;
  font-weight: 800;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 16rpx;
}

.config-item {
  min-width: 0;
  padding: 20rpx;
  border: 2rpx solid $border-color;
  border-radius: 18rpx;
  background: #f8fbff;
}

.config-label {
  display: block;
  color: $text-secondary;
  font-size: 22rpx;
}

.config-value {
  display: block;
  @include text-ellipsis;
  margin-top: 10rpx;
  color: $text-main;
  font-size: 25rpx;
  font-weight: 800;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  margin-top: 20rpx;
  color: $text-secondary;
  font-size: 25rpx;
  line-height: 1.45;
}

.tip-dot {
  flex-shrink: 0;
  width: 14rpx;
  height: 14rpx;
  margin-top: 11rpx;
  border-radius: 7rpx;
}

.tip-dot.blue {
  background: $primary-color;
}

.tip-dot.green {
  background: $success-color;
}

.tip-dot.orange {
  background: $warning-color;
}
</style>
