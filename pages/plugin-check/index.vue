<template>
  <view class="plugin-check-page page safe-page">
    <AppNavbar title="插件检测" show-back />
    <view class="page-body">
      <view class="hero-card" :class="statusClass">
        <view class="hero-main">
          <view class="hero-icon"><text>AI</text></view>
          <view class="hero-copy">
            <text class="title">{{ currentMode.label }}</text>
            <text class="subtitle">{{ currentMode.subtitle }}</text>
          </view>
          <text class="status-pill">{{ detectStatus }}</text>
        </view>
        <view class="stage-row">
          <template v-for="(stage, index) in currentMode.stages" :key="stage">
            <text class="stage-tag" :class="{ active: index === currentMode.stages.length - 1 }">{{ stage }}</text>
            <text v-if="index < currentMode.stages.length - 1" class="stage-arrow">→</text>
          </template>
        </view>
      </view>

      <view class="card">
        <view class="card-head">
          <view>
            <text class="card-title">检测模式</text>
            <text class="card-subtitle">detectMode: {{ selectedMode }}</text>
          </view>
          <text class="badge">{{ pluginStatus }}</text>
        </view>
        <view class="mode-grid">
          <button
            v-for="mode in detectModes"
            :key="mode.value"
            class="mode-btn"
            :class="{ active: selectedMode === mode.value }"
            :disabled="isOpeningDetect || isDetecting"
            @click="selectMode(mode.value)"
          >
            <text class="mode-title">{{ mode.label }}</text>
            <text class="mode-desc">{{ mode.desc }}</text>
          </button>
        </view>
      </view>

      <view class="card">
        <view class="card-head">
          <view>
            <text class="card-title">启动参数</text>
            <text class="card-subtitle">{{ optionSummary }}</text>
          </view>
          <text class="badge">{{ modelPlacementText }}</text>
        </view>
        <view class="info-grid">
          <view class="info-item"><text class="info-label">detectInterval</text><text class="info-value">{{ currentOptions.detectInterval || '-' }} ms</text></view>
          <view class="info-item"><text class="info-label">callbackInterval</text><text class="info-value">{{ currentOptions.callbackInterval || '-' }} ms</text></view>
          <view class="info-item"><text class="info-label">labels</text><text class="info-value">{{ activeLabels || '全部绘制' }}</text></view>
          <view class="info-item"><text class="info-label">targetModel</text><text class="info-value">{{ usesTargetModel ? selectedTargetModel.modelName : '不需要' }}</text></view>
        </view>
        <view v-if="usesTargetModel" class="model-panel">
          <view class="model-head">
            <view>
              <text class="model-name">{{ selectedTargetModel.name }}</text>
              <text class="model-desc">{{ selectedTargetModel.modelArch }} · {{ selectedTargetModel.engine }}</text>
            </view>
            <text class="badge">{{ selectedTargetModel.useGpu ? 'GPU' : 'CPU' }}</text>
          </view>
          <text class="path-text">modelPath: {{ selectedTargetModel.modelPath }}</text>
          <text class="path-text">binPath: {{ selectedTargetModel.binPath }}</text>
          <text class="path-text">labelPath: {{ selectedTargetModel.labelPath }}</text>
        </view>
        <view class="json-box"><text class="json-text">{{ currentOptionsText }}</text></view>
      </view>

      <view class="card">
        <view class="card-head">
          <view>
            <text class="card-title">检测操作</text>
            <text class="card-subtitle">{{ actionSubtitle }}</text>
          </view>
        </view>
        <view class="button-row">
          <button class="action-btn primary" :disabled="isOpeningDetect || isDetecting" @click="startDetect">{{ isOpeningDetect ? '正在打开...' : '开始检测' }}</button>
          <button class="action-btn danger" :disabled="!isDetecting" @click="stopDetect">停止检测</button>
        </view>
        <view v-if="errorMessage" class="error-box">{{ errorMessage }}</view>
      </view>

      <view class="card">
        <view class="card-head">
          <view>
            <text class="card-title">最新回调</text>
            <text class="card-subtitle">{{ latestEventSubtitle }}</text>
          </view>
          <text class="badge">{{ latestEvent?.type || 'none' }}</text>
        </view>
        <view class="info-grid">
          <view class="info-item"><text class="info-label">pipelineStatus</text><text class="info-value strong">{{ pipelineStatus || '-' }}</text></view>
          <view class="info-item"><text class="info-label">message</text><text class="info-value">{{ pipelineMessage || '-' }}</text></view>
          <view class="info-item"><text class="info-label">targetModelName</text><text class="info-value">{{ targetModelName || '-' }}</text></view>
          <view class="info-item"><text class="info-label">hasTarget</text><text class="info-value">{{ latestHasTarget }}</text></view>
        </view>
      </view>

      <view class="card">
        <view class="card-head"><view><text class="card-title">质量检测结果</text><text class="card-subtitle">fuzzyResult / remakeResult</text></view></view>
        <view class="result-grid">
          <view class="result-panel"><text class="panel-title">fuzzyResult</text><quality-result-view :result="fuzzyResult" /></view>
          <view class="result-panel"><text class="panel-title">remakeResult</text><quality-result-view :result="remakeResult" /></view>
        </view>
      </view>

      <view class="card">
        <view class="card-head"><view><text class="card-title">目标检测结果</text><text class="card-subtitle">boxes / detectionResult</text></view><text class="badge">{{ boxes.length }} 个</text></view>
        <view v-if="detectionResult" class="result-panel">
          <view class="row"><text class="label">modelName</text><text class="value">{{ detectionResult.modelName || '-' }}</text></view>
          <view v-if="boxes.length" class="box-list">
            <view v-for="(box, index) in boxes" :key="index" class="box-item">
              <view class="box-head"><text class="box-label">{{ box.label || `目标 ${index + 1}` }}</text><text class="box-score">{{ formatScore(box.score) }}</text></view>
              <text class="box-meta">classId: {{ formatText(box.classId) }}</text>
              <text class="box-meta">left: {{ formatNumber(box.left) }} / top: {{ formatNumber(box.top) }}</text>
              <text class="box-meta">right: {{ formatNumber(box.right) }} / bottom: {{ formatNumber(box.bottom) }}</text>
            </view>
          </view>
          <view v-else class="empty">暂无检测框</view>
        </view>
        <view v-else class="empty">当前模式尚未返回目标检测结果</view>
      </view>

      <view class="card">
        <view class="card-head"><view><text class="card-title">拍照结果</text><text class="card-subtitle">snapshot / 多图完成结果</text></view><text class="badge">{{ snapshotList.length }} 张</text></view>
        <view v-if="snapshotResult" class="snapshot-detail">
          <image v-if="snapshotResult.previewPath" class="snapshot-image" :src="snapshotResult.previewPath" mode="widthFix" />
          <view class="row column"><text class="label">imagePath</text><text class="value path-text">{{ snapshotResult.imagePath || '-' }}</text></view>
          <view v-if="showSnapshotStatus" class="row"><text class="label">result</text><text class="value">{{ snapshotResult.result || '-' }}</text></view>
          <view v-if="showSnapshotStatus" class="row"><text class="label">target</text><text class="value">{{ snapshotResult.target || '-' }}</text></view>
          <view v-if="showSnapshotStatus" class="row"><text class="label">confidence</text><text class="value">{{ formatScore(snapshotResult.confidence) }}</text></view>
          <view class="row"><text class="label">time</text><text class="value">{{ snapshotResult.timeText }}</text></view>
        </view>
        <view v-else class="empty">暂无拍照结果</view>
        <view v-if="snapshotList.length" class="record-list">
          <view v-for="(item, index) in snapshotList" :key="`${item.timestamp}-${item.index}-${index}`" class="record-item">
            <image v-if="item.previewPath" class="record-image" :src="item.previewPath" mode="aspectFill" />
            <view class="record-info">
              <text class="record-time">#{{ item.index || index + 1 }} {{ item.timeText }}</text>
              <text v-if="showSnapshotStatus" class="record-line">{{ item.result || '-' }} · {{ item.target || '无目标' }}</text>
              <text v-if="showSnapshotStatus" class="record-line">fuzzy: {{ item.fuzzyLabel || '-' }} / remake: {{ item.remakeLabel || '-' }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="card">
        <view class="card-head"><view><text class="card-title">原始 JSON</text><text class="card-subtitle">用于核对原生插件返回字段</text></view></view>
        <view class="json-box raw-json"><text class="json-text">{{ latestEventText }}</text></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from 'vue'
import AppNavbar from '@/components/AppNavbar.vue'

type DetectMode = 'photo_only' | 'target_only' | 'quality_only' | 'full_pipeline'
type AnyRecord = Record<string, any>

interface ModeConfig { value: DetectMode; label: string; subtitle: string; desc: string; stages: string[] }
interface TargetModel {
  name: string
  modelType: string
  modelArch: 'yolov8' | 'yolov5'
  engine: 'ncnn' | 'mock'
  labels?: string
  modelName: string
  modelPath: string
  binPath: string
  labelPath: string
  inputSize: number
  threshold: number
  iouThreshold: number
  useGpu: boolean
}
interface SnapshotRecord {
  index: number
  imagePath: string
  previewPath: string
  timestamp: number
  timeText: string
  result: string
  target: string
  confidence?: number | string
  fuzzyLabel: string
  remakeLabel: string
  raw: AnyRecord
}
interface AiDetectPlugin {
  startDetect?: (options: AnyRecord, callback: (res?: AnyRecord) => void) => AnyRecord | void
  stopDetect?: (options?: AnyRecord, callback?: (res?: AnyRecord) => void) => AnyRecord | void
}
const detectModes: ModeConfig[] = [
  { value: 'photo_only', label: '纯拍照', subtitle: '只打开原生相机并返回照片', desc: '不加载模型', stages: ['preview', 'snapshot'] },
  { value: 'target_only', label: '单模型目标检测', subtitle: '只运行目标检测模型', desc: 'YOLO 目标框', stages: ['targetModel'] },
  { value: 'quality_only', label: '模糊 + 翻拍', subtitle: '只运行内置质量模型', desc: 'fuzzy → remake', stages: ['fuzzy', 'remake'] },
  { value: 'full_pipeline', label: '完整 Pipeline', subtitle: '模糊、翻拍与目标检测串联', desc: 'fuzzy → remake → target', stages: ['fuzzy', 'remake', 'targetModel'] }
]

const targetModels: TargetModel[] = [{
  name: '外部 YOLOv5 目标检测模型',
  modelType: 'detection',
  modelArch: 'yolov5',
  engine: 'ncnn',
  labels: 'person',
  modelName: 'mqj_Integration_v14',
  modelPath: 'models/object/mqj_Integration_v14.ncnn.param',
  binPath: 'models/object/mqj_Integration_v14.ncnn.bin',
  labelPath: 'models/object/labels.txt',
  inputSize: 640,
  threshold: 0.5,
  iouThreshold: 0.45,
  useGpu: false
}]

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

const selectedMode = ref<DetectMode>('full_pipeline')
const detectInterval = ref(500)
const callbackInterval = ref(500)
const isDetecting = ref(false)
const isOpeningDetect = ref(false)
const detectStatus = ref('未开始')
const pipelineStatus = ref('')
const pipelineMessage = ref('')
const targetModelName = ref('')
const fuzzyResult = ref<AnyRecord | null>(null)
const remakeResult = ref<AnyRecord | null>(null)
const detectionResult = ref<AnyRecord | null>(null)
const latestEvent = ref<AnyRecord | null>(null)
const snapshotResult = ref<SnapshotRecord | null>(null)
const snapshotList = ref<SnapshotRecord[]>([])
const errorMessage = ref('')

const selectedTargetModel = computed(() => targetModels[0])
const currentMode = computed(() => detectModes.find((mode) => mode.value === selectedMode.value) || detectModes[0])
const usesTargetModel = computed(() => selectedMode.value === 'target_only' || selectedMode.value === 'full_pipeline')
const showSnapshotStatus = computed(() => selectedMode.value !== 'photo_only')
const activeLabels = computed(() => (usesTargetModel.value ? selectedTargetModel.value.labels || '' : ''))
const boxes = computed(() => (Array.isArray(detectionResult.value?.boxes) ? detectionResult.value?.boxes : []))
const currentOptions = computed(() => buildStartOptions(selectedMode.value))
const currentOptionsText = computed(() => JSON.stringify(currentOptions.value, null, 2))
const latestEventText = computed(() => (latestEvent.value ? JSON.stringify(latestEvent.value, null, 2) : '{}'))

const pluginStatus = computed(() => (!isAppPlusRuntime ? '非 App' : aiDetect ? '已加载' : '未加载'))
const actionSubtitle = computed(() => (!isAppPlusRuntime ? '当前环境无法调用 Android 原生插件' : aiDetect ? 'AiDetectPlugin.startDetect' : '未获取到 AiDetectPlugin'))
const latestHasTarget = computed(() => (latestEvent.value?.hasTarget === undefined ? '-' : latestEvent.value.hasTarget ? 'true' : 'false'))
const latestEventSubtitle = computed(() => latestEvent.value ? `${latestEvent.value.success === false ? '失败' : '成功'} · ${formatTime(latestEvent.value.timestamp)}` : '等待原生回调')
const optionSummary = computed(() => {
  if (selectedMode.value === 'photo_only') return 'photo_only 不创建 ImageAnalysis，也不需要模型字段'
  if (selectedMode.value === 'quality_only') return 'quality_only 使用内置 fuzzy/remake 模型，不传 targetModel'
  if (selectedMode.value === 'target_only') return 'target_only 将目标模型字段放在 options 顶层'
  return 'full_pipeline 将目标模型字段放在 targetModel 内'
})
const modelPlacementText = computed(() => {
  if (selectedMode.value === 'target_only') return '顶层模型字段'
  if (selectedMode.value === 'full_pipeline') return 'targetModel'
  return '无需目标模型'
})
const statusClass = computed(() => {
  if (errorMessage.value || pipelineStatus.value === 'ERROR') return 'is-error'
  if (pipelineStatus.value === 'TARGET_FOUND' || pipelineStatus.value === 'QUALITY_PASS' || latestEvent.value?.qualified === true) return 'is-success'
  if (isDetecting.value || isOpeningDetect.value) return 'is-running'
  return ''
})

const QualityResultView = defineComponent({
  name: 'QualityResultView',
  props: { result: { type: Object as () => AnyRecord | null, default: null } },
  setup(props) {
    return () => {
      if (!props.result) return h('view', { class: 'empty compact-empty' }, '暂无结果')
      return h('view', { class: 'quality-fields' }, [
        qualityRow('modelName', props.result.modelName || '-'),
        qualityRow('classId', formatText(props.result.classId)),
        qualityRow('businessLabel', formatBusinessLabel(getQualityBusinessLabel(props.result))),
        qualityRow('rawLabel', props.result.label || '-'),
        qualityRow('score', formatScore(props.result.score)),
        qualityRow('result', formatBoolean(props.result.result)),
        qualityRow('isPass', formatBoolean(props.result.isPass))
      ])
    }
  }
})

function qualityRow(label: string, value: string) {
  return h('view', { class: 'quality-row' }, [h('text', { class: 'quality-label' }, label), h('text', { class: 'quality-value' }, value)])
}

function selectMode(mode: DetectMode) {
  selectedMode.value = mode
  resetRuntimeState()
  detectStatus.value = '未开始'
}

function buildStartOptions(mode: DetectMode): AnyRecord {
  if (mode === 'photo_only') return { detectMode: mode }
  const baseOptions: AnyRecord = { detectMode: mode, detectInterval: detectInterval.value, callbackInterval: callbackInterval.value }
  if (mode === 'quality_only') return baseOptions
  const targetModel = buildTargetModelOptions()
  if (mode === 'target_only') return { ...baseOptions, labels: selectedTargetModel.value.labels, ...targetModel }
  return { ...baseOptions, labels: selectedTargetModel.value.labels, targetModel }
}

function buildTargetModelOptions() {
  const model = selectedTargetModel.value
  return {
    modelType: model.modelType,
    modelArch: model.modelArch,
    engine: model.engine,
    modelName: model.modelName,
    modelPath: model.modelPath,
    binPath: model.binPath,
    labelPath: model.labelPath,
    inputSize: model.inputSize,
    threshold: model.threshold,
    iouThreshold: model.iouThreshold,
    useGpu: model.useGpu
  }
}

function startDetect() {
  if (!checkPlugin() || isOpeningDetect.value || isDetecting.value) return
  resetRuntimeState()
  isOpeningDetect.value = true
  detectStatus.value = '正在打开检测页'
  targetModelName.value = usesTargetModel.value ? selectedTargetModel.value.modelName : ''
  try {
    const options = currentOptions.value
    console.log('AiDetectPlugin startDetect 参数', options)
    const syncResult = aiDetect?.startDetect?.(options, (res) => handleDetectCallback(res))
    if (syncResult) handleDetectCallback(syncResult)
  } catch (error) {
    handleDetectError({ success: false, type: 'error', message: error instanceof Error ? error.message : String(error), timestamp: Date.now() })
  }
}

function stopDetect() {
  if (!aiDetect?.stopDetect) {
    isDetecting.value = false
    detectStatus.value = '已停止'
    return
  }
  try {
    const syncResult = aiDetect.stopDetect({}, (res) => handleDetectCallback(res))
    if (syncResult) handleDetectCallback(syncResult)
  } catch (error) {
    handleDetectError({ success: false, type: 'error', message: error instanceof Error ? error.message : String(error), timestamp: Date.now() })
  }
}

function handleDetectCallback(res?: AnyRecord) {
  if (!res) return
  latestEvent.value = res
  isOpeningDetect.value = false
  if (res.success === false) {
    if (res.type === 'cancel') handleCancel(res)
    else handleDetectError(res)
    return
  }
  if (res.type === 'activity_opened') {
    isDetecting.value = true
    detectStatus.value = '检测页已打开'
    pipelineMessage.value = res.message || '原生检测页已打开'
    return
  }
  if (res.type === 'camera_permission_granted' || res.type === 'camera_preview_started') {
    isDetecting.value = true
    detectStatus.value = res.message || '检测中'
    pipelineMessage.value = res.message || pipelineMessage.value
    return
  }
  if (res.type === 'detect_result') return handleRealtimeResult(res)
  if (res.type === 'snapshot') return handleSnapshotResult(res)
  if (res.type === 'detect_stopped') {
    isDetecting.value = false
    detectStatus.value = '已停止'
    pipelineMessage.value = res.message || '已停止检测'
    return
  }
  if (res.type === 'error' || res.type === 'snapshot_error') return handleDetectError(res)
  pipelineMessage.value = res.message || pipelineMessage.value
  detectStatus.value = res.message || detectStatus.value
}

function handleRealtimeResult(res: AnyRecord) {
  const normalizedDetectionResult = normalizeDetectionResult(res)
  pipelineStatus.value = inferStatus(res)
  pipelineMessage.value = res.message || getPipelineStatusText(pipelineStatus.value)
  targetModelName.value = res.targetModelName || normalizedDetectionResult?.modelName || targetModelName.value
  fuzzyResult.value = res.fuzzyResult || null
  remakeResult.value = res.remakeResult || null
  detectionResult.value = normalizedDetectionResult
  isDetecting.value = true
  detectStatus.value = pipelineMessage.value || '检测中'
  errorMessage.value = ''
}
function handleSnapshotResult(res: AnyRecord) {
  if (Array.isArray(res.images) && res.images.length > 0) {
    const records = res.images.map((item: AnyRecord, index: number) => createSnapshotRecordFromImage(item, res, index))
    snapshotList.value = [...records].reverse()
    snapshotResult.value = records[records.length - 1] || null
    records.forEach(resolveSnapshotPreviewPath)
  } else {
    const record = createSnapshotRecordFromCallback(res)
    snapshotResult.value = record
    snapshotList.value.unshift(record)
    resolveSnapshotPreviewPath(record)
  }

  pipelineStatus.value = inferStatus(res)
  pipelineMessage.value = res.message || getPipelineStatusText(pipelineStatus.value)
  targetModelName.value = res.targetModelName || targetModelName.value
  fuzzyResult.value = res.fuzzyResult || null
  remakeResult.value = res.remakeResult || null
  detectionResult.value = normalizeDetectionResult(res)
  errorMessage.value = ''

  if (res.mode === 'multi' || res.shouldCloseCamera === true) {
    isDetecting.value = false
  }

  detectStatus.value = res.message || (res.mode === 'multi' ? '已完成拍摄' : '已拍照')
  if (selectedMode.value !== 'photo_only') showToast(detectStatus.value, 'success')
}

function createSnapshotRecordFromCallback(res: AnyRecord): SnapshotRecord {
  const timestamp = res.timestamp || Date.now()
  const imagePath = res.imagePath || res.path || ''
  return {
    index: snapshotList.value.length + 1,
    imagePath,
    previewPath: normalizeFilePath(imagePath),
    timestamp,
    timeText: formatTime(timestamp),
    result: getSnapshotDisplayResult(res),
    target: getSnapshotTarget(res),
    confidence: getSnapshotConfidence(res),
    fuzzyLabel: getQualityBusinessLabel(res.fuzzyResult),
    remakeLabel: getQualityBusinessLabel(res.remakeResult),
    raw: res
  }
}

function createSnapshotRecordFromImage(image: AnyRecord, parent: AnyRecord, fallbackIndex: number): SnapshotRecord {
  const imagePath = image.imagePath || image.path || ''
  const timestamp = parent.timestamp || Date.now()
  return {
    index: Number(image.index || fallbackIndex + 1),
    imagePath,
    previewPath: normalizeFilePath(imagePath),
    timestamp,
    timeText: image.time || formatTime(timestamp),
    result: getSnapshotDisplayResult(image, parent),
    target: image.target || '',
    confidence: image.confidence,
    fuzzyLabel: image.fuzzyLabel || '',
    remakeLabel: image.remakeLabel || '',
    raw: image
  }
}

function handleCancel(res: AnyRecord) {
  isDetecting.value = false
  isOpeningDetect.value = false
  detectStatus.value = '已取消'
  pipelineMessage.value = res.message || 'cancel'
}

function handleDetectError(res: AnyRecord) {
  const message = res.message || '检测异常'
  errorMessage.value = message
  isOpeningDetect.value = false
  if (res.type === 'error' || res.type === 'cancel' || res.shouldCloseCamera === true) {
    isDetecting.value = false
  }
  pipelineStatus.value = res.pipelineStatus || pipelineStatus.value || 'ERROR'
  pipelineMessage.value = message
  detectStatus.value = message
  showToast(message)
  console.error('AiDetectPlugin error', res)
}

function resetRuntimeState() {
  errorMessage.value = ''
  pipelineStatus.value = ''
  pipelineMessage.value = ''
  targetModelName.value = ''
  fuzzyResult.value = null
  remakeResult.value = null
  detectionResult.value = null
  latestEvent.value = null
}

function checkPlugin() {
  if (!isAppPlusRuntime) {
    errorMessage.value = '当前环境不支持原生插件'
    detectStatus.value = '非 App 环境'
    showToast('当前环境不支持原生插件')
    return false
  }
  if (!aiDetect?.startDetect) {
    errorMessage.value = 'AiDetectPlugin 未加载'
    showToast('AiDetectPlugin 未加载')
    return false
  }
  return true
}

function inferStatus(res: AnyRecord) {
  if (res.pipelineStatus) return res.pipelineStatus
  if (selectedMode.value === 'photo_only') return res.qualified === false ? 'PHOTO_FAIL' : 'PHOTO_PASS'
  if (selectedMode.value === 'target_only') return res.hasTarget || getResultBoxes(res).length > 0 ? 'TARGET_FOUND' : 'NO_TARGET'
  return ''
}

function normalizeDetectionResult(res: AnyRecord): AnyRecord | null {
  const resultBoxes = getResultBoxes(res)
  if (!res.detectionResult && resultBoxes.length === 0) return null
  return {
    ...(res.detectionResult || {}),
    modelName: res.detectionResult?.modelName || res.targetModelName || selectedTargetModel.value.modelName,
    boxes: resultBoxes
  }
}

function getResultBoxes(res: AnyRecord) {
  if (res.pipelineStatus && res.pipelineStatus !== 'TARGET_FOUND') return []
  if (Array.isArray(res.detectionResult?.boxes)) return res.detectionResult.boxes
  return Array.isArray(res.boxes) ? res.boxes : []
}

function getSnapshotTarget(res: AnyRecord) {
  if (typeof res.target === 'string') return res.target
  return getResultBoxes(res)[0]?.label || ''
}

function getSnapshotConfidence(res: AnyRecord) {
  if (typeof res.confidence === 'number' || typeof res.confidence === 'string') return res.confidence
  return getResultBoxes(res)[0]?.score
}

function getSnapshotDisplayResult(source: AnyRecord, parent: AnyRecord = source) {
  if (selectedMode.value === 'photo_only') return ''

  const status = source.pipelineStatus || parent.pipelineStatus || ''
  const targetText = String(source.target || parent.target || '').trim()
  const hasBoxes = getResultBoxes(source).length > 0 || getResultBoxes(parent).length > 0
  const hasTarget = Boolean(source.hasTarget || parent.hasTarget || hasBoxes || (targetText && targetText !== '无目标' && targetText !== '-'))
  const confidence = Number(source.confidence ?? parent.confidence)
  const hasConfidence = Number.isFinite(confidence) && confidence > 0

  if (status === 'TARGET_FOUND' || ((selectedMode.value === 'full_pipeline' || selectedMode.value === 'target_only') && (hasTarget || hasConfidence))) {
    return 'pass'
  }

  if (status === 'QUALITY_PASS') return 'pass'
  if (status === 'FUZZY' || status === 'REMAKE' || status === 'NO_TARGET' || status === 'ERROR') return 'fail'
  if (source.qualified === true || parent.qualified === true) return 'pass'
  if (source.qualified === false || parent.qualified === false) return 'fail'

  return source.result || parent.result || ''
}

function normalizeFilePath(path: string) {
  if (!path) return ''
  return path.startsWith('file://') ? path : `file://${path}`
}

function resolveSnapshotPreviewPath(record: SnapshotRecord) {
  if (!record.imagePath) return
  // #ifdef APP-PLUS
  const appPlus = (globalThis as { plus?: any }).plus
  if (appPlus?.io?.resolveLocalFileSystemURL) {
    appPlus.io.resolveLocalFileSystemURL(
      record.imagePath,
      (entry: { toLocalURL?: () => string }) => {
        const previewPath = entry.toLocalURL?.() || normalizeFilePath(record.imagePath)
        record.previewPath = previewPath
        if (snapshotResult.value?.imagePath === record.imagePath) snapshotResult.value.previewPath = previewPath
      },
      () => {
        record.previewPath = normalizeFilePath(record.imagePath)
      }
    )
  }
  // #endif
}

function formatTime(timestamp?: number) {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function formatScore(score?: number | string) {
  if (score === undefined || score === null || score === '') return '-'
  const numericScore = Number(score)
  return Number.isFinite(numericScore) ? numericScore.toFixed(3) : '-'
}

function formatNumber(value?: number | string) {
  if (value === undefined || value === null || value === '') return '-'
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue.toFixed(1) : '-'
}

function formatBoolean(value?: boolean) {
  if (value === undefined || value === null) return '-'
  return value ? 'true' : 'false'
}

function formatText(value?: number | string) {
  if (value === undefined || value === null || value === '') return '-'
  return String(value)
}

function formatBusinessLabel(label?: string) {
  const labelTextMap: Record<string, string> = { fuzzy: '画面模糊', remake: '疑似翻拍', hegui: '合规' }
  return label ? `${labelTextMap[label] || label} (${label})` : '-'
}

function getQualityBusinessLabel(result?: AnyRecord | null) {
  if (!result) return ''
  if (result.businessLabel) return result.businessLabel
  if (result.modelName === 'resnet18_fuzzy') return result.label === '0' ? 'fuzzy' : result.label === '1' ? 'hegui' : ''
  if (result.modelName === 'resnet18_remake') return result.label === '0' ? 'hegui' : result.label === '1' ? 'remake' : ''
  return ''
}

function getPipelineStatusText(status?: string) {
  const statusTextMap: Record<string, string> = {
    FUZZY: '画面模糊，请重新拍摄',
    REMAKE: '疑似翻拍，请重新拍摄',
    QUALITY_PASS: '质量检测通过',
    NO_TARGET: '未检测到目标',
    TARGET_FOUND: '检测通过',
    PHOTO_PASS: '拍照完成',
    PHOTO_FAIL: '拍照失败',
    ERROR: '检测异常，请重试'
  }
  return status ? statusTextMap[status] || status : ''
}

function showToast(title: string, icon: 'none' | 'success' = 'none') {
  uni.showToast({ title, icon })
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

.hero-card,
.card {
  border-radius: $card-radius;
  background: #ffffff;
  box-shadow: $shadow-card;
}

.hero-card {
  position: relative;
  overflow: hidden;
  padding: 30rpx;
  color: #ffffff;
  background: linear-gradient(135deg, #1677ff 0%, #35b3ff 100%);
}

.hero-card::after {
  position: absolute;
  right: -28rpx;
  bottom: -38rpx;
  color: rgba(255, 255, 255, 0.13);
  font-size: 88rpx;
  font-weight: 900;
  content: 'MODE';
}

.hero-card.is-error {
  background: linear-gradient(135deg, #fa3534 0%, #ff8a65 100%);
}

.hero-card.is-success {
  background: linear-gradient(135deg, #19be6b 0%, #54d98f 100%);
}

.hero-main,
.card-head,
.model-head,
.row,
.quality-row,
.box-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.hero-main {
  position: relative;
  z-index: 1;
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

.hero-copy,
.record-info {
  min-width: 0;
  flex: 1;
}

.title,
.subtitle,
.card-title,
.card-subtitle,
.mode-title,
.mode-desc,
.model-name,
.model-desc,
.info-label,
.info-value,
.label,
.value,
.panel-title,
.box-label,
.box-score,
.box-meta,
.record-time,
.record-line,
.json-text,
.path-text,
.empty,
.error-box {
  display: block;
}

.title {
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

.status-pill,
.badge {
  flex-shrink: 0;
  padding: 8rpx 16rpx;
  border-radius: 22rpx;
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1.35;
  text-align: center;
}

.status-pill {
  max-width: 190rpx;
  color: $primary-color;
  background: rgba(255, 255, 255, 0.92);
}

.badge {
  color: $primary-color;
  background: $primary-bg;
}

.stage-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 30rpx;
}

.stage-tag {
  padding: 9rpx 18rpx;
  border-radius: 28rpx;
  color: #ffffff;
  font-size: 23rpx;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.18);
}

.stage-tag.active {
  color: $primary-color;
  background: #ffffff;
}

.stage-arrow {
  color: rgba(255, 255, 255, 0.72);
  font-size: 25rpx;
}

.card {
  margin-top: 24rpx;
  padding: 28rpx;
}

.card-head {
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
  color: $info-color;
  font-size: 23rpx;
  line-height: 1.4;
}

.mode-grid,
.info-grid,
.result-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.mode-btn,
.info-item,
.result-panel,
.model-panel,
.snapshot-detail {
  min-width: 0;
  padding: 20rpx;
  border: 1rpx solid $border-color;
  border-radius: 20rpx;
  background: #f8fbff;
}

.mode-btn {
  min-height: 128rpx;
  text-align: left;
}

.mode-btn.active {
  border-color: rgba(22, 119, 255, 0.5);
  background: linear-gradient(135deg, #eef7ff 0%, #ffffff 100%);
}

.mode-btn[disabled],
.action-btn[disabled] {
  opacity: 0.55;
}

.mode-title,
.model-name,
.panel-title {
  color: $text-main;
  font-weight: 800;
}

.mode-title,
.panel-title {
  font-size: 27rpx;
}

.mode-desc,
.model-desc,
.info-label,
.label,
.quality-label,
.box-meta,
.record-line {
  color: $info-color;
  font-size: 23rpx;
  line-height: 1.4;
}

.mode-desc,
.model-desc,
.info-value,
.value {
  margin-top: 8rpx;
}

.info-value,
.value,
.quality-value {
  color: $text-main;
  font-size: 25rpx;
  line-height: 1.45;
}

.info-value.strong {
  color: $primary-color;
  font-size: 31rpx;
  font-weight: 900;
}

.model-panel,
.json-box {
  margin-top: 18rpx;
}

.model-head {
  margin-bottom: 18rpx;
}

.model-name {
  font-size: 29rpx;
  line-height: 1.3;
}

.model-desc {
  color: $primary-color;
  font-weight: 600;
}

.path-text {
  margin-top: 8rpx;
  color: $info-color;
  font-size: 22rpx;
  line-height: 1.45;
  word-break: break-all;
}

.json-box {
  padding: 20rpx;
  border-radius: 18rpx;
  background: #111827;
}

.json-text {
  color: #d1fae5;
  font-family: monospace;
  font-size: 21rpx;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-all;
}

.raw-json {
  max-height: 560rpx;
  overflow: auto;
}

.button-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
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
  background: $primary-bg;
}

.action-btn.primary {
  color: #ffffff;
  background: $confirm-btn-bg;
}

.action-btn.danger {
  color: $error-color;
  background: #fff1f0;
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

.quality-fields,
.box-list,
.record-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.quality-value {
  margin-top: 0;
  font-weight: 700;
  text-align: right;
}

.row {
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

.box-list,
.record-list {
  margin-top: 18rpx;
}

.box-item,
.record-item {
  padding: 18rpx;
  border: 1rpx solid $border-color;
  border-radius: 18rpx;
  background: #ffffff;
}

.box-head {
  align-items: center;
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

.snapshot-image {
  width: 100%;
  margin-bottom: 18rpx;
  border-radius: 20rpx;
  background: #edf1f8;
}

.record-item {
  display: flex;
  gap: 18rpx;
  background: #f8fbff;
}

.record-image {
  flex-shrink: 0;
  width: 128rpx;
  height: 128rpx;
  border-radius: 18rpx;
  background: #edf1f8;
}

.record-time {
  color: $text-main;
  font-size: 25rpx;
  font-weight: 800;
  line-height: 1.35;
}

.record-line {
  margin-top: 8rpx;
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
  .card-head,
  .model-head {
    flex-direction: column;
  }

  .status-pill {
    max-width: none;
  }

  .mode-grid,
  .info-grid,
  .result-grid,
  .button-row {
    grid-template-columns: 1fr;
  }
}
</style>