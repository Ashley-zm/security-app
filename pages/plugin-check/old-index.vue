<template>
  <view class="page">
    <!-- 状态区 -->
    <view class="card">
      <view class="title">AI 实时检测</view>

      <view class="row">
        <text class="label">插件状态：</text>
        <text>{{ pluginStatus }}</text>
      </view>

      <view class="row">
        <text class="label">检测状态：</text>
        <text>{{ detectStatus }}</text>
      </view>

      <view v-if="errorMessage" class="error">
        {{ errorMessage }}
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="card">
      <button
        class="btn primary"
        :disabled="isOpeningDetect || isDetecting"
        @click="startDetect"
      >
        {{ isOpeningDetect ? '正在打开检测页...' : '开始检测' }}
      </button>

      <button
        class="btn"
        :disabled="!isDetecting || isTakingSnapshot"
        @click="takeSnapshotFromUniapp"
      >
        {{ isTakingSnapshot ? '正在拍照...' : '远程拍照' }}
      </button>

      <button
        class="btn danger"
        :disabled="!isDetecting"
        @click="stopDetect"
      >
        停止检测
      </button>
    </view>

    <!-- 最近实时检测结果 -->
    <view class="card">
      <view class="sub-title">最近实时检测结果</view>

      <template v-if="lastDetectResult">
        <view class="row">
          <text class="label">是否检测到目标：</text>
          <text>{{ lastDetectResult.hasTarget ? '是' : '否' }}</text>
        </view>

        <view class="row">
          <text class="label">检测框数量：</text>
          <text>{{ lastDetectBoxes.length }}</text>
        </view>

        <view class="row">
          <text class="label">最高置信度：</text>
          <text>{{ maxScoreText(lastDetectBoxes) }}</text>
        </view>
      </template>

      <view v-else class="empty">
        暂无实时检测结果
      </view>
    </view>

    <!-- 最新拍照结果 -->
    <view class="card">
      <view class="sub-title">最新拍照结果</view>

      <template v-if="snapshotResult">
        <image
          v-if="snapshotResult.previewPath"
          class="preview-image"
          :src="snapshotResult.previewPath"
          mode="widthFix"
        />

        <view class="row column">
          <text class="label">图片路径：</text>
          <text class="path">{{ snapshotResult.imagePath }}</text>
        </view>

        <view class="row">
          <text class="label">拍照时间：</text>
          <text>{{ snapshotResult.timeText }}</text>
        </view>

        <view class="row">
          <text class="label">是否检测到目标：</text>
          <text>{{ snapshotResult.hasTarget ? '是' : '否' }}</text>
        </view>

        <view class="row">
          <text class="label">boxesSource：</text>
          <text>{{ snapshotResult.boxesSource || '-' }}</text>
        </view>

        <view class="row">
          <text class="label">检测框数量：</text>
          <text>{{ snapshotResult.boxCount }}</text>
        </view>

        <view v-if="snapshotResult.boxes.length" class="box-list">
          <view
            v-for="(box, index) in snapshotResult.boxes"
            :key="index"
            class="box-item"
          >
            <view>目标 {{ index + 1 }}</view>
            <view>label：{{ box.label }}</view>
            <view>score：{{ formatScore(box.score) }}</view>
            <view>classId：{{ box.classId }}</view>
            <view>
              坐标：
              left={{ formatNumber(box.left) }},
              top={{ formatNumber(box.top) }},
              right={{ formatNumber(box.right) }},
              bottom={{ formatNumber(box.bottom) }}
            </view>
          </view>
        </view>

        <view v-else class="empty">
          本次拍照图片未检测到目标
        </view>
      </template>

      <view v-else class="empty">
        暂无拍照结果
      </view>
    </view>

    <!-- 当前页面拍照记录 -->
    <view class="card">
      <view class="sub-title">本次页面拍照记录</view>

      <view
        v-for="(item, index) in snapshotList"
        :key="index"
        class="record-item"
      >
        <image
          v-if="item.previewPath"
          class="record-image"
          :src="item.previewPath"
          mode="aspectFill"
        />

        <view class="record-info">
          <view>时间：{{ item.timeText }}</view>
          <view>是否检测到目标：{{ item.hasTarget ? '是' : '否' }}</view>
          <view>检测框数量：{{ item.boxCount }}</view>
          <view>来源：{{ item.boxesSource || '-' }}</view>
        </view>
      </view>

      <view v-if="snapshotList.length === 0" class="empty">
        暂无记录
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'

/**
 * 插件对象
 * 注意：只能在 APP-PLUS 环境使用
 */
let aiDetect = null

// #ifdef APP-PLUS
try {
  aiDetect = uni.requireNativePlugin('AiDetectPlugin')
} catch (e) {
  console.error('获取 AiDetectPlugin 失败', e)
}
// #endif

const pluginStatus = ref(aiDetect ? '已加载' : '未加载或当前环境不支持')
const detectStatus = ref('未开始')
const errorMessage = ref('')

const isDetecting = ref(false)
const isOpeningDetect = ref(false)
const isTakingSnapshot = ref(false)

const lastDetectResult = ref(null)
const snapshotResult = ref(null)
const snapshotList = ref([])

const lastDetectBoxes = computed(() => {
  const boxes = lastDetectResult.value?.boxes
  return Array.isArray(boxes) ? boxes : []
})

/**
 * 开始检测
 * 调用后会打开 Android 原生 DetectActivity
 */
function startDetect() {
  if (!checkPlugin()) return

  if (isOpeningDetect.value || isDetecting.value) {
    return
  }

  errorMessage.value = ''
  isOpeningDetect.value = true
  detectStatus.value = '正在打开检测页'

  aiDetect.startDetect(
    {
      modelType: 'detection',
      engine: 'ncnn',
      modelName: 'yolov8n',
      threshold: 0.5,
      iouThreshold: 0.45,
      detectInterval: 300,
      callbackInterval: 500,
      inputSize: 640,
      useGpu: false
    },
    res => {
      console.log('AiDetectPlugin 回调：', res)

      isOpeningDetect.value = false

      if (!res) {
        handleUnknownError('原生插件无返回数据')
        return
      }

      // 失败回调
      if (res.success === false) {
        if (res.type === 'snapshot_error') {
          handleSnapshotError(res)
        } else {
          handleDetectError(res)
        }
        return
      }

      // 打开原生检测页成功
      if (res.type === 'activity_opened') {
        isDetecting.value = true
        detectStatus.value = '检测中'
        return
      }

      // 实时检测结果
      if (res.type === 'detect_result') {
        isDetecting.value = true
        detectStatus.value = '检测中'
        lastDetectResult.value = res
        return
      }

      // 原生页面底部点击拍照后，返回 snapshot
      if (res.type === 'snapshot') {
        handleSnapshotSuccess(res)
        return
      }

      // 兼容未知成功回调
      console.log('未处理的成功回调：', res)
    }
  )
}

/**
 * 可选：uni-app 页面远程触发原生页拍照
 * 主要拍照入口仍然建议放在 Android 原生 DetectActivity 底部
 */
function takeSnapshotFromUniapp() {
  if (!checkPlugin()) return

  if (!isDetecting.value) {
    uni.showToast({
      title: '请先开始检测',
      icon: 'none'
    })
    return
  }

  if (isTakingSnapshot.value) return

  isTakingSnapshot.value = true
  errorMessage.value = ''

  aiDetect.takeSnapshot({}, res => {
    console.log('远程拍照返回：', res)

    isTakingSnapshot.value = false

    if (!res) {
      handleUnknownError('拍照无返回数据')
      return
    }

    if (res.success === false || res.type === 'snapshot_error') {
      handleSnapshotError(res)
      return
    }

    if (res.type === 'snapshot') {
      handleSnapshotSuccess(res)
      return
    }

    console.log('未处理的拍照回调：', res)
  })
}

/**
 * 停止检测
 */
function stopDetect() {
  if (!checkPlugin()) return

  aiDetect.stopDetect({}, res => {
    console.log('停止检测返回：', res)

    isDetecting.value = false
    isOpeningDetect.value = false
    isTakingSnapshot.value = false
    detectStatus.value = '已停止'

    if (res && res.success === false) {
      errorMessage.value = res.message || '停止检测失败'
      uni.showToast({
        title: errorMessage.value,
        icon: 'none'
      })
    }
  })
}

/**
 * 处理拍照成功
 */
function handleSnapshotSuccess(res) {
  const boxes = Array.isArray(res.boxes) ? res.boxes : []

  const record = {
    imagePath: res.imagePath || '',
    previewPath: normalizeFilePath(res.imagePath || ''),
    timestamp: res.timestamp || Date.now(),
    timeText: formatTime(res.timestamp || Date.now()),
    hasTarget: !!res.hasTarget,
    boxesSource: res.boxesSource || '',
    shouldCloseCamera: !!res.shouldCloseCamera,
    boxes,
    boxCount: boxes.length,
    raw: res
  }

  snapshotResult.value = record
  snapshotList.value.unshift(record)

  // 原生插件拍照成功后会自动关闭摄像头并退出 DetectActivity
  isDetecting.value = false
  isOpeningDetect.value = false
  isTakingSnapshot.value = false
  detectStatus.value = '已拍照完成'
  errorMessage.value = ''

  saveSnapshotRecord(record)

  uni.showToast({
    title: '拍照完成',
    icon: 'success'
  })
}

/**
 * 处理拍照失败
 */
function handleSnapshotError(res) {
  const code = res?.code || ''
  const message = res?.message || '拍照失败'

  errorMessage.value = message
  isTakingSnapshot.value = false

  if (res?.shouldCloseCamera === true) {
    isDetecting.value = false
    detectStatus.value = '拍照失败，检测已结束'
  } else if (code === 'SNAPSHOT_ACTIVITY_NOT_RUNNING') {
    isDetecting.value = false
    detectStatus.value = '检测页面未运行'
  } else {
    detectStatus.value = '拍照异常'
  }

  uni.showToast({
    title: message,
    icon: 'none'
  })

  console.error('拍照失败：', res)
}

/**
 * 处理检测异常
 */
function handleDetectError(res) {
  const message = res?.message || '检测异常'

  errorMessage.value = message
  isOpeningDetect.value = false

  if (res?.shouldCloseCamera === true) {
    isDetecting.value = false
  }

  detectStatus.value = '检测异常'

  uni.showToast({
    title: message,
    icon: 'none'
  })

  console.error('检测异常：', res)
}

/**
 * 兜底异常
 */
function handleUnknownError(message) {
  errorMessage.value = message
  isOpeningDetect.value = false
  isTakingSnapshot.value = false

  uni.showToast({
    title: message,
    icon: 'none'
  })
}

/**
 * 检查插件是否可用
 */
function checkPlugin() {
  // #ifndef APP-PLUS
  uni.showToast({
    title: '当前环境不支持原生检测',
    icon: 'none'
  })
  return false
  // #endif

  // #ifdef APP-PLUS
  if (!aiDetect) {
    uni.showToast({
      title: 'AiDetectPlugin 未加载',
      icon: 'none'
    })
    return false
  }
  return true
  // #endif
}

/**
 * Android 本地路径转 uni-app image 可显示路径
 */
function normalizeFilePath(path) {
  if (!path) return ''
  if (path.startsWith('file://')) return path
  return `file://${path}`
}

/**
 * 时间格式化
 */
function formatTime(timestamp) {
  if (!timestamp) return '-'

  const date = new Date(timestamp)

  const pad = num => String(num).padStart(2, '0')

  const y = date.getFullYear()
  const m = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const h = pad(date.getHours())
  const min = pad(date.getMinutes())
  const s = pad(date.getSeconds())

  return `${y}-${m}-${d} ${h}:${min}:${s}`
}

function formatScore(score) {
  if (score === undefined || score === null || Number.isNaN(Number(score))) {
    return '-'
  }
  return Number(score).toFixed(3)
}

function formatNumber(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return '-'
  }
  return Number(value).toFixed(1)
}

function maxScoreText(boxes) {
  if (!Array.isArray(boxes) || boxes.length === 0) {
    return '-'
  }

  const max = boxes.reduce((prev, cur) => {
    const score = Number(cur.score || 0)
    return score > prev ? score : prev
  }, 0)

  return formatScore(max)
}

/**
 * 后续可在这里上传后端 / 保存工单记录
 */
function saveSnapshotRecord(record) {
  console.log('保存拍照记录，可在此处调用后端接口：', {
    imagePath: record.imagePath,
    captureTime: record.timestamp,
    aiResult: {
      hasTarget: record.hasTarget,
      boxesSource: record.boxesSource,
      boxes: record.boxes
    }
  })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24rpx;
  background: #f5f6f8;
  box-sizing: border-box;
}

.card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.title {
  font-size: 36rpx;
  font-weight: 700;
  margin-bottom: 20rpx;
  color: #222;
}

.sub-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
  color: #333;
}

.row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 14rpx;
  font-size: 26rpx;
  color: #333;
}

.column {
  flex-direction: column;
}

.label {
  color: #666;
  margin-right: 8rpx;
  flex-shrink: 0;
}

.path {
  word-break: break-all;
  color: #333;
  line-height: 1.5;
}

.error {
  margin-top: 16rpx;
  color: #d93025;
  font-size: 26rpx;
  line-height: 1.5;
}

.empty {
  color: #999;
  font-size: 26rpx;
  padding: 16rpx 0;
}

.btn {
  margin-bottom: 18rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.primary {
  background: #1677ff;
  color: #fff;
}

.danger {
  background: #ff4d4f;
  color: #fff;
}

.preview-image {
  width: 100%;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  background: #eee;
}

.box-list {
  margin-top: 16rpx;
}

.box-item {
  padding: 18rpx;
  border-radius: 12rpx;
  background: #f7f8fa;
  margin-bottom: 14rpx;
  font-size: 24rpx;
  color: #333;
  line-height: 1.6;
}

.record-item {
  display: flex;
  padding: 16rpx 0;
  border-bottom: 1px solid #eee;
}

.record-item:last-child {
  border-bottom: none;
}

.record-image {
  width: 140rpx;
  height: 140rpx;
  border-radius: 12rpx;
  background: #eee;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.record-info {
  flex: 1;
  font-size: 24rpx;
  color: #333;
  line-height: 1.6;
}
</style>