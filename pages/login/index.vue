<template>
  <view class="login-page page">
    <view class="decor decor-left" />
    <view class="decor decor-right" />
    <view class="wave-scene">
      <view class="wave wave-back" />
      <view class="wave wave-middle" />
      <view class="wave wave-front" />
      <view class="wave-line wave-line-one" />
      <view class="wave-line wave-line-two" />
    </view>
    <view class="brand">
      <view class="logo-wrap">
        <image
          class="brand-logo"
          src="/static/logo-login.png"
          mode="aspectFit"
        />
      </view>
      <view class="brand-title">智能安检</view>
      <view class="brand-subtitle">智能安检 · 安全无忧</view>
    </view>
    <view class="login-card">
      <view v-if="tenantEnabled" class="field">
        <view class="field-icon">
          <uni-icons type="home" color="#1677ff" size="36rpx"></uni-icons>
        </view>
        <picker
          class="tenant-picker"
          mode="selector"
          :range="tenantList"
          range-key="companyName"
          :value="selectedTenantIndex < 0 ? 0 : selectedTenantIndex"
          :disabled="tenantLoading || !tenantList.length"
          @change="handleTenantChange"
        >
          <view class="tenant-picker-content">
            <view class="tenant-name" :class="{ empty: !selectedTenantName }">
              {{
                tenantLoading
                  ? "租户加载中..."
                  : selectedTenantName || "请选择租户"
              }}
            </view>
            <uni-icons type="down" color="#91a4c1" size="36rpx"></uni-icons>
          </view>
        </picker>
      </view>
      <view class="field">
        <view class="field-icon">
          <uni-icons type="person" color="#1677ff" size="36rpx"></uni-icons>
        </view>
        <input
          v-model="form.username"
          class="field-input"
          maxlength="11"
          type="text"
          placeholder="请输入用户账户"
          placeholder-class="placeholder"
        />
      </view>
      <view class="field">
        <view class="field-icon">
          <uni-icons type="locked" color="#1677ff" size="36rpx"></uni-icons>
        </view>
        <input
          v-model="form.password"
          class="field-input"
          :password="!showPassword"
          placeholder="请输入密码"
          placeholder-class="placeholder"
        />
        <button class="eye-btn" @click="showPassword = !showPassword">
          <uni-icons
            :type="showPassword ? 'eye-slash' : 'eye'"
            color="#1677ff"
            size="36rpx"
          ></uni-icons>
        </button>
      </view>

      <view class="form-row">
        <button class="check-row" @click="form.remember = !form.remember">
          <text class="check-box" :class="{ checked: form.remember }">✓</text>
          <text>记住密码</text>
        </button>
        <button class="link-btn" @click="showForgot">忘记密码</button>
      </view>

      <button
        class="login-btn"
        :class="{ disabled: submitting }"
        :disabled="submitting"
        @click="handleLogin"
      >
        {{ submitting ? "登录中..." : "登录" }}
      </button>

      <!-- <button class="agreement" @click="form.agree = !form.agree">
        <text class="check-box small" :class="{ checked: form.agree }">✓</text>
        <text class="agreement-text">我已阅读并同意用户协议与隐私政策</text>
      </button> -->
    </view>
    <view class="login-footer">专业 · 高效 · 安全</view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useUserStore } from "@/stores/user";
import { getTenantListApi } from "@/modules/auth/api";
import type { LoginForm, TenantInfo } from "@/modules/auth/types";
import {
  clearRememberLogin,
  getRememberLogin,
  setRememberLogin,
} from "@/utils/storage";
import { isMobile, required } from "@/utils/validate";

const userStore = useUserStore();
const submitting = ref(false);
const showPassword = ref(false);
const tenantEnabled = ref(true);
const tenantLoading = ref(false);
const tenantList = ref<TenantInfo[]>([]);
const selectedTenantIndex = ref(-1);

const form = reactive<LoginForm>({
  username: "",
  password: "",
  tenantId: "",
  remember: false,
  // agree: false,
});

onMounted(async () => {
  if (userStore.getToken) {
    uni.switchTab({
      url: "/pages/home/index",
    });
    return;
  }
  await loadTenantList();

  const remembered = getRememberLogin();
  if (remembered.username && remembered.password && remembered.tenantId) {
    form.username = remembered.username;
    form.password = remembered.password;
    form.tenantId = remembered.tenantId;
    console.log("1默认租户", form.tenantId);
    form.remember = true;
  }
});

const selectedTenantName = computed(() => {
  if (selectedTenantIndex.value < 0) return "";
  return tenantList.value[selectedTenantIndex.value]?.companyName || "";
});

async function loadTenantList() {
  tenantLoading.value = true;
  try {
    const result = await getTenantListApi();
    tenantEnabled.value = result.tenantEnabled;
    tenantList.value = result.voList || [];

    if (!result.tenantEnabled) {
      form.tenantId = "";
      selectedTenantIndex.value = -1;
      return;
    }

    if (tenantList.value.length) {
      const index = Math.max(
        tenantList.value.findIndex((item) => item.tenantId === form.tenantId),
        0,
      );
      selectedTenantIndex.value = index;
      form.tenantId = tenantList.value[index].tenantId;
      console.log("2默认租户", form.tenantId);
    } else {
      form.tenantId = "";
      selectedTenantIndex.value = -1;
    }
  } catch (error) {
    toast(error instanceof Error ? error.message : "租户列表获取失败");
  } finally {
    tenantLoading.value = false;
  }
}

function handleTenantChange(event: { detail: { value: number | string } }) {
  const index = Number(event.detail.value);
  const tenant = tenantList.value[index];
  if (!tenant) return;
  selectedTenantIndex.value = index;
  form.tenantId = tenant.tenantId;
}
function toast(title: string) {
  uni.showToast({
    title,
    icon: "none",
  });
}

function validateForm() {
  if (tenantEnabled.value && !required(form.tenantId)) {
    toast("请选择租户");
    return false;
  }
  if (!required(form.username)) {
    toast("用户名不能为空");
    return false;
  }
  // if (!isMobile(form.username)) {
  //   toast("请输入正确的手机号");
  //   return false;
  // }
  if (!required(form.password)) {
    toast("密码不能为空");
    return false;
  }
  // if (!form.agree) {
  //   toast("请先同意用户协议与隐私政策");
  //   return false;
  // }
  return true;
}

async function handleLogin() {
  if (submitting.value || !validateForm()) return;

  submitting.value = true;
  try {
    await userStore.login({
      username: form.username,
      password: form.password,
      tenantId: form.tenantId,
    });

    if (form.remember) {
      setRememberLogin(form.username, form.password, form.tenantId);
    } else {
      clearRememberLogin();
    }

    uni.showToast({
      title: "登录成功",
      icon: "success",
    });
    setTimeout(() => {
      uni.switchTab({
        url: "/pages/home/index",
      });
    }, 450);
  } catch (error) {
    toast(error instanceof Error ? error.message : "登录失败，请稍后重试");
  } finally {
    submitting.value = false;
  }
}

function showForgot() {
  toast("请联系管理员重置密码");
}
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";
@import "@/styles/mixins.scss";

.login-page {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
  min-height: 100vh;
  overflow: hidden;
  padding: calc(var(--status-bar-height) + 64rpx) 38rpx
    calc(env(safe-area-inset-bottom) + 28rpx);
  background:
    radial-gradient(
      circle at 18% 4%,
      rgba(66, 147, 242, 0.28),
      transparent 30%
    ),
    radial-gradient(
      circle at 82% 12%,
      rgba(88, 165, 255, 0.22),
      transparent 26%
    ),
    linear-gradient(
      180deg,
      #cfe6ff 0%,
      #e3f1ff 28%,
      #f5faff 50%,
      #ffffff 68%,
      #f7fbff 100%
    );
}

.login-page::before {
  position: absolute;
  top: 120rpx;
  left: -430rpx;
  width: 900rpx;
  height: 620rpx;
  border: 8rpx solid rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  content: "";
  pointer-events: none;
  transform: rotate(26deg);
}

.login-page::after {
  position: absolute;
  top: 300rpx;
  right: -460rpx;
  width: 900rpx;
  height: 400rpx;
  border: 12rpx solid rgba(255, 255, 255, 0.82);
  border-radius: 50%;
  content: "";
  pointer-events: none;
  transform: rotate(-12deg);
}

.decor {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.decor-left {
  top: -110rpx;
  left: -180rpx;
  width: 520rpx;
  height: 520rpx;
  background: radial-gradient(
    circle,
    rgba(186, 220, 255, 0.2),
    transparent 68%
  );
}

.decor-right {
  top: 36rpx;
  right: 36rpx;
  width: 150rpx;
  height: 150rpx;
  border-radius: 0;
  background-image: radial-gradient(
    rgba(83, 153, 236, 0.24) 3rpx,
    transparent 3rpx
  );
  background-size: 22rpx 22rpx;
}

.brand {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 44rpx;
}

.logo-wrap {
  @include flex-center;
  width: 170rpx;
  height: 170rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.94);
  border-radius: 48rpx;
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.98),
    rgba(236, 245, 255, 0.96)
  );
  box-shadow:
    0 24rpx 52rpx rgba(35, 91, 167, 0.17),
    0 0 0 10rpx rgba(255, 255, 255, 0.3),
    inset 0 2rpx 0 #ffffff;
}

.brand-logo {
  width: 140rpx;
  height: 140rpx;
}

.brand-title {
  margin-top: 24rpx;
  color: #0878ee;
  font-size: 48rpx;
  font-weight: 900;
  line-height: 66rpx;
  letter-spacing: 3rpx;
  text-shadow:
    0 3rpx 0 rgba(255, 255, 255, 0.9),
    0 7rpx 16rpx rgba(24, 112, 224, 0.22);
}

.brand-subtitle {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-top: 6rpx;
  padding: 0;
  border: 0;
  color: #5594e9;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 36rpx;
  letter-spacing: 4rpx;
  background: transparent;
}

.brand-subtitle::before,
.brand-subtitle::after {
  width: 42rpx;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, #69a8f3);
  content: "";
}

.brand-subtitle::after {
  background: linear-gradient(90deg, #69a8f3, transparent);
}

.login-card {
  position: relative;
  z-index: 3;
  padding: 36rpx 34rpx 38rpx;
  overflow: hidden;
  border: 2rpx solid rgba(255, 255, 255, 0.9);
  border-radius: 38rpx;
  background: linear-gradient(
    155deg,
    rgba(255, 255, 255, 0.98),
    rgba(247, 251, 255, 0.95)
  );
  box-shadow:
    0 30rpx 72rpx rgba(35, 76, 137, 0.13),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(24rpx);
}

.field {
  display: flex;
  align-items: center;
  min-height: 94rpx;
  margin-bottom: 22rpx;
  padding: 0 22rpx;
  border: 2rpx solid #dbe8f8;
  border-radius: 22rpx;
  background: linear-gradient(180deg, #f3f8ff 0%, #f8fbff 100%);
  box-shadow: inset 0 2rpx 4rpx rgba(49, 98, 160, 0.025);
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.field:focus-within {
  border-color: rgba(22, 119, 255, 0.68);
  background: #ffffff;
  box-shadow: 0 0 0 6rpx rgba(22, 119, 255, 0.08);
}

.field-icon {
  @include flex-center;
  flex-shrink: 0;
  width: 54rpx;
  height: 54rpx;
  margin-right: 12rpx;
  border-radius: 16rpx;
  background: rgba(22, 119, 255, 0.08);
}

.field-input {
  flex: 1;
  min-width: 0;
  height: 90rpx;
  color: $text-main;
  font-size: 30rpx;
}

.placeholder {
  color: #9eacc3;
}

.tenant-picker {
  flex: 1;
  min-width: 0;
  height: 90rpx;
}
.tenant-picker-content {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
.tenant-name {
  display: flex;
  align-items: center;
  height: 90rpx;
  overflow: hidden;
  color: $text-main;
  font-size: 30rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tenant-name.empty {
  color: #9eacc3;
}

.eye-btn {
  @include flex-center;
  width: 72rpx;
  height: 64rpx;
  padding: 0;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8rpx 0 32rpx;
}

.check-row,
.agreement {
  display: flex;
  align-items: center;
  min-height: 52rpx;
  color: #657696;
  font-size: 26rpx;
}

.check-box {
  @include flex-center;
  width: 34rpx;
  height: 34rpx;
  margin-right: 12rpx;
  border: 2rpx solid #afbdd3;
  border-radius: 9rpx;
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
  box-shadow: 0 6rpx 14rpx rgba(22, 119, 255, 0.2);
}

.link-btn {
  min-height: 52rpx;
  color: $primary-color;
  font-size: 26rpx;
  font-weight: 600;
}

.login-btn {
  @include flex-center;
  width: 100%;
  height: 94rpx;
  border-radius: 24rpx;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 700;
  letter-spacing: 8rpx;
  background: linear-gradient(135deg, #146fee 0%, #3190df 100%);
  box-shadow:
    0 18rpx 34rpx rgba(20, 111, 238, 0.26),
    0 4rpx 10rpx rgba(49, 144, 223, 0.16);
}

.login-btn::after {
  border: 0;
}

.login-btn:active {
  opacity: 0.88;
  transform: translateY(2rpx);
}

.login-btn.disabled {
  opacity: 0.64;
}

.agreement {
  justify-content: center;
  margin-top: 30rpx;
}

.agreement-text {
  color: $info-color;
  font-size: 24rpx;
}

.login-footer {
  position: relative;
  z-index: 2;
  margin-top: 28rpx;
  color: #7185a5;
  font-size: 22rpx;
  text-align: center;
  letter-spacing: 6rpx;
}

.wave-scene {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 270rpx;
  overflow: hidden;
  pointer-events: none;
}

.wave {
  position: absolute;
  left: -12%;
  width: 124%;
  border-radius: 50% 50% 0 0 / 40% 40% 0 0;
  transform-origin: center bottom;
}

.wave-back {
  bottom: -84rpx;
  height: 250rpx;
  background: linear-gradient(
    180deg,
    rgba(194, 226, 255, 0.48),
    rgba(111, 183, 255, 0.58)
  );
  transform: rotate(-4deg);
  border-top: 0.0625rem solid #cde7ff;
}

.wave-middle {
  bottom: -126rpx;
  height: 260rpx;
  background: linear-gradient(
    180deg,
    rgba(93, 174, 255, 0.45),
    rgba(54, 143, 255, 0.72)
  );
  transform: rotate(5deg);
  border-top: 0.0625rem solid #cde7ff;
}

.wave-front {
  bottom: -184rpx;
  height: 270rpx;
  background: linear-gradient(180deg, rgba(48, 138, 248, 0.562), #1677ffa9);
  border-top: 0.0625rem solid #cde7ff;
  transform: rotate(-3deg);
}

.wave-line {
  position: absolute;
  left: -10%;
  width: 120%;
  height: 180rpx;
  border-top: 0.0625rem solid #cde7ff;
  border-radius: 50%;
}

.wave-line-one {
  right: -10%;
  bottom: 42rpx;
  transform: rotate(-7deg);
}

.wave-line-two {
  bottom: 82rpx;
  border-top-color: rgba(72, 154, 246, 0.26);
  transform: rotate(5deg);
}

.brand,
.login-card,
.login-footer {
  transform: translateY(-180rpx);
}
</style>
