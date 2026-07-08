<template>
  <view class="mine-page page safe-page">
    <AppNavbar title="我的" />
    <view class="profile-section"
      :style="{ paddingTop: statusBarHeight + 28 + 'px', paddingBottom: '80rpx', paddingLeft: '30rpx', paddingRight: '30rpx' }">
      <view class="avatar-wrap">
        <view class="avatar">
          <view class="avatar-hair" />
          <view class="avatar-face">
            <view class="avatar-eye left" />
            <view class="avatar-eye right" />
            <view class="avatar-nose" />
            <view class="avatar-mouth" />
          </view>
          <view class="avatar-neck" />
          <view class="avatar-shirt" />
        </view>
      </view>
      <view class="profile-main">
        <view class="name-row">
          <text class="name">{{ profile.name }}</text>
          <view class="verify-badge">
            <text class="verify-dot">✓</text>
            <text>安检员</text>
          </view>
        </view>
        <!-- <view class="profile-line">工号：{{ profile.employeeNo }}</view> -->
        <view class="profile-line">{{ profile.mobile }}</view>
      </view>
    </view>

    <view class="qr-card" @click="openQrPreview">
      <view class="qr-info">
        <text class="qr-title">我的二维码</text>
        <text class="qr-desc">扫一扫，向他人展示我的身份信息</text>
      </view>
      <view class="qr-code" aria-label="身份二维码">
        <image class="qr-code-img" :src="qrCodeSrc" mode="aspectFit" />
      </view>
    </view>

    <view v-if="qrPreviewVisible" class="popup-mask qr-preview-mask" @click="closeQrPreview">
      <view class="qr-preview-popup" @click.stop>
        <button class="qr-preview-close" @click="closeQrPreview">X</button>
        <image class="qr-preview-img" :src="qrCodeSrc" mode="aspectFit" />
      </view>
    </view>

    <view class="section">
      <view class="menu-card">
        <button class="menu-item" @click="openChangePassword">
          <view class="menu-left">
            <image class="menu-icon " src="/static/images/mine/lock.png" />
            <text>修改密码</text>
          </view>
          <image class="arrow" src="/static/images/mine/arrow.png" />
        </button>
        <button class="menu-item" @click="showComingSoon('消息通知设置')">
          <view class="menu-left">
            <image class="menu-icon" src="/static/images/mine/bell.png" />
            <text>消息通知设置</text>
          </view>
          <image class="arrow" src="/static/images/mine/arrow.png" />
        </button>
        <button class="menu-item" @click="handleClearCache">
          <view class="menu-left">
            <image class="menu-icon" src="/static/images/mine/trash.png" />
            <text>清除缓存</text>
          </view>
          <view class="menu-right">
            <text class="right-text">{{ cacheSize }}</text>
            <image class="arrow" src="/static/images/mine/arrow.png" />
          </view>
        </button>
        <button class="menu-item" @click="openAbout">
          <view class="menu-left">
            <image class="menu-icon" src="/static/images/mine/about.png" />
            <text>关于我们</text>
          </view>
          <view class="menu-right">
            <text class="right-text">版本 {{ appInfo.version }}</text>
            <image class="arrow" src="/static/images/mine/arrow.png" />
          </view>
        </button>
      </view>
    </view>

    <button class="logout-card" @click="handleLogout">
      <text>退出当前登录</text>
    </button>

    <view v-if="passwordPopupVisible" class="popup-mask" @click="closeChangePassword">
      <view class="password-popup" @click.stop>
        <view class="popup-title">修改密码</view>
        <view class="form-card">
          <view class="form-row">
            <text class="form-label">原密码</text>
            <input v-model="passwordForm.oldPassword" class="form-input" password placeholder="请输入原密码"
              placeholder-class="placeholder" />
          </view>
          <view class="form-row">
            <text class="form-label">新密码</text>
            <input v-model="passwordForm.newPassword" class="form-input" password placeholder="6-20 位新密码"
              placeholder-class="placeholder" />
          </view>
          <view class="form-row">
            <text class="form-label">确认密码</text>
            <input v-model="passwordForm.confirmPassword" class="form-input" password placeholder="请再次输入新密码"
              placeholder-class="placeholder" />
          </view>
        </view>
        <view class="password-tips">密码修改成功后，需要重新登录。</view>
        <view class="popup-actions">
          <button class="popup-btn cancel" :disabled="passwordUpdating" @click="closeChangePassword">取消</button>
          <button class="popup-btn confirm" :disabled="passwordUpdating" @click="submitChangePassword">
            {{ passwordUpdating ? '提交中...' : '确认修改' }}
          </button>
        </view>
      </view>
    </view>

    <view v-if="aboutPopupVisible" class="popup-mask" @click="closeAbout">
      <view class="about-popup" @click.stop>
        <view class="about-hero">
          <view class="app-logo">
            <text>安</text>
          </view>
          <view class="about-name">{{ appInfo.name }}</view>
          <view class="about-version">版本 {{ appInfo.version }}</view>
        </view>

        <view class="about-desc">
          {{ appInfo.description }}
        </view>

        <view class="about-grid">
          <view class="about-stat">
            <text class="about-stat-num">24h</text>
            <text class="about-stat-label">值守支持</text>
          </view>
          <view class="about-stat">
            <text class="about-stat-num">100%</text>
            <text class="about-stat-label">流程留痕</text>
          </view>
          <view class="about-stat">
            <text class="about-stat-num">AI</text>
            <text class="about-stat-label">智能辅助</text>
          </view>
        </view>

        <view class="about-list">
          <button class="about-row" @click="handleServiceCall">
            <view>
              <view class="about-row-title">客服热线</view>
              <view class="about-row-desc">{{ appInfo.servicePhone }}</view>
            </view>
            <text class="arrow">›</text>
          </button>
          <button class="about-row" @click="showAgreement('用户协议')">
            <view>
              <view class="about-row-title">用户协议</view>
              <view class="about-row-desc">查看应用使用条款</view>
            </view>
            <text class="arrow">›</text>
          </button>
          <button class="about-row" @click="showAgreement('隐私政策')">
            <view>
              <view class="about-row-title">隐私政策</view>
              <view class="about-row-desc">了解信息收集与保护说明</view>
            </view>
            <text class="arrow">›</text>
          </button>
        </view>

        <view class="copyright">© 2026 Agent智能安检平台</view>
        <button class="about-close" @click="closeAbout">我知道了</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { changePasswordApi } from '@/api/auth'
import { useUserStore } from '@/stores/user'
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 0

const userStore = useUserStore()
const cacheSize = ref('32.6MB')
const qrCodeSrc = '/static/images/mine/qr.png'
const qrPreviewVisible = ref(false)
const passwordPopupVisible = ref(false)
const aboutPopupVisible = ref(false)
const passwordUpdating = ref(false)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const openQrPreview = () => {
  qrPreviewVisible.value = true
}

const closeQrPreview = () => {
  qrPreviewVisible.value = false
}

const appInfo = {
  name: '安检APP',
  version: '1.0.0',
  servicePhone: '400-800-2026',
  description: '面向燃气安检现场作业，提供工单处理、消息提醒、智能问答与身份核验能力，帮助安检人员规范、高效地完成日常任务。'
}
// 缓存大小
const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}
const getAppCacheSize = () => {
  return new Promise((resolve) => {
    // @ts-ignore
    plus?.cache?.calculate((size: number) => {
      resolve({
        bytes: Number(size),
        text: formatSize(Number(size))
      })
    })
  })
}
//获取缓存大小
getAppCacheSize().then((res: any) => {
  cacheSize.value = res.text
})


const handleClearCache = () => {
  uni.showModal({
    title: '清除缓存',
    content: '确定清除本地缓存吗？',
    success: (res) => {
      if (!res.confirm) return
      // 清除缓存
      // #ifdef APP-PLUS
      // @ts-ignore
      plus?.cache?.clear(() => {
        cacheSize.value = '0B'
        uni.showToast({
          title: '已清除',
          icon: 'success'
        })
      })
      // #endif
    }
  })
}

// 用户信息
console.log('userStore.userInfo', userStore.userInfo);
const profile = computed(() => ({
  name: userStore.userInfo?.nickName || '安检员',
  mobile: userStore.userInfo?.userName || '--'
}))
// 消息通知设置
const showComingSoon = (name: string) => {
  uni.showToast({
    title: `${name}暂未开放`,
    icon: 'none'
  })
}
// 关于我们
const getAppBaseInfo = () => {
  const appBaseInfo = uni.getAppBaseInfo()
  appInfo.version = appBaseInfo.appVersion || '1.0.0'
  appInfo.name = appBaseInfo.appName || '安检APP'
}
getAppBaseInfo()

const openAbout = () => {
  aboutPopupVisible.value = true
}

const closeAbout = () => {
  aboutPopupVisible.value = false
}
// 客服热线
const handleServiceCall = () => {
  uni.makePhoneCall({
    phoneNumber: appInfo.servicePhone,
    fail: () => {
      uni.showToast({
        title: '当前环境不支持拨号',
        icon: 'none'
      })
    }
  })
}
// 用户协议
const showAgreement = (name: string) => {
  uni.showModal({
    title: name,
    content: `${name}内容正在完善中，请以公司发布的正式文件为准。`,
    showCancel: false,
    confirmText: '知道了'
  })
}
// 修改密码
const resetPasswordForm = () => {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}
// 打开修改密码弹窗
const openChangePassword = () => {
  resetPasswordForm()
  passwordPopupVisible.value = true
}
// 关闭修改密码弹窗
const closeChangePassword = () => {
  if (passwordUpdating.value) return
  passwordPopupVisible.value = false
}
// 验证修改密码表单
const validatePasswordForm = () => {
  if (!passwordForm.oldPassword.trim()) {
    return '请输入原密码'
  }
  if (!passwordForm.newPassword.trim()) {
    return '请输入新密码'
  }
  if (passwordForm.newPassword.length < 6 || passwordForm.newPassword.length > 20) {
    return '新密码长度需为 6-20 位'
  }
  if (passwordForm.oldPassword === passwordForm.newPassword) {
    return '新密码不能与原密码相同'
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    return '两次输入的新密码不一致'
  }
  return ''
}
// 提交修改密码
const submitChangePassword = async () => {
  const message = validatePasswordForm()
  if (message) {
    uni.showToast({
      title: message,
      icon: 'none'
    })
    return
  }

  passwordUpdating.value = true
  try {
    await changePasswordApi({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    passwordPopupVisible.value = false
    uni.showToast({
      title: '密码修改成功',
      icon: 'success'
    })
    setTimeout(() => {
      userStore.logout()
    }, 800)
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '密码修改失败',
      icon: 'none'
    })
  } finally {
    passwordUpdating.value = false
  }
}
// 退出登录
const handleLogout = () => {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出当前账号吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
      }
    }
  })
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.mine-page {
  min-height: 100vh;
  // padding: 0 28rpx 32rpx;
  background: $bg-page;
}

.profile-section {
  display: flex;
  align-items: center;
  gap: 28rpx;
  // 渐变色
  background: linear-gradient(135deg, #146fee 0%, #3190dfb8 100%);
  // background: linear-gradient(135deg, #146fee 0%, #3190df 100%);
}

.avatar-wrap {
  @include flex-center;
  width: 132rpx;
  height: 132rpx;
  border-radius: 66rpx;
  background: #ffffff;
  box-shadow: $shadow-card;
}

.avatar {
  position: relative;
  overflow: hidden;
  width: 118rpx;
  height: 118rpx;
  border-radius: 59rpx;
  background: linear-gradient(180deg, #fff8f2 0%, #eff7ff 45%, #0e74c9 46%, #0860ad 100%);
}

.avatar-hair {
  position: absolute;
  top: 20rpx;
  left: 34rpx;
  z-index: 2;
  width: 51rpx;
  height: 29rpx;
  border-radius: 24rpx 24rpx 8rpx 8rpx;
  background: #16253b;
}

.avatar-face {
  position: absolute;
  top: 34rpx;
  left: 36rpx;
  z-index: 1;
  width: 48rpx;
  height: 48rpx;
  border-radius: 18rpx 18rpx 20rpx 20rpx;
  background: #ffd8c4;
}

.avatar-eye {
  position: absolute;
  top: 17rpx;
  width: 5rpx;
  height: 5rpx;
  border-radius: 3rpx;
  background: #1e2a3a;
}

.avatar-eye.left {
  left: 10rpx;
}

.avatar-eye.right {
  right: 10rpx;
}

.avatar-nose {
  position: absolute;
  top: 23rpx;
  left: 23rpx;
  width: 4rpx;
  height: 8rpx;
  border-radius: 2rpx;
  background: #efb396;
}

.avatar-mouth {
  position: absolute;
  bottom: 10rpx;
  left: 18rpx;
  width: 13rpx;
  height: 3rpx;
  border-radius: 4rpx;
  background: #d06f66;
}

.avatar-neck {
  position: absolute;
  top: 78rpx;
  left: 51rpx;
  width: 18rpx;
  height: 16rpx;
  background: #f5bea8;
}

.avatar-shirt {
  position: absolute;
  bottom: -24rpx;
  left: 23rpx;
  width: 72rpx;
  height: 50rpx;
  border-radius: 32rpx 32rpx 8rpx 8rpx;
  background: #0860ad;
}

.profile-main {
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.name {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 800;
  line-height: 46rpx;
}

.verify-badge {
  display: flex;
  align-items: center;
  gap: 6rpx;
  height: 34rpx;
  padding: 0 12rpx;
  border-radius: 10rpx;
  color: #2c83ff;
  font-size: 22rpx;
  font-weight: 600;
  background: #e9f3ff;
}

.verify-dot {
  @include flex-center;
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  color: #ffffff;
  font-size: 15rpx;
  background: #2c83ff;
}

.profile-line {
  margin-top: 8rpx;
  color: #ffffff;
  font-size: 26rpx;
  line-height: 36rpx;
}

.qr-card,
.menu-card,
.logout-card {
  border-radius: $card-radius;
  box-shadow: $shadow-card;
  background: #ffffff;
}

.qr-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 160rpx;
  padding: 24rpx 26rpx 24rpx 28rpx;
  margin: -50rpx 30rpx 50rpx;
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 24px rgba(4, 46, 138, 0.04), 0 2px 8px rgba(0, 0, 0, 0.015);
}

.qr-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  min-width: 0;
}

.qr-title {
  color: #2955a5;
  font-size: 30rpx;
  font-weight: 800;
}

.qr-desc {
  color: $text-secondary;
  font-size: 25rpx;
}

.qr-code {
  position: relative;
  width: 92rpx;
  height: 92rpx;
  padding: 7rpx;
}

.qr-code-img {
  width: 100%;
  height: 100%;
}

.qr-preview-mask {
  align-items: center;
  justify-content: center;
  padding: 48rpx;
}

.qr-preview-popup {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 620rpx;
  max-width: 100%;
  aspect-ratio: 1;
  padding: 48rpx;
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 24rpx 60rpx rgba(11, 31, 68, 0.22);
}

.qr-preview-img {
  width: 100%;
  height: 100%;
}

.qr-preview-close {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  padding: 0;
  border-radius: 50%;
  color: #6a7893;
  font-size: 40rpx;
  line-height: 1;
  background: #f2f6fc;
}

.qr-preview-close::after {
  border: 0;
}



.section {
  margin-top: 34rpx;
  margin: 34rpx 30rpx 32rpx;
}

.section-title {
  margin: 0 0 18rpx 4rpx;
  color: $text-main;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 42rpx;
}

.menu-card {
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 110rpx;
  padding: 0 36rpx;
  color: $text-main;
  font-size: 28rpx;
  background: #ffffff;
  border-bottom: 2rpx solid $border-color;
  border-radius: 0;
}

.menu-item:last-child {
  border-bottom: 0;
}

.menu-item:active,
.logout-card:active {
  background: #f8fbff;
}

.menu-left,
.menu-right {
  display: flex;
  align-items: center;
  min-width: 0;
}

.menu-left {
  gap: 20rpx;
  font-weight: 600;
}

.menu-right {
  gap: 12rpx;
}

.menu-icon {
  position: relative;
  flex: 0 0 60rpx;
  width: 60rpx;
  height: 60rpx;
}

.right-text {
  color: $text-muted;
  font-size: 28rpx;
  font-weight: 400;
}

.arrow {
  width: 25rpx;
  height: 25rpx;
}

.logout-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  min-height: 98rpx;
  margin-top: 34rpx;
  padding: 0 28rpx;
  color: #ff4d43;
  font-size: 28rpx;
  font-weight: 700;
  text-align: center;
  margin: 0 30rpx 32rpx;
}

.logout-icon {
  position: relative;
  width: 36rpx;
  height: 36rpx;
}

.logout-door {
  position: absolute;
  top: 8rpx;
  left: 4rpx;
  width: 15rpx;
  height: 21rpx;
  border: 3rpx solid #ff4d43;
  border-right: 0;
  border-radius: 3rpx 0 0 3rpx;
}

.popup-mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  background: rgba(11, 31, 68, 0.42);
}

.password-popup {
  width: 100%;
  padding: 34rpx 30rpx calc(34rpx + env(safe-area-inset-bottom));
  border-radius: 34rpx 34rpx 0 0;
  background: #ffffff;
}

.about-popup {
  width: 100%;
  max-height: 88vh;
  overflow-y: auto;
  padding: 38rpx 30rpx calc(34rpx + env(safe-area-inset-bottom));
  border-radius: 34rpx 34rpx 0 0;
  background: #ffffff;
}

.about-hero {
  display: flex;
  align-items: center;
  flex-direction: column;
}

.app-logo {
  @include flex-center;
  width: 112rpx;
  height: 112rpx;
  border-radius: 28rpx;
  color: #ffffff;
  font-size: 46rpx;
  font-weight: 900;
  background: linear-gradient(135deg, #1677ff 0%, #38a4ff 100%);
  box-shadow: 0 16rpx 30rpx rgba(22, 119, 255, 0.2);
}

.about-name {
  margin-top: 20rpx;
  color: $text-main;
  font-size: 36rpx;
  font-weight: 800;
}

.about-version {
  margin-top: 8rpx;
  color: $text-muted;
  font-size: 24rpx;
}

.about-desc {
  margin-top: 26rpx;
  padding: 24rpx;
  border-radius: 22rpx;
  color: $text-secondary;
  font-size: 26rpx;
  line-height: 1.6;
  background: #f7faff;
}

.about-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  margin-top: 22rpx;
}

.about-stat {
  @include flex-center;
  flex-direction: column;
  min-height: 118rpx;
  border-radius: 22rpx;
  background: #f7faff;
}

.about-stat-num {
  color: $primary-color;
  font-size: 32rpx;
  font-weight: 800;
}

.about-stat-label {
  margin-top: 8rpx;
  color: $text-secondary;
  font-size: 22rpx;
}

.about-list {
  overflow: hidden;
  margin-top: 24rpx;
  border-radius: 24rpx;
  background: #ffffff;
  box-shadow: $shadow-card;
}

.about-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 104rpx;
  padding: 0 24rpx;
  text-align: left;
  border-bottom: 2rpx solid $border-color;
}

.about-row:last-child {
  border-bottom: 0;
}

.about-row:active,
.about-close:active {
  background: #f8fbff;
}

.about-row-title {
  color: $text-main;
  font-size: 28rpx;
  font-weight: 700;
}

.about-row-desc {
  margin-top: 8rpx;
  color: $text-secondary;
  font-size: 24rpx;
}

.copyright {
  margin-top: 24rpx;
  color: $text-muted;
  font-size: 22rpx;
  text-align: center;
}

.about-close {
  @include flex-center;
  width: 100%;
  height: 86rpx;
  margin-top: 26rpx;
  border-radius: 43rpx;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 700;
  background: linear-gradient(135deg, #1677ff 0%, #38a4ff 100%);
}

.popup-title {
  color: $text-main;
  font-size: 34rpx;
  font-weight: 800;
  text-align: center;
}

.form-card {
  overflow: hidden;
  margin-top: 30rpx;
  border-radius: 24rpx;
  background: #f7faff;
}

.form-row {
  display: flex;
  align-items: center;
  min-height: 96rpx;
  padding: 0 24rpx;
  border-bottom: 2rpx solid #e8eefb;
}

.form-row:last-child {
  border-bottom: 0;
}

.form-label {
  flex: 0 0 150rpx;
  color: $text-main;
  font-size: 27rpx;
  font-weight: 700;
}

.form-input {
  flex: 1;
  min-width: 0;
  height: 96rpx;
  color: $text-main;
  font-size: 27rpx;
  text-align: right;
}

.placeholder {
  color: #a7b3cc;
}

.password-tips {
  margin-top: 18rpx;
  color: $text-secondary;
  font-size: 24rpx;
  line-height: 1.5;
}

.popup-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
  margin-top: 34rpx;
}

.popup-btn {
  @include flex-center;
  height: 86rpx;
  border-radius: 43rpx;
  font-size: 28rpx;
  font-weight: 700;
}

.popup-btn.cancel {
  color: $text-secondary;
  background: #eef3fb;
}

.popup-btn.confirm {
  color: #ffffff;
  background: linear-gradient(135deg, #1677ff 0%, #38a4ff 100%);
}

.popup-btn[disabled] {
  opacity: 0.72;
}
</style>
