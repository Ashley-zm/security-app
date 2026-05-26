<template>
  <view class="plugin-check-page page safe-page">
    <AppNavbar title="插件检测" show-back />

    <view class="page-body">
      <view class="hero-card" :class="statusClass">
        <view class="hero-main">
          <view class="hero-icon">
            <text>AI</text>
          </view>
          <view class="hero-copy">
            <text class="title">质量检测 Pipeline</text>
            <text class="subtitle">模糊检测 · 翻拍检测 · 目标识别</text>
          </view>
          <text class="status-pill" :class="statusClass">{{ detectStatus }}</text>
        </view>

        <view class="pipeline-steps">
          <text class="step-tag">fuzzy</text>
          <text class="step-arrow">→</text>
          <text class="step-tag">remake</text>
          <text class="step-arrow">→</text>
          <text class="step-tag active">targetModel</text>
        </view>
      </view>

      <view class="card model-card">
        <view class="card-head">
          <view>
            <text class="card-title">目标检测模型</text>
            <text class="card-subtitle">当前检测固定提交 YOLOv8n 参数</text>
          </view>
          <text class="card-badge">{{ selectedTargetModel.useGpu ? 'GPU' : 'CPU' }}</text>
        </view>

        <view class="picker-content">
          <view>
            <text class="model-name">{{ selectedTargetModel.name }}</text>
            <text class="model-desc">{{ selectedTargetModel.modelName }}</text>
          </view>
          <text class="picker-arrow">固定</text>
        </view>

        <view class="model-grid">
          <view class="info-item">
            <text class="info-label">modelPath</text>
            <text class="info-value path-text">{{ selectedTargetModel.modelPath }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">binPath</text>
            <text class="info-value path-text">{{ selectedTargetModel.binPath }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">labelPath</text>
            <text class="info-value path-text">{{ selectedTargetModel.labelPath }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">参数</text>
            <text class="info-value">
              {{ selectedTargetModel.inputSize }} / {{ selectedTargetModel.threshold }} /
              {{ selectedTargetModel.iouThreshold }}
            </text>
          </view>
        </view>
      </view>

    <view class="card action-card">
      <view class="card-head">
        <view>
          <text class="card-title">检测操作</text>
          <text class="card-subtitle">{{ pluginStatus }}</text>
        </view>
      </view>
      <view class="button-row">
        <button
          class="action-btn primary"
          :disabled="isOpeningDetect || isDetecting"
          @click="startDetect"
        >
          {{ isOpeningDetect ? '正在打开...' : '开始检测' }}
        </button>
      </view>

      <view v-if="errorMessage" class="error-box">{{ errorMessage }}</view>
    </view>

    <view class="card">
      <view class="card-head">
        <view>
          <text class="card-title">实时 Pipeline 状态</text>
          <text class="card-subtitle">原生检测回调 detect_result</text>
        </view>
      </view>
      <view class="pipeline-box">
        <view>
          <text class="pipeline-label">pipelineStatus</text>
          <text class="pipeline-status">{{ pipelineStatus || '-' }}</text>
        </view>
        <view>
          <text class="pipeline-label">message</text>
          <text class="pipeline-message">{{ pipelineMessage || '-' }}</text>
        </view>
        <view>
          <text class="pipeline-label">targetModelName</text>
          <text class="pipeline-message">{{ targetModelName || '-' }}</text>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="card-head">
        <view>
          <text class="card-title">质量检测结果</text>
          <text class="card-subtitle">score 仅展示，不参与业务判断</text>
        </view>
      </view>
      <view class="result-grid">
        <view class="result-panel">
          <view class="panel-title">fuzzyResult</view>
          <quality-result-view :result="fuzzyResult" />
        </view>
        <view class="result-panel">
          <view class="panel-title">remakeResult</view>
          <quality-result-view :result="remakeResult" />
        </view>
      </view>
    </view>

    <view class="card">
      <view class="card-head">
        <view>
          <text class="card-title">目标检测结果</text>
          <text class="card-subtitle">展示 targetModel 返回的 boxes</text>
        </view>
        <text class="card-badge">{{ getBoxCount(detectionResult) }} 个</text>
      </view>
      <view v-if="detectionResult" class="target-summary">
        <view class="row">
          <text class="label">modelName</text>
          <text class="value">{{ detectionResult.modelName || '-' }}</text>
        </view>
        <view class="row">
          <text class="label">boxes 数量</text>
          <text class="value">{{ getBoxCount(detectionResult) }}</text>
        </view>
        <view v-if="normalizedBoxes.length" class="box-list">
          <view v-for="(box, index) in normalizedBoxes" :key="index" class="box-item">
            <view class="box-header">
              <text class="box-label">{{ box.label || `目标 ${index + 1}` }}</text>
              <text class="box-score">{{ formatScore(box.score) }}</text>
            </view>
            <text class="box-meta">classId: {{ box.classId ?? '-' }}</text>
            <text class="box-meta">
              left: {{ formatNumber(box.left) }} / top: {{ formatNumber(box.top) }}
            </text>
            <text class="box-meta">
              right: {{ formatNumber(box.right) }} / bottom: {{ formatNumber(box.bottom) }}
            </text>
          </view>
        </view>
        <view v-else class="empty">暂无检测框</view>
      </view>
      <view v-else class="empty">暂无目标检测结果</view>
    </view>

    <view class="card">
      <view class="card-head">
        <view>
          <text class="card-title">最新拍照结果</text>
          <text class="card-subtitle">原生页面拍照后返回 snapshot</text>
        </view>
      </view>
      <view v-if="snapshotResult" class="snapshot-detail">
        <image
          v-if="snapshotResult.previewPath"
          class="snapshot-image"
          :src="snapshotResult.previewPath"
          mode="widthFix"
        />
        <view class="row column">
          <text class="label">imagePath</text>
          <text class="value path-text">{{ snapshotResult.imagePath || '-' }}</text>
        </view>
        <view class="row">
          <text class="label">timeText</text>
          <text class="value">{{ snapshotResult.timeText }}</text>
        </view>
        <view class="row">
          <text class="label">pipelineStatus</text>
          <text class="value">{{ snapshotResult.pipelineStatus || '-' }}</text>
        </view>
        <view class="row">
          <text class="label">message</text>
          <text class="value">{{ snapshotResult.message || '-' }}</text>
        </view>
        <view class="row">
          <text class="label">hasTarget</text>
          <text class="value">{{ snapshotResult.hasTarget ? 'true' : 'false' }}</text>
        </view>

        <view class="result-grid snapshot-results">
          <view class="result-panel">
            <view class="panel-title">fuzzyResult</view>
            <quality-result-view :result="snapshotResult.fuzzyResult" />
          </view>
          <view class="result-panel">
            <view class="panel-title">remakeResult</view>
            <quality-result-view :result="snapshotResult.remakeResult" />
          </view>
        </view>

        <view class="snapshot-target">
          <view class="panel-title">detectionResult</view>
          <view class="row">
            <text class="label">modelName</text>
            <text class="value">{{ snapshotResult.detectionResult?.modelName || '-' }}</text>
          </view>
          <view class="row">
            <text class="label">boxes 数量</text>
            <text class="value">{{ getBoxCount(snapshotResult.detectionResult) }}</text>
          </view>
          <view v-if="getBoxes(snapshotResult.detectionResult).length" class="box-list">
            <view
              v-for="(box, index) in getBoxes(snapshotResult.detectionResult)"
              :key="`snapshot-box-${index}`"
              class="box-item"
            >
              <view class="box-header">
                <text class="box-label">{{ box.label || `目标 ${index + 1}` }}</text>
                <text class="box-score">{{ formatScore(box.score) }}</text>
              </view>
              <text class="box-meta">classId: {{ box.classId ?? '-' }}</text>
              <text class="box-meta">
                left: {{ formatNumber(box.left) }} / top: {{ formatNumber(box.top) }}
              </text>
              <text class="box-meta">
                right: {{ formatNumber(box.right) }} / bottom: {{ formatNumber(box.bottom) }}
              </text>
            </view>
          </view>
        </view>
      </view>
      <view v-else class="empty">暂无拍照结果</view>
    </view>

    <view class="card">
      <view class="card-head">
        <view>
          <text class="card-title">拍照记录</text>
          <text class="card-subtitle">仅保存当前页面内记录</text>
        </view>
        <text class="card-badge">{{ snapshotList.length }} 条</text>
      </view>
      <view v-if="snapshotList.length" class="record-list">
        <view v-for="(item, index) in snapshotList" :key="`${item.timestamp}-${index}`" class="record-item">
          <image v-if="item.previewPath" class="record-image" :src="item.previewPath" mode="aspectFill" />
          <view class="record-info">
            <text class="record-time">{{ item.timeText }}</text>
            <text class="record-line">{{ item.pipelineStatus || '-' }} · {{ item.message || '-' }}</text>
            <text class="record-line">{{ item.targetModelName || '-' }}</text>
          </view>
        </view>
      </view>
      <view v-else class="empty">当前页面暂无拍照记录</view>
    </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from 'vue'
import AppNavbar from '@/components/AppNavbar.vue'

interface TargetModel {
  name: string
  modelName: string
  modelPath: string
  binPath: string
  labelPath: string
  inputSize: number
  threshold: number
  iouThreshold: number
  useGpu: boolean
}

interface QualityResult {
  modelName?: string
  classId?: number | string
  label?: string
  score?: number | string
  positiveLabel?: string
  passLabel?: string
  result?: boolean
  isPass?: boolean
  topK?: Array<{
    classId?: number | string
    label?: string
    score?: number | string
  }>
  [key: string]: unknown
}

interface DetectBox {
  classId?: number | string
  label?: string
  score?: number | string
  left?: number | string
  top?: number | string
  right?: number | string
  bottom?: number | string
}

interface TargetDetectionResult {
  modelName?: string
  boxes?: DetectBox[]
  [key: string]: unknown
}

interface DetectCallbackResult {
  success?: boolean
  type?: string
  resultSource?: string
  pipelineStatus?: string
  message?: string
  targetModelName?: string
  hasTarget?: boolean
  imagePath?: string
  shouldCloseCamera?: boolean
  fuzzyResult?: QualityResult | null
  remakeResult?: QualityResult | null
  detectionResult?: TargetDetectionResult | null
  boxes?: DetectBox[]
  timestamp?: number
  code?: string
  [key: string]: unknown
}

interface SnapshotRecord {
  imagePath: string
  previewPath: string
  timestamp: number
  timeText: string
  pipelineStatus: string
  message: string
  targetModelName: string
  hasTarget: boolean
  fuzzyResult: QualityResult | null
  remakeResult: QualityResult | null
  detectionResult: TargetDetectionResult | null
  shouldCloseCamera: boolean
  raw: DetectCallbackResult
}

interface AiDetectPlugin {
  startDetect?: (
    options: {
      pipelineMode: boolean
      detectInterval: number
      callbackInterval: number
      targetModel: {
        modelType: 'detection'
        engine: 'ncnn'
        modelName: string
        modelPath: string
        binPath: string
        labelPath: string
        inputSize: number
        threshold: number
        iouThreshold: number
        useGpu: boolean
      }
    },
    callback: (res?: DetectCallbackResult) => void
  ) => DetectCallbackResult | void
}

const targetModels: TargetModel[] = [
  {
    name: 'YOLOv8n 检测模型',
    modelName: 'yolov8n',
    modelPath: 'models/yolov8n_ncnn/yolov8n.param',
    binPath: 'models/yolov8n_ncnn/yolov8n.bin',
    labelPath: 'models/yolov8n_ncnn/labels.txt',
    inputSize: 640,
    threshold: 0.5,
    iouThreshold: 0.45,
    useGpu: false
  }
]

let aiDetect: AiDetectPlugin | null = null
let isAppPlusRuntime = false

// #ifdef APP-PLUS
isAppPlusRuntime = true
try {
  aiDetect = uni.requireNativePlugin('AiDetectPlugin') as AiDetectPlugin
} catch (error) {
  console.error('获取 AiDetectPlugin 失败', error)
}
// #endif

const isDetecting = ref(false)
const isOpeningDetect = ref(false)
const detectStatus = ref('未开始')
const pipelineStatus = ref('')
const pipelineMessage = ref('')
const targetModelName = ref('')
const fuzzyResult = ref<QualityResult | null>(null)
const remakeResult = ref<QualityResult | null>(null)
const detectionResult = ref<TargetDetectionResult | null>(null)
const lastDetectResult = ref<DetectCallbackResult | null>(null)
const snapshotResult = ref<SnapshotRecord | null>(null)
const snapshotList = ref<SnapshotRecord[]>([])
const errorMessage = ref('')

const pluginStatus = computed(() => {
  if (!isAppPlusRuntime) {
    return '不支持原生插件'
  }
  return aiDetect ? 'AiDetectPlugin 已加载' : 'AiDetectPlugin 未加载'
})

const selectedTargetModel = computed(() => targetModels[0])

const normalizedBoxes = computed(() => {
  const boxes = detectionResult.value?.boxes
  return Array.isArray(boxes) ? boxes : []
})

const statusClass = computed(() => {
  if (errorMessage.value || pipelineStatus.value === 'ERROR') {
    return 'is-error'
  }
  if (pipelineStatus.value === 'TARGET_FOUND') {
    return 'is-success'
  }
  if (isDetecting.value || isOpeningDetect.value) {
    return 'is-running'
  }
  return ''
})

const QualityResultView = defineComponent({
  name: 'QualityResultView',
  props: {
    result: {
      type: Object as () => QualityResult | null,
      default: null
    }
  },
  setup(props) {
    return () => {
      if (!props.result) {
        return h('view', { class: 'empty compact-empty' }, '暂无结果')
      }

      return h('view', { class: 'quality-fields' }, [
        renderQualityRow('modelName', props.result.modelName || '-'),
        renderQualityRow('classId', formatText(props.result.classId)),
        renderQualityRow('label', props.result.label || '-'),
        renderQualityRow('score', formatScore(props.result.score)),
        renderQualityRow('result', formatBoolean(props.result.result)),
        renderQualityRow('isPass', formatBoolean(props.result.isPass)),
        renderTopK(props.result.topK)
      ])
    }
  }
})

function renderQualityRow(label: string, value: string) {
  return h('view', { class: 'quality-row' }, [
    h('text', { class: 'quality-label' }, label),
    h('text', { class: 'quality-value' }, value)
  ])
}

function renderTopK(topK?: QualityResult['topK']) {
  if (!Array.isArray(topK) || topK.length === 0) {
    return h('view')
  }

  return h('view', { class: 'topk-list' }, [
    h('text', { class: 'quality-label' }, 'topK'),
    ...topK.map((item, index) =>
      h('view', { class: 'topk-item' }, [
        h('text', { class: 'topk-label' }, `${index + 1}. ${item.label || '-'}`),
        h('text', { class: 'topk-score' }, `${formatText(item.classId)} / ${formatScore(item.score)}`)
      ])
    )
  ])
}

function startDetect() {
  if (!checkPlugin()) {
    return
  }
  if (isOpeningDetect.value || isDetecting.value) {
    return
  }

  const targetModel = selectedTargetModel.value
  const startOptions = {
    pipelineMode: true,
    detectInterval: 500,
    callbackInterval: 500,
    targetModel: {
      modelType: 'detection' as const,
      engine: 'ncnn' as const,
      modelName: 'yolov8n',
      modelPath: 'models/yolov8n_ncnn/yolov8n.param',
      binPath: 'models/yolov8n_ncnn/yolov8n.bin',
      labelPath: 'models/yolov8n_ncnn/labels.txt',
      inputSize: 640,
      threshold: 0.5,
      iouThreshold: 0.45,
      useGpu: false
    }
  }

  resetRuntimeState()
  isOpeningDetect.value = true
  detectStatus.value = '正在打开检测页'
  targetModelName.value = targetModel.modelName

  try {
    console.log('AiDetectPlugin startDetect 参数', startOptions)
    const syncResult = aiDetect?.startDetect?.(startOptions, (res) => {
      console.log('AiDetect result:', res)
      handleDetectCallback(res)
    })
    if (syncResult) {
      console.log('AiDetect result:', syncResult)
      handleDetectCallback(syncResult)
    }
  } catch (error) {
    handleDetectError({
      success: false,
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    })
  }
}

function handleDetectCallback(res?: DetectCallbackResult) {
  console.log('AiDetectPlugin 回调', res)
  if (!res) {
    return
  }

  isOpeningDetect.value = false

  if (res.success === false) {
    if (res.type === 'snapshot_error') {
      handleSnapshotError(res)
    } else {
      handleDetectError(res)
    }
    return
  }

  if (res.type === 'activity_opened') {
    isDetecting.value = true
    detectStatus.value = '检测中'
    pipelineMessage.value = res.message || '原生 DetectActivity 已打开'
    return
  }

  if (res.type === 'detect_result') {
    handlePipelineDetectResult(res)
    return
  }

  if (res.type === 'snapshot') {
    handleSnapshotResult(res)
    return
  }

  if (res.type === 'snapshot_error') {
    handleSnapshotError(res)
    return
  }

  if (res.type === 'error') {
    handleDetectError(res)
  }
}

function handlePipelineDetectResult(res: DetectCallbackResult) {
  lastDetectResult.value = res
  pipelineStatus.value = res.pipelineStatus || ''
  pipelineMessage.value = res.message || ''
  targetModelName.value = res.targetModelName || selectedTargetModel.value.modelName
  fuzzyResult.value = res.fuzzyResult || null
  remakeResult.value = res.remakeResult || null
  detectionResult.value = res.detectionResult || null
  isDetecting.value = true

  const statusTextMap: Record<string, string> = {
    FUZZY: '画面模糊',
    REMAKE: '疑似翻拍',
    NO_TARGET: '未检测到目标',
    TARGET_FOUND: '检测通过',
    ERROR: '检测异常'
  }
  detectStatus.value = statusTextMap[pipelineStatus.value] || res.message || '检测中'
}

function handleSnapshotResult(res: DetectCallbackResult) {
  const imagePath = res.imagePath || ''
  const timestamp = res.timestamp || Date.now()
  const record: SnapshotRecord = {
    imagePath,
    previewPath: normalizeFilePath(imagePath),
    timestamp,
    timeText: formatTime(timestamp),
    pipelineStatus: res.pipelineStatus || '',
    message: res.message || '',
    targetModelName: res.targetModelName || selectedTargetModel.value.modelName,
    hasTarget: Boolean(res.hasTarget),
    fuzzyResult: res.fuzzyResult || null,
    remakeResult: res.remakeResult || null,
    detectionResult: res.detectionResult || null,
    shouldCloseCamera: Boolean(res.shouldCloseCamera),
    raw: res
  }

  snapshotResult.value = record
  snapshotList.value.unshift(record)
  isDetecting.value = false
  isOpeningDetect.value = false
  detectStatus.value = res.message || '已拍照完成'
  errorMessage.value = ''

  pipelineStatus.value = record.pipelineStatus
  pipelineMessage.value = record.message
  targetModelName.value = record.targetModelName
  fuzzyResult.value = record.fuzzyResult
  remakeResult.value = record.remakeResult
  detectionResult.value = record.detectionResult
  lastDetectResult.value = res

  saveSnapshotRecord(record)
  showToast(res.message || '拍照完成', 'success')
}

function handleSnapshotError(res: DetectCallbackResult) {
  const message = res.message || '拍照失败'
  errorMessage.value = message
  isOpeningDetect.value = false

  if (res.shouldCloseCamera === true) {
    isDetecting.value = false
  }

  detectStatus.value = res.message || '拍照异常'

  if (res.imagePath) {
    console.warn('拍照异常，保留 imagePath 用于排查', res.imagePath)
  }

  showToast(message)
  console.error('AiDetectPlugin snapshot_error', res)
}

function handleDetectError(res: DetectCallbackResult) {
  const message = res.message || '检测异常'
  errorMessage.value = message
  isOpeningDetect.value = false

  if (res.shouldCloseCamera === true || res.type === 'error') {
    isDetecting.value = false
  }

  pipelineStatus.value = res.pipelineStatus || pipelineStatus.value || 'ERROR'
  pipelineMessage.value = message
  detectStatus.value = message || '检测异常'
  showToast(message)
  console.error('AiDetectPlugin error', res)
}

function resetRuntimeState() {
  errorMessage.value = ''
  pipelineStatus.value = ''
  pipelineMessage.value = ''
  fuzzyResult.value = null
  remakeResult.value = null
  detectionResult.value = null
  lastDetectResult.value = null
}

function checkPlugin() {
  if (!isAppPlusRuntime) {
    errorMessage.value = '不支持原生插件'
    detectStatus.value = '不支持原生插件'
    showToast('不支持原生插件')
    return false
  }

  if (!aiDetect?.startDetect) {
    errorMessage.value = 'AiDetectPlugin 未加载'
    showToast('AiDetectPlugin 未加载')
    return false
  }

  return true
}

function normalizeFilePath(path: string) {
  if (!path) {
    return ''
  }
  if (path.startsWith('file://')) {
    return path
  }
  return `file://${path}`
}

function formatTime(timestamp?: number) {
  if (!timestamp) {
    return '-'
  }

  const date = new Date(timestamp)
  const pad = (value: number) => String(value).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hour = pad(date.getHours())
  const minute = pad(date.getMinutes())
  const second = pad(date.getSeconds())
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

function formatScore(score?: number | string) {
  if (score === undefined || score === null || score === '') {
    return '-'
  }

  const numericScore = Number(score)
  if (!Number.isFinite(numericScore)) {
    return '-'
  }

  return numericScore.toFixed(3)
}

function formatNumber(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }

  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) {
    return '-'
  }

  return numericValue.toFixed(1)
}

function formatBoolean(value?: boolean) {
  if (value === undefined || value === null) {
    return '-'
  }
  return value ? 'true' : 'false'
}

function formatText(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  return String(value)
}

function getBoxCount(result?: TargetDetectionResult | null) {
  return Array.isArray(result?.boxes) ? result.boxes.length : 0
}

function getBoxes(result?: TargetDetectionResult | null) {
  return Array.isArray(result?.boxes) ? result.boxes : []
}

function showToast(title: string, icon: 'none' | 'success' = 'none') {
  uni.showToast({
    title,
    icon
  })
}

function saveSnapshotRecord(record: SnapshotRecord) {
  console.log('保存拍照记录，可在此处调用后端接口', record)
  console.log('后续可上传结构', {
    imagePath: record.imagePath,
    captureTime: record.timestamp,
    pipelineStatus: record.pipelineStatus,
    message: record.message,
    targetModelName: record.targetModelName,
    fuzzyResult: record.fuzzyResult,
    remakeResult: record.remakeResult,
    detectionResult: record.detectionResult
  })
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.plugin-check-page {
  background: $bg-page;
}

.page-body {
  padding: 0 28rpx 34rpx;
}

.hero-card {
  position: relative;
  overflow: hidden;
  padding: 30rpx;
  border-radius: $card-radius;
  background: linear-gradient(135deg, #1677ff 0%, #35b3ff 100%);
  box-shadow: 0 18rpx 40rpx rgba(22, 119, 255, 0.2);
}

.hero-card::after {
  position: absolute;
  right: -34rpx;
  bottom: -36rpx;
  color: rgba(255, 255, 255, 0.13);
  font-size: 92rpx;
  font-weight: 900;
  content: 'PIPE';
}

.hero-card.is-error {
  background: linear-gradient(135deg, #fa3534 0%, #ff8a65 100%);
  box-shadow: 0 18rpx 40rpx rgba(250, 53, 52, 0.18);
}

.hero-card.is-success {
  background: linear-gradient(135deg, #19be6b 0%, #54d98f 100%);
  box-shadow: 0 18rpx 40rpx rgba(25, 190, 107, 0.18);
}

.hero-main {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
}

.hero-icon {
  @include flex-center;
  flex-shrink: 0;
  width: 78rpx;
  height: 78rpx;
  border-radius: 24rpx;
  color: $primary-color;
  font-size: 25rpx;
  font-weight: 900;
  background: #ffffff;
}

.hero-copy {
  min-width: 0;
  flex: 1;
}

.title,
.subtitle,
.card-title,
.card-subtitle,
.model-name,
.model-desc,
.info-label,
.info-value,
.label,
.value,
.pipeline-label,
.pipeline-status,
.pipeline-message,
.panel-title,
.box-label,
.box-score,
.box-meta,
.record-time,
.record-line,
.empty,
.error-box {
  display: block;
}

.title {
  color: #ffffff;
  font-size: 38rpx;
  font-weight: 800;
  line-height: 1.2;
}

.subtitle {
  margin-top: 10rpx;
  color: rgba(255, 255, 255, 0.86);
  font-size: 24rpx;
  line-height: 1.35;
}

.status-pill {
  flex-shrink: 0;
  max-width: 190rpx;
  padding: 9rpx 16rpx;
  border-radius: 28rpx;
  color: $primary-color;
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1.35;
  text-align: center;
  background: rgba(255, 255, 255, 0.92);
}

.status-pill.is-running {
  color: $primary-color;
}

.status-pill.is-success {
  color: $success-color;
}

.status-pill.is-error {
  color: $error-color;
}

.pipeline-steps {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 30rpx;
}

.step-tag {
  padding: 9rpx 18rpx;
  border-radius: 28rpx;
  color: #ffffff;
  font-size: 23rpx;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.18);
}

.step-tag.active {
  color: $primary-color;
  background: #ffffff;
}

.step-arrow {
  color: rgba(255, 255, 255, 0.72);
  font-size: 25rpx;
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
  line-height: 1.25;
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

.model-picker {
  margin-bottom: 18rpx;
}

.picker-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 24rpx;
  border: 2rpx solid rgba(22, 119, 255, 0.16);
  border-radius: 20rpx;
  background: linear-gradient(135deg, #f8fbff 0%, #eef7ff 100%);
}

.model-name {
  color: $text-main;
  font-size: 29rpx;
  font-weight: 800;
  line-height: 1.3;
}

.model-desc {
  margin-top: 8rpx;
  color: $primary-color;
  font-size: 24rpx;
  font-weight: 600;
}

.picker-arrow {
  flex-shrink: 0;
  padding: 8rpx 16rpx;
  border-radius: 22rpx;
  color: $primary-color;
  font-size: 23rpx;
  background: #ffffff;
}

.model-grid,
.result-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.info-item,
.result-panel,
.pipeline-box,
.target-summary,
.snapshot-target {
  min-width: 0;
  padding: 20rpx;
  border-radius: 20rpx;
  background: #f8fbff;
}

.info-item {
  border: 1rpx solid $border-color;
}

.info-label,
.label,
.pipeline-label,
.quality-label {
  color: $text-secondary;
  font-size: 23rpx;
}

.info-value,
.value,
.pipeline-message,
.quality-value {
  min-width: 0;
  margin-top: 8rpx;
  color: $text-main;
  font-size: 25rpx;
  line-height: 1.45;
}

.path-text {
  word-break: break-all;
}

.button-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16rpx;
}

.action-btn {
  @include flex-center;
  width: 100%;
  min-height: 86rpx;
  border-radius: 43rpx;
  color: $primary-color;
  font-size: 28rpx;
  font-weight: 700;
  background: $primary-light;
}

.action-btn.primary {
  color: #ffffff;
  background: linear-gradient(135deg, #1677ff 0%, #38a4ff 100%);
  box-shadow: 0 14rpx 26rpx rgba(22, 119, 255, 0.2);
}

.action-btn.danger {
  color: $error-color;
  background: #fff1f0;
}

.action-btn[disabled] {
  opacity: 0.55;
}

.row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 14rpx;
}

.row.column {
  display: block;
}

.label {
  flex-shrink: 0;
}

.value {
  flex: 1;
  text-align: right;
}

.row.column .value {
  text-align: left;
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

.pipeline-box {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16rpx;
}

.pipeline-box > view {
  padding: 18rpx;
  border-radius: 18rpx;
  background: #ffffff;
}

.pipeline-status {
  margin-top: 10rpx;
  color: $primary-color;
  font-size: 36rpx;
  font-weight: 900;
  line-height: 1.2;
}

.panel-title {
  margin-bottom: 16rpx;
  color: $text-main;
  font-size: 26rpx;
  font-weight: 800;
}

.quality-fields {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.quality-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
}

.quality-value {
  margin-top: 0;
  font-weight: 700;
  text-align: right;
}

.topk-list {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-top: 8rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid $border-color;
}

.topk-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.topk-label,
.topk-score {
  color: $text-secondary;
  font-size: 22rpx;
  line-height: 1.35;
}

.topk-score {
  flex-shrink: 0;
  color: $text-main;
  font-weight: 700;
}

.box-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 18rpx;
}

.box-item {
  padding: 18rpx;
  border: 1rpx solid $border-color;
  border-radius: 18rpx;
  background: #ffffff;
}

.box-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.box-label {
  min-width: 0;
  color: $text-main;
  font-size: 26rpx;
  font-weight: 800;
  line-height: 1.3;
}

.box-score {
  flex-shrink: 0;
  padding: 6rpx 12rpx;
  border-radius: 18rpx;
  color: $success-color;
  font-size: 23rpx;
  font-weight: 800;
  background: #e9f8ef;
}

.box-meta {
  margin-top: 7rpx;
  color: $text-secondary;
  font-size: 23rpx;
  line-height: 1.4;
}

.snapshot-image {
  width: 100%;
  margin-bottom: 18rpx;
  border-radius: 20rpx;
  background: #edf1f8;
}

.snapshot-results {
  margin-top: 18rpx;
}

.snapshot-target {
  margin-top: 16rpx;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.record-item {
  display: flex;
  gap: 18rpx;
  min-width: 0;
  padding: 18rpx;
  border-radius: 20rpx;
  background: #f8fbff;
}

.record-image {
  flex-shrink: 0;
  width: 128rpx;
  height: 128rpx;
  border-radius: 18rpx;
  background: #edf1f8;
}

.record-info {
  min-width: 0;
  flex: 1;
}

.record-time {
  color: $text-main;
  font-size: 25rpx;
  font-weight: 800;
  line-height: 1.35;
}

.record-line {
  margin-top: 8rpx;
  color: $text-secondary;
  font-size: 23rpx;
  line-height: 1.4;
}

.empty {
  padding: 18rpx 0;
  color: $text-muted;
  font-size: 24rpx;
}

.compact-empty {
  padding: 4rpx 0;
}

@media (max-width: 420px) {
  .hero-main,
  .card-head {
    flex-direction: column;
  }

  .status-pill {
    max-width: none;
  }

  .model-grid,
  .result-grid {
    grid-template-columns: 1fr;
  }
}
</style>
