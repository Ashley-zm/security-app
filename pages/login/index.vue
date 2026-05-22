<template>
  <view class="login-page page">
    <view class="brand">
      <view class="logo-shield">
        <view class="logo-flame" />
      </view>
      <view class="brand-title">安检APP</view>
      <view class="brand-subtitle">智能安检 · 安全无忧</view>
    </view>

    <view class="login-card">
      <view class="card-title">账号登录</view>
      <view class="field">
        <text class="field-icon">☎</text>
        <input
          v-model="form.mobile"
          class="field-input"
          maxlength="11"
          type="number"
          placeholder="请输入手机号"
          placeholder-class="placeholder"
        />
      </view>
      <view class="field">
        <text class="field-icon">●</text>
        <input
          v-model="form.password"
          class="field-input"
          :password="!showPassword"
          placeholder="请输入密码"
          placeholder-class="placeholder"
        />
        <button class="eye-btn" @click="showPassword = !showPassword">{{ showPassword ? '隐藏' : '显示' }}</button>
      </view>

      <view class="form-row">
        <button class="check-row" @click="form.remember = !form.remember">
          <text class="check-box" :class="{ checked: form.remember }">✓</text>
          <text>记住密码</text>
        </button>
        <button class="link-btn" @click="showForgot">忘记密码</button>
      </view>

      <button class="login-btn" :class="{ disabled: submitting }" :disabled="submitting" @click="handleLogin">
        {{ submitting ? '登录中...' : '登录' }}
      </button>

      <button class="agreement" @click="form.agree = !form.agree">
        <text class="check-box small" :class="{ checked: form.agree }">✓</text>
        <text class="agreement-text">我已阅读并同意用户协议与隐私政策</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useUserStore } from '@/stores/user'
import type { LoginForm } from '@/types/auth'
import { clearRememberLogin, getRememberLogin, setRememberLogin } from '@/utils/storage'
import { isMobile, required } from '@/utils/validate'

const userStore = useUserStore()
const submitting = ref(false)
const showPassword = ref(false)

const form = reactive<LoginForm>({
  mobile: '',
  password: '',
  remember: false,
  agree: false
})

onMounted(() => {
  if (userStore.token) {
    uni.switchTab({
      url: '/pages/home/index'
    })
    return
  }

  const remembered = getRememberLogin()
  if (remembered.mobile || remembered.password) {
    form.mobile = remembered.mobile
    form.password = remembered.password
    form.remember = true
  }
})

function toast(title: string) {
  uni.showToast({
    title,
    icon: 'none'
  })
}

function validateForm() {
  if (!required(form.mobile)) {
    toast('手机号不能为空')
    return false
  }
  if (!isMobile(form.mobile)) {
    toast('请输入正确的手机号')
    return false
  }
  if (!required(form.password)) {
    toast('密码不能为空')
    return false
  }
  if (!form.agree) {
    toast('请先同意用户协议与隐私政策')
    return false
  }
  return true
}

async function handleLogin() {
  if (submitting.value || !validateForm()) return

  submitting.value = true
  try {
    await userStore.login({
      mobile: form.mobile,
      password: form.password
    })

    if (form.remember) {
      setRememberLogin(form.mobile, form.password)
    } else {
      clearRememberLogin()
    }

    uni.showToast({
      title: '登录成功',
      icon: 'success'
    })
    setTimeout(() => {
      uni.switchTab({
        url: '/pages/home/index'
      })
    }, 450)
  } catch (error) {
    toast(error instanceof Error ? error.message : '登录失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

function showForgot() {
  toast('请联系管理员重置密码')
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.login-page {
  min-height: 100vh;
  padding: 112rpx 42rpx 42rpx;
  background:
    radial-gradient(circle at 20% 8%, rgba(56, 164, 255, 0.22), transparent 34%),
    linear-gradient(180deg, #eff7ff 0%, #f5f8ff 44%, #ffffff 100%);
}

.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 54rpx;
}

.logo-shield {
  position: relative;
  width: 132rpx;
  height: 148rpx;
  border-radius: 42rpx 42rpx 58rpx 58rpx;
  background: linear-gradient(150deg, #1677ff 0%, #42b6ff 100%);
  box-shadow: 0 22rpx 42rpx rgba(22, 119, 255, 0.26);
  clip-path: polygon(50% 0, 100% 18%, 91% 76%, 50% 100%, 9% 76%, 0 18%);
}

.logo-flame {
  position: absolute;
  left: 48rpx;
  top: 40rpx;
  width: 38rpx;
  height: 58rpx;
  border-radius: 60% 60% 60% 12%;
  background: #ffffff;
  transform: rotate(42deg);
}

.brand-title {
  margin-top: 26rpx;
  color: $text-main;
  font-size: 48rpx;
  font-weight: 800;
}

.brand-subtitle {
  margin-top: 12rpx;
  color: $text-secondary;
  font-size: 27rpx;
}

.login-card {
  padding: 42rpx 34rpx 36rpx;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 32rpx;
  box-shadow: 0 24rpx 60rpx rgba(22, 67, 132, 0.12);
}

.card-title {
  margin-bottom: 32rpx;
  color: $text-main;
  font-size: 36rpx;
  font-weight: 800;
}

.field {
  display: flex;
  align-items: center;
  min-height: 96rpx;
  margin-bottom: 24rpx;
  padding: 0 24rpx;
  border: 2rpx solid #e3ecfb;
  border-radius: 24rpx;
  background: #f8fbff;
}

.field-icon {
  width: 44rpx;
  color: $primary-color;
  font-size: 30rpx;
}

.field-input {
  flex: 1;
  min-width: 0;
  height: 92rpx;
  color: $text-main;
  font-size: 30rpx;
}

.placeholder {
  color: #a7b3cc;
}

.eye-btn {
  min-width: 88rpx;
  height: 64rpx;
  color: $primary-color;
  font-size: 25rpx;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8rpx 0 34rpx;
}

.check-row,
.agreement {
  display: flex;
  align-items: center;
  min-height: 52rpx;
  color: $text-secondary;
  font-size: 26rpx;
}

.check-box {
  @include flex-center;
  width: 34rpx;
  height: 34rpx;
  margin-right: 12rpx;
  border: 2rpx solid #b9c7df;
  border-radius: 8rpx;
  color: transparent;
  font-size: 22rpx;
  font-weight: 800;
}

.check-box.small {
  width: 30rpx;
  height: 30rpx;
  font-size: 20rpx;
}

.check-box.checked {
  color: #ffffff;
  border-color: $primary-color;
  background: $primary-color;
}

.link-btn {
  min-height: 52rpx;
  color: $primary-color;
  font-size: 26rpx;
}

.login-btn {
  @include flex-center;
  width: 100%;
  height: 92rpx;
  border-radius: 46rpx;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 700;
  background: linear-gradient(135deg, #1677ff 0%, #38a4ff 100%);
  box-shadow: 0 18rpx 30rpx rgba(22, 119, 255, 0.22);
}

.login-btn.disabled {
  opacity: 0.72;
}

.agreement {
  justify-content: center;
  margin-top: 30rpx;
}

.agreement-text {
  color: $text-secondary;
  font-size: 24rpx;
}
</style>
