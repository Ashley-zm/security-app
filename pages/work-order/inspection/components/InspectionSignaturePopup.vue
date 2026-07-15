<template>
  <view v-if="visible" class="signature-mask">
    <view class="signature-panel">
      <view
        class="signature-navbar"
        :style="{ paddingTop: `${statusBarHeight}px` }"
      >
        <button
          class="navbar-action cancel-action"
          :disabled="confirmLoading"
          @click="$emit('cancel')"
        >
          取消
        </button>
        <view class="navbar-title-wrap">
          <text class="navbar-title">用户签名</text>
          <text class="navbar-subtitle">请用户本人确认本次安检结果</text>
        </view>
        <button
          class="navbar-action clear-action"
          :disabled="confirmLoading || !hasSignature"
          @click="clearCanvas"
        >
          清空
        </button>
      </view>

      <scroll-view class="signature-content" :scroll-y="!drawing">
        <view class="signature-layout">
          <view class="canvas-card">
            <view class="canvas-wrap">
              <canvas
                :id="CANVAS_ID"
                :canvas-id="CANVAS_ID"
                class="signature-canvas"
                :style="canvasStyle"
                :width="canvasWidth"
                :height="canvasHeight"
                disable-scroll
                @touchstart="handleTouchStart"
                @touchmove="handleTouchMove"
                @touchend="handleTouchEnd"
                @touchcancel="handleTouchEnd"
              />
              <view v-if="!hasSignature" class="canvas-placeholder">
                <text class="placeholder-main">请在此处签名</text>
                <text class="placeholder-sub">
                  签名区域支持连续书写较长姓名
                </text>
              </view>
              <view class="signature-baseline" />
            </view>
          </view>
        </view>
      </scroll-view>

      <view class="signature-footer">
        <view class="footer-copy">
          <text class="footer-title">请确认签名内容清晰完整</text>
          <text class="footer-tip">
            确认后将上传签名，并返回安检结果页继续提交
          </text>
        </view>
        <button
          class="confirm-signature-btn"
          :loading="confirmLoading"
          :disabled="confirmLoading || !hasSignature"
          @click="confirmSignature"
        >
          {{ confirmLoading ? "签名上传中..." : "确认签名" }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  ref,
  watch,
} from "vue";

const CANVAS_ID = "inspection-signature-canvas";
const props = defineProps<{
  visible: boolean;
  userName?: string;
  address?: string;
  confirmLoading?: boolean;
}>();
const emit = defineEmits<{
  cancel: [];
  confirm: [localPath: string];
}>();

interface SignatureTouch {
  x?: number;
  y?: number;
  clientX?: number;
  clientY?: number;
  pageX?: number;
  pageY?: number;
}

const instance = getCurrentInstance();
const systemInfo = uni.getSystemInfoSync();
const initialCanvasWidth = Math.max(280, systemInfo.windowWidth - 32);
const statusBarHeight = ref(systemInfo.statusBarHeight || 0);
const canvasWidth = ref(initialCanvasWidth);
const canvasHeight = ref(
  Math.max(240, Math.min(360, Math.round(initialCanvasWidth * 0.68))),
);
const canvasStyle = computed(
  () => `width:${canvasWidth.value}px;height:${canvasHeight.value}px;`,
);
const hasSignature = ref(false);
const drawing = ref(false);
const exporting = ref(false);
let context: ReturnType<typeof uni.createCanvasContext> | null = null;
let lastPoint = { x: 0, y: 0 };
let canvasLeft = 0;
let canvasTop = 0;
let initializeTimer: ReturnType<typeof setTimeout> | undefined;

watch(
  () => props.visible,
  (visible) => {
    if (initializeTimer) clearTimeout(initializeTimer);
    if (!visible) {
      restorePortraitOrientation();
      return;
    }

    hasSignature.value = false;
    drawing.value = false;
    let initializeDelay = 50;
    // #ifdef APP-PLUS
    plus.screen.lockOrientation("landscape-primary");
    initializeDelay = 320;
    // #endif
    nextTick(() => {
      // 等待横屏切换、弹层和原生 Canvas 节点完成布局。
      initializeTimer = setTimeout(() => {
        updateCanvasSize();
        nextTick(initializeCanvas);
      }, initializeDelay);
    });
  },
);

onBeforeUnmount(() => {
  if (initializeTimer) clearTimeout(initializeTimer);
  restorePortraitOrientation();
});

function restorePortraitOrientation() {
  // #ifdef APP-PLUS
  plus.screen.lockOrientation("portrait-primary");
  // #endif
}

function updateCanvasSize() {
  const info = uni.getSystemInfoSync();
  const isLandscape = info.windowWidth > info.windowHeight;
  statusBarHeight.value = info.statusBarHeight || 0;
  if (isLandscape) {
    // 横屏时画布占满内容区，仅扣除页面、卡片内边距和边框。
    canvasWidth.value = Math.max(280, info.windowWidth - 58);
    canvasHeight.value = Math.max(
      140,
      Math.min(280, info.windowHeight - statusBarHeight.value - 156),
    );
    return;
  }

  canvasWidth.value = Math.max(280, info.windowWidth - 32);
  canvasHeight.value = Math.max(
    240,
    Math.min(360, Math.round(canvasWidth.value * 0.68)),
  );
}

function initializeCanvas() {
  context = uni.createCanvasContext(CANVAS_ID, instance?.proxy);
  uni
    .createSelectorQuery()
    .in(instance?.proxy)
    .select(`#${CANVAS_ID}`)
    .boundingClientRect()
    .exec((result) => {
      const rect = result[0];
      if (rect && !Array.isArray(rect)) {
        canvasLeft = Number(rect.left || 0);
        canvasTop = Number(rect.top || 0);
      }
      clearCanvas();
    });
}

function getTouchPoint(event: TouchEvent) {
  const touch = (event.touches?.[0] ||
    event.changedTouches?.[0]) as unknown as SignatureTouch;
  if (!touch) return null;

  const absoluteX = touch.clientX ?? touch.pageX;
  const absoluteY = touch.clientY ?? touch.pageY;
  const x = Number(
    touch.x ?? (absoluteX === undefined ? NaN : absoluteX - canvasLeft),
  );
  const y = Number(
    touch.y ?? (absoluteY === undefined ? NaN : absoluteY - canvasTop),
  );
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

function handleTouchStart(event: TouchEvent) {
  if (props.confirmLoading) return;
  const point = getTouchPoint(event);
  if (!point) return;
  lastPoint = point;
  drawing.value = true;
}

function handleTouchMove(event: TouchEvent) {
  if (!drawing.value || props.confirmLoading || !context) return;
  const point = getTouchPoint(event);
  if (!point) return;

  context.beginPath();
  context.setStrokeStyle("#172b4d");
  context.setLineWidth(3);
  context.setLineCap("round");
  context.setLineJoin("round");
  context.moveTo(lastPoint.x, lastPoint.y);
  context.lineTo(point.x, point.y);
  context.stroke();
  context.draw(true);

  lastPoint = point;
  hasSignature.value = true;
}

function handleTouchEnd() {
  drawing.value = false;
}

function clearCanvas() {
  if (!context) return;
  context.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
  context.setFillStyle("#ffffff");
  context.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
  context.draw();
  hasSignature.value = false;
}

function confirmSignature() {
  if (!hasSignature.value || props.confirmLoading || exporting.value) return;
  exporting.value = true;
  uni.canvasToTempFilePath(
    {
      canvasId: CANVAS_ID,
      fileType: "png",
      quality: 1,
      destWidth: canvasWidth.value * 2,
      destHeight: canvasHeight.value * 2,
      success: (result) => emit("confirm", result.tempFilePath),
      fail: (error) => {
        uni.showToast({
          title: error.errMsg || "签名生成失败，请重试",
          icon: "none",
        });
      },
      complete: () => {
        exporting.value = false;
      },
    },
    instance?.proxy,
  );
}
</script>

<style scoped lang="scss">
.signature-mask {
  position: fixed;
  inset: 0;
  z-index: 500;
  background: #f2f6fc;
}

.signature-panel {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.signature-navbar {
  display: flex;
  align-items: center;
  min-height: 106rpx;
  padding: 0 22rpx;
  background: #fff;
  box-shadow: 0 4rpx 18rpx rgba(31, 66, 120, 0.06);
}

.navbar-action {
  height: 62rpx;
  border: 0;
  font-size: 25rpx;
  line-height: 62rpx;
  background: transparent;
}

.navbar-action::after,
.confirm-signature-btn::after {
  border: 0;
}

.cancel-action {
  color: #657795;
  text-align: left;
}

.clear-action {
  color: #3475df;
  text-align: right;
}

.navbar-action[disabled] {
  opacity: 0.42;
}

.navbar-title-wrap {
  flex: 1;
  min-width: 0;
  text-align: center;
}

.navbar-title,
.navbar-subtitle {
  display: block;
}

.navbar-title {
  color: #21375e;
  font-size: 31rpx;
  font-weight: 900;
}

.navbar-subtitle {
  margin-top: 2rpx;
  color: #91a0b8;
  font-size: 19rpx;
}

.signature-content {
  flex: 1;
  min-height: 0;
}

.summary-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 62rpx;
  width: 62rpx;
  height: 62rpx;
  border-radius: 18rpx;
  color: #fff;
  font-size: 26rpx;
  font-weight: 800;
  background: linear-gradient(135deg, #4386ef, #6a61df);
}

.canvas-card {
  margin: 22rpx 16rpx 40rpx;
  padding: 24rpx 16rpx 16rpx;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 8rpx 28rpx rgba(39, 76, 140, 0.07);
}

.canvas-wrap {
  position: relative;
  overflow: hidden;
  border: 2rpx dashed #b9c7da;
  border-radius: 18rpx;
  background: #fff;
}

.signature-canvas {
  position: relative;
  z-index: 2;
  display: block;
  background: transparent;
}

.canvas-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 3;
  width: 100%;
  text-align: center;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.placeholder-main,
.placeholder-sub {
  display: block;
}

.placeholder-main {
  color: #a6b2c5;
  font-size: 29rpx;
}

.placeholder-sub {
  margin-top: 10rpx;
  color: #c0c9d7;
  font-size: 21rpx;
}

.signature-baseline {
  position: absolute;
  right: 10%;
  bottom: 24%;
  left: 10%;
  z-index: 3;
  border-bottom: 2rpx solid #e8edf4;
  pointer-events: none;
}

.signature-footer {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 24rpx;
  padding: 18rpx 24rpx calc(18rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -8rpx 30rpx rgba(32, 66, 120, 0.08);
}

.footer-copy {
  flex: 1;
  min-width: 0;
}

.footer-title,
.footer-tip {
  display: block;
}

.footer-title {
  color: #2b4268;
  font-size: 23rpx;
  font-weight: 800;
}

.confirm-signature-btn {
  flex: 0 0 340rpx;
  height: 84rpx;
  border-radius: 23rpx;
  color: #fff;
  font-size: 28rpx;
  font-weight: 800;
  line-height: 84rpx;
  background: linear-gradient(100deg, #3179ee, #665be5);
}

.confirm-signature-btn[disabled] {
  opacity: 0.45;
}

.footer-tip {
  display: block;
  margin-top: 9rpx;
  color: #8d9ab0;
  font-size: 20rpx;
  text-align: center;
}

.signature-layout {
  min-height: 100%;
}

@media screen and (orientation: landscape) {
  .signature-mask {
    background:
      radial-gradient(
        circle at 85% 10%,
        rgba(99, 91, 229, 0.09),
        transparent 34%
      ),
      #eef3fa;
  }

  .signature-navbar {
    box-sizing: border-box;
    min-height: 52px;
    padding-right: calc(18px + env(safe-area-inset-right));
    padding-left: calc(18px + env(safe-area-inset-left));
    border-bottom: 1px solid #edf1f7;
    box-shadow: none;
  }

  .navbar-action {
    // flex-basis: 76px;
    height: 38px;
    border-radius: 10px;
    font-size: 14px;
    line-height: 38px;
  }

  .cancel-action {
    padding: 0 10px;
    background: #f4f6fa;
  }

  .clear-action {
    padding: 0 10px;
    background: #edf4ff;
  }

  .navbar-title {
    font-size: 18px;
  }

  .navbar-subtitle {
    margin-top: 1px;
    font-size: 11px;
  }

  .signature-content {
    box-sizing: border-box;
    padding: 10px 16px;
  }

  .signature-layout {
    display: flex;
    align-items: stretch;
    min-height: 100%;
  }

  .summary-icon {
    width: 46px;
    height: 46px;
    border-radius: 14px;
    font-size: 17px;
    box-shadow: 0 7px 16px rgba(74, 93, 218, 0.2);
  }

  .canvas-card {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    margin: 0;
    padding: 12px;
    border: 1px solid rgba(66, 102, 166, 0.08);
    border-radius: 18px;
    box-shadow: 0 9px 28px rgba(38, 73, 128, 0.08);
  }

  .canvas-wrap {
    align-self: center;
    border-color: #aebed5;
    border-radius: 13px;
    background:
      linear-gradient(
        to right,
        transparent 49.8%,
        #f5f7fb 50%,
        transparent 50.2%
      ),
      #fff;
  }

  .placeholder-main {
    font-size: 18px;
  }

  .placeholder-sub {
    margin-top: 5px;
    font-size: 11px;
  }

  .signature-footer {
    gap: 20px;
    min-height: 58px;
    box-sizing: border-box;
    padding: 7px calc(18px + env(safe-area-inset-right))
      calc(7px + env(safe-area-inset-bottom))
      calc(18px + env(safe-area-inset-left));
  }

  .footer-title {
    font-size: 13px;
  }

  .footer-tip {
    margin-top: 2px;
    font-size: 10px;
    text-align: left;
  }

  .confirm-signature-btn {
    flex-basis: 220px;
    width: 220px;
    height: 44px;
    margin: 0;
    border-radius: 13px;
    font-size: 16px;
    line-height: 44px;
    box-shadow: 0 7px 16px rgba(72, 90, 218, 0.2);
  }
}
</style>
