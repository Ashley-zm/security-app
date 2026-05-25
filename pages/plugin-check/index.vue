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

        <view v-if="detectionResult.hasResult" class="detect-result">
          <view class="detect-summary">
            <text class="detect-summary-title">
              {{ detectionResult.hasTarget ? '检测到目标' : '未检测到目标' }}
            </text>
            <text class="detect-summary-meta">
              {{ detectionResult.modelName }} · {{ detectionResult.engine }} · {{ detectionResult.timestamp }}
            </text>
          </view>
          <view v-if="detectionResult.boxes.length" class="box-list">
            <view v-for="(box, index) in detectionResult.boxes" :key="`${box.label}-${index}`" class="box-item">
              <view class="box-main">
                <text class="box-label">{{ box.label }}</text>
                <text class="box-score">{{ formatScore(box.score) }}</text>
              </view>
              <view class="box-meta">
                classId: {{ box.classId }} · left: {{ formatNumber(box.left) }} · top: {{ formatNumber(box.top) }}
              </view>
              <view class="box-meta">
                right: {{ formatNumber(box.right) }} · bottom: {{ formatNumber(box.bottom) }}
              </view>
            </view>
          </view>
          <view v-else class="empty-boxes">本次检测没有返回检测框</view>
        </view>

        <view class="check-actions">
          <button class="check-btn check-btn-ncnn" :disabled="pluginCheck.status === 'checking'" @click="checkNativePlugin">
            {{ pluginCheck.status === 'checking' ? '检测中' : '开始进行yolov8检测' }}
          </button>
        </view>
      </view>

      <view class="config-card">
        <view class="card-title">YOLOv8 检测参数</view>
        <view class="form-list">
          <view class="form-field">
            <text class="form-label">modelType</text>
            <input v-model="yoloForm.modelType" class="form-input" />
          </view>
          <view class="form-field">
            <text class="form-label">engine</text>
            <input v-model="yoloForm.engine" class="form-input" />
          </view>
          <view class="form-field">
            <text class="form-label">modelName</text>
            <input v-model="yoloForm.modelName" class="form-input" />
          </view>
          <view class="form-field">
            <text class="form-label">modelPath</text>
            <input v-model="yoloForm.modelPath" class="form-input" />
          </view>
          <view class="form-field">
            <text class="form-label">labelPath</text>
            <input v-model="yoloForm.labelPath" class="form-input" />
          </view>
          <view class="form-grid">
            <view class="form-field compact">
              <text class="form-label">inputSize</text>
              <input v-model="yoloForm.inputSize" class="form-input" type="number" />
            </view>
            <view class="form-field compact">
              <text class="form-label">detectInterval</text>
              <input v-model="yoloForm.detectInterval" class="form-input" type="number" />
            </view>
            <view class="form-field compact">
              <text class="form-label">threshold</text>
              <input v-model="yoloForm.threshold" class="form-input" type="digit" />
            </view>
            <view class="form-field compact">
              <text class="form-label">iouThreshold</text>
              <input v-model="yoloForm.iouThreshold" class="form-input" type="digit" />
            </view>
          </view>
          <view class="form-field switch-field">
            <view>
              <text class="form-label">useGpu</text>
              <text class="form-help">{{ yoloForm.useGpu ? 'true' : 'false' }}</text>
            </view>
            <switch :checked="yoloForm.useGpu" color="#1677ff" @change="handleUseGpuChange" />
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
          <text>点击检测会使用当前表单参数调用 startDetect 并打开原生 DetectActivity。</text>
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
  code?: string
  message?: string
  modelType?: string
  engine?: string
  modelName?: string
  hasTarget?: boolean
  boxes?: unknown
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
  threshold?: number
  iouThreshold?: number
  modelPath?: string
  labelPath?: string
  detectInterval: number
  inputSize: number
  useGpu?: boolean
}

interface YoloForm {
  modelType: string
  engine: string
  modelName: string
  modelPath: string
  labelPath: string
  inputSize: string
  detectInterval: string
  threshold: string
  iouThreshold: string
  useGpu: boolean
}

interface DetectBox {
  classId: number
  label: string
  score: number
  left: number
  top: number
  right: number
  bottom: number
}

const pluginCheck = reactive({
  status: 'idle' as PluginCheckStatus,
  icon: 'GO',
  statusText: '待检测',
  description: '调整 YOLOv8 参数后，调用 AiDetectPlugin.startDetect 开始检测',
  detail: '',
  lastChecked: ''
})

const detectionResult = reactive({
  hasResult: false,
  hasTarget: false,
  modelType: '',
  engine: '',
  modelName: '',
  timestamp: '',
  boxes: [] as DetectBox[]
})

const yoloForm = reactive<YoloForm>({
  modelType: 'detection',
  engine: 'ncnn',
  modelName: 'YOLO NCNN',
  modelPath: 'models/yolov8n_ncnn/yolov8n.param',
  labelPath: 'models/yolov8n_ncnn/labels.txt',
  inputSize: '640',
  detectInterval: '500',
  threshold: '0.5',
  iouThreshold: '0.45',
  useGpu: false
})

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

function checkNativePlugin() {
  const options = buildDetectOptions()
  if (!options) {
    return
  }

  resetDetectionResult()
  console.log('[AiDetectPlugin] startDetect options:', options)

  if (!isAppPlusRuntime) {
    updatePluginCheck('unsupported', '未运行', '当前环境不是 App-Plus，无法调用安卓原生插件', formatConfigDetail(options))
    console.log('[AiDetectPlugin] skip native call outside App-Plus:', options)
    return
  }

  updatePluginCheck('checking', '检测中', '正在调用 AiDetectPlugin.startDetect 进行 YOLOv8 检测', formatConfigDetail(options))

  const nativeUni = uni as unknown as {
    requireNativePlugin?: (name: string) => NativePluginModule | undefined
  }

  try {
    const plugin = nativeUni.requireNativePlugin?.('AiDetectPlugin')

    if (!hasStartDetect(plugin)) {
      updatePluginCheck('error', '未检测到', 'AiDetectPlugin.startDetect 未正确加载', '请确认 nativeplugins 已参与自定义基座或正式包打包')
      return
    }

    let receivedInitialResult = false
    const timer = setTimeout(() => {
      if (!receivedInitialResult) {
        updatePluginCheck('error', '调用超时', '插件已加载，但 startDetect 方法未返回结果', '请检查原生插件回调是否正常触发')
      }
    }, 5000)

    const syncResult = plugin.startDetect(options, (result) => {
      console.log('[AiDetectPlugin] callback result:', result)
      receivedInitialResult = true
      clearTimeout(timer)
      handleDetectCallback(result)
    })

    if (syncResult) {
      console.log('[AiDetectPlugin] sync result:', syncResult)
      receivedInitialResult = true
      clearTimeout(timer)
      handleDetectCallback(syncResult)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[AiDetectPlugin] startDetect failed:', error)
    updatePluginCheck('error', '调用失败', 'AiDetectPlugin 调用过程中发生异常', message)
  }
}

function handleDetectCallback(result: NativePluginResult | undefined) {
  console.log('[AiDetectPlugin] handle callback type:', result?.type, result)

  if (!result) {
    console.error('[AiDetectPlugin] empty callback result')
    updatePluginCheck('error', '回调异常', '原生插件返回了空回调结果')
    return
  }

  if (result.type === 'activity_opened') {
    updatePluginCheck('checking', '页面已打开', '原生 DetectActivity 已打开，等待相机启动', result.message || formatCallbackDetail(result))
    return
  }

  if (result.type === 'camera_preview_started') {
    updatePluginCheck('checking', '相机已启动', '相机预览已启动，等待 YOLO 检测结果', result.message || formatCallbackDetail(result))
    return
  }

  if (result.type === 'detect_result') {
    applyDetectResult(result)
    return
  }

  if (result.type === 'error' || result.success === false) {
    console.error('[AiDetectPlugin] native error:', result)
    updatePluginCheck('error', '原生侧错误', result.message || '原生侧返回错误', formatCallbackDetail(result))
    return
  }

  updatePluginCheck(
    result.success ? 'success' : 'error',
    result.success ? '收到回调' : '异常',
    result.message || `收到未分类回调：${result.type || 'unknown'}`,
    formatCallbackDetail(result)
  )
}

function applyDetectResult(result: NativePluginResult) {
  const boxes = normalizeBoxes(result.boxes)
  console.log('[AiDetectPlugin] detect_result raw:', result)
  console.log('[AiDetectPlugin] detect_result boxes:', boxes)

  detectionResult.hasResult = true
  detectionResult.hasTarget = Boolean(result.hasTarget)
  detectionResult.modelType = result.modelType || ''
  detectionResult.engine = result.engine || ''
  detectionResult.modelName = result.modelName || ''
  detectionResult.timestamp = formatResultTimestamp(result.timestamp)
  detectionResult.boxes = boxes

  updatePluginCheck(
    'success',
    detectionResult.hasTarget ? '检测到目标' : '未检测到目标',
    detectionResult.hasTarget
      ? `YOLO 检测完成，返回 ${boxes.length} 个检测框`
      : 'YOLO 检测完成，本次未检测到目标',
    formatCallbackDetail(result)
  )
}

function normalizeBoxes(boxes: unknown): DetectBox[] {
  if (!Array.isArray(boxes)) {
    return []
  }

  return boxes
    .map((box) => normalizeBox(box))
    .filter((box): box is DetectBox => Boolean(box))
}

function normalizeBox(box: unknown): DetectBox | null {
  if (!box || typeof box !== 'object') {
    return null
  }

  const rawBox = box as Record<string, unknown>
  return {
    classId: toNumber(rawBox.classId),
    label: typeof rawBox.label === 'string' ? rawBox.label : '',
    score: toNumber(rawBox.score),
    left: toNumber(rawBox.left),
    top: toNumber(rawBox.top),
    right: toNumber(rawBox.right),
    bottom: toNumber(rawBox.bottom)
  }
}

function resetDetectionResult() {
  detectionResult.hasResult = false
  detectionResult.hasTarget = false
  detectionResult.modelType = ''
  detectionResult.engine = ''
  detectionResult.modelName = ''
  detectionResult.timestamp = ''
  detectionResult.boxes = []
}

function buildDetectOptions(): DetectOptions | null {
  const inputSize = parseNumberField('inputSize', yoloForm.inputSize)
  const detectInterval = parseNumberField('detectInterval', yoloForm.detectInterval)
  const threshold = parseNumberField('threshold', yoloForm.threshold)
  const iouThreshold = parseNumberField('iouThreshold', yoloForm.iouThreshold)

  if (
    inputSize === null ||
    detectInterval === null ||
    threshold === null ||
    iouThreshold === null
  ) {
    return null
  }

  return {
    modelType: yoloForm.modelType.trim(),
    engine: yoloForm.engine.trim(),
    modelName: yoloForm.modelName.trim(),
    modelPath: yoloForm.modelPath.trim(),
    labelPath: yoloForm.labelPath.trim(),
    inputSize,
    detectInterval,
    threshold,
    iouThreshold,
    useGpu: yoloForm.useGpu
  }
}

function parseNumberField(label: string, value: string) {
  if (!value.trim()) {
    updatePluginCheck('error', '参数错误', `${label} 不能为空`)
    return null
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    updatePluginCheck('error', '参数错误', `${label} 必须是有效数字`, value)
    return null
  }
  return parsed
}

function handleUseGpuChange(event: Event) {
  const switchEvent = event as Event & { detail?: { value?: boolean } }
  yoloForm.useGpu = Boolean(switchEvent.detail?.value)
}

function toNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatNumber(value: number) {
  return value.toFixed(1)
}

function formatScore(value: number) {
  return `${Math.round(value * 100)}%`
}

function formatResultTimestamp(timestamp: number | undefined) {
  if (!timestamp) {
    return '无时间戳'
  }

  return formatTime(new Date(timestamp))
}

function formatCallbackDetail(result: NativePluginResult) {
  return JSON.stringify(result)
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

.detect-result {
  margin-top: 24rpx;
  padding: 22rpx;
  border: 2rpx solid rgba(25, 190, 107, 0.2);
  border-radius: 18rpx;
  background: #f2fbf7;
}

.detect-summary {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.detect-summary-title {
  color: $text-main;
  font-size: 28rpx;
  font-weight: 800;
}

.detect-summary-meta {
  color: $text-secondary;
  font-size: 23rpx;
  line-height: 1.4;
}

.box-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 20rpx;
}

.box-item {
  min-width: 0;
  padding: 18rpx;
  border: 2rpx solid rgba(25, 190, 107, 0.16);
  border-radius: 14rpx;
  background: #ffffff;
}

.box-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.box-label {
  min-width: 0;
  color: $text-main;
  font-size: 26rpx;
  font-weight: 800;
}

.box-score {
  flex-shrink: 0;
  color: $success-color;
  font-size: 24rpx;
  font-weight: 800;
}

.box-meta,
.empty-boxes {
  margin-top: 10rpx;
  color: $text-secondary;
  font-size: 23rpx;
  line-height: 1.45;
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

.form-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 24rpx;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
}

.form-field {
  min-width: 0;
  padding: 18rpx 20rpx;
  border: 2rpx solid $border-color;
  border-radius: 18rpx;
  background: #f8fbff;
}

.form-field.compact {
  padding: 18rpx;
}

.form-label {
  display: block;
  color: $text-secondary;
  font-size: 22rpx;
}

.form-input {
  width: 100%;
  height: 52rpx;
  margin-top: 10rpx;
  color: $text-main;
  font-size: 25rpx;
  font-weight: 800;
}

.switch-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.form-help {
  display: block;
  margin-top: 8rpx;
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
