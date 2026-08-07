<template>
  <view v-if="visible" class="popup-mask" @click="handleMaskClick">
    <view class="device-popup" @click.stop>
      <view class="popup-handle" />
      <view class="popup-head">
        <text class="popup-title">{{ title }}</text>
        <text class="popup-subtitle">完善用户燃气设备信息</text>
      </view>

      <scroll-view class="form-scroll" scroll-y>
        <view class="form-list">
          <picker
            mode="selector"
            :range="deviceTypeOptions"
            range-key="dictLabel"
            :value="deviceTypeIndex"
            :disabled="saving"
            @change="handleDeviceTypeChange"
          >
            <view class="form-row">
              <text class="form-label required">设备类型</text>
              <view
                class="form-value picker-value"
                :class="{ placeholder: !form.deviceType }"
              >
                <text>{{ deviceTypeText || "请选择" }}</text>
                <uni-icons type="right" color="#A8B2C6" size="14"></uni-icons>
              </view>
            </view>
          </picker>

          <view class="form-row">
            <text class="form-label required">设备编号</text>
            <input
              class="form-input scan-input"
              :value="form.deviceNo"
              :disabled="saving"
              maxlength="100"
              placeholder="请输入（若无法获取编号，可任意输入）"
              @input="updateTextField('deviceNo', $event)"
            />
            <button
              class="scan-btn"
              :disabled="saving || scanning"
              @click="scanDeviceNo"
            >
              <uni-icons type="scan" color="#277BFF" size="23"></uni-icons>
            </button>
          </view>

          <view class="form-row">
            <text class="form-label">品牌</text>
            <input
              class="form-input"
              :value="form.brand"
              :disabled="saving"
              maxlength="50"
              placeholder="请输入"
              @input="updateTextField('brand', $event)"
            />
          </view>
          <view class="form-row">
            <text class="form-label">型号</text>
            <input
              class="form-input"
              :value="form.model"
              :disabled="saving"
              maxlength="50"
              placeholder="请输入"
              @input="updateTextField('model', $event)"
            />
          </view>

          <view
            class="form-row"
            :class="{ disabled: saving }"
            @click="openInstallDatePicker"
          >
            <text class="form-label required">安装日期</text>
            <view
              class="form-value picker-value"
              :class="{ placeholder: !form.installDate }"
            >
              <text>{{ form.installDate || "请选择" }}</text>
              <uni-icons type="right" color="#A8B2C6" size="14"></uni-icons>
            </view>
          </view>

          <view
            class="form-row"
            :class="{ disabled: saving }"
            @click="openProductionDatePicker"
          >
            <text class="form-label">生产日期</text>
            <view
              class="form-value picker-value"
              :class="{ placeholder: !form.productionDate }"
            >
              <text>{{ form.productionDate || "请选择" }}</text>
              <uni-icons type="right" color="#A8B2C6" size="14"></uni-icons>
            </view>
          </view>

          <view class="form-row">
            <text class="form-label">使用年限(年)</text>
            <input
              class="form-input"
              :value="form.serviceLife"
              :disabled="saving"
              type="digit"
              maxlength="5"
              placeholder="请输入"
              @input="updateServiceLife"
            />
          </view>

          <view class="form-row">
            <text class="form-label">是否保修</text>
            <view class="warranty-options">
              <view class="radio-option" @click="setWarranty(1)">
                <view
                  class="radio-dot"
                  :class="{ checked: form.isWarranty === 1 }"
                />
                <text>是</text>
              </view>
              <view class="radio-option" @click="setWarranty(0)">
                <view
                  class="radio-dot"
                  :class="{ checked: form.isWarranty === 0 }"
                />
                <text>否</text>
              </view>
            </view>
          </view>

          <view class="form-row">
            <text class="form-label">购买渠道</text>
            <input
              class="form-input"
              :value="form.purchaseChannel"
              :disabled="saving"
              maxlength="100"
              placeholder="请输入"
              @input="updateTextField('purchaseChannel', $event)"
            />
          </view>

          <view class="form-row remark-row">
            <text class="form-label">备注</text>
            <textarea
              class="remark-input"
              :value="form.remark"
              :disabled="saving"
              maxlength="200"
              auto-height
              placeholder="请输入"
              @input="updateTextField('remark', $event)"
            />
          </view>
        </view>
      </scroll-view>

      <view class="popup-actions">
        <button
          class="popup-button cancel"
          :disabled="saving"
          @click="$emit('cancel')"
        >
          取消
        </button>
        <button
          class="popup-button confirm"
          :loading="saving"
          :disabled="saving"
          @click="submit"
        >
          {{ saving ? "保存中..." : "确定" }}
        </button>
      </view>
      <AppointmentTimePicker
        ref="installDatePickerRef"
        v-model="form.installDate"
        mode="date"
        title="选择安装日期"
        min-date="1990-01-01"
        :max-date="today"
      />
      <AppointmentTimePicker
        ref="productionDatePickerRef"
        v-model="form.productionDate"
        mode="date"
        title="选择生产日期"
        min-date="1990-01-01"
        :max-date="today"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { DictDataVO } from "@/modules/common/types";
import type { DeviceItem } from "@/modules/work-order/types";
import { getDictLabelByValue } from "@/utils/common";
import AppointmentTimePicker from "@/components/AppointmentTimePicker.vue";

interface DeviceFormState {
  id?: string;
  deviceType: string;
  deviceNo: string;
  brand: string;
  model: string;
  installDate: string;
  productionDate: string;
  serviceLife: string;
  isWarranty: "" | 0 | 1;
  purchaseChannel: string;
  remark: string;
}

type TextField = "deviceNo" | "brand" | "model" | "purchaseChannel" | "remark";

const props = defineProps<{
  visible: boolean;
  mode: "add" | "edit";
  device?: DeviceItem | null;
  deviceTypeOptions: DictDataVO[];
  saving: boolean;
}>();

const emit = defineEmits<{
  cancel: [];
  submit: [device: DeviceItem];
}>();

type DatePickerExpose = {
  open: (value?: string) => void;
};

const installDatePickerRef = ref<DatePickerExpose | null>(null);
const productionDatePickerRef = ref<DatePickerExpose | null>(null);

const scanning = ref(false);
const form = reactive<DeviceFormState>(createEmptyForm());
const title = computed(() => (props.mode === "edit" ? "编辑设备" : "添加设备"));
const today = formatDate(new Date());
const deviceTypeIndex = computed(() => {
  const index = props.deviceTypeOptions.findIndex(
    (option) => String(option.dictValue) === form.deviceType,
  );
  return index < 0 ? 0 : index;
});
const deviceTypeText = computed(() =>
  getDictLabelByValue(props.deviceTypeOptions, form.deviceType),
);

watch(
  () => [props.visible, props.device] as const,
  ([visible]) => {
    if (!visible) return;
    Object.assign(form, normalizeDevice(props.device));
  },
  { immediate: true },
);

function openInstallDatePicker() {
  if (props.saving) return;
  installDatePickerRef.value?.open(form.installDate);
}

function openProductionDatePicker() {
  if (props.saving) return;
  productionDatePickerRef.value?.open(form.productionDate);
}

function createEmptyForm(): DeviceFormState {
  return {
    deviceType: "",
    deviceNo: "",
    brand: "",
    model: "",
    installDate: "",
    productionDate: "",
    serviceLife: "",
    isWarranty: "",
    purchaseChannel: "",
    remark: "",
  };
}

function normalizeDevice(device?: DeviceItem | null): DeviceFormState {
  return {
    ...createEmptyForm(),
    id: device?.id ? String(device.id) : undefined,
    deviceType: String(device?.deviceType || ""),
    deviceNo: String(device?.deviceNo || ""),
    brand: String(device?.brand || ""),
    model: String(device?.model || ""),
    installDate: String(device?.installDate || ""),
    productionDate: String(device?.productionDate || ""),
    serviceLife:
      device?.serviceLife === undefined || device.serviceLife === null
        ? ""
        : String(device.serviceLife),
    isWarranty:
      Number(device?.isWarranty) === 0
        ? 0
        : Number(device?.isWarranty) === 1
          ? 1
          : "",
    purchaseChannel: String(device?.purchaseChannel || ""),
    remark: String(device?.remark || ""),
  };
}

function getEventValue(event: unknown) {
  if (!event || typeof event !== "object") return "";
  const detail = (event as { detail?: { value?: unknown } }).detail;
  return String(detail?.value ?? "");
}

function updateTextField(field: TextField, event: unknown) {
  form[field] = getEventValue(event);
}

function updateServiceLife(event: unknown) {
  const value = getEventValue(event).replace(/[^0-9]/g, "");
  form.serviceLife = value;
}

function handleDeviceTypeChange(event: unknown) {
  const index = Number(getEventValue(event));
  const option = props.deviceTypeOptions[index];
  if (option) form.deviceType = String(option.dictValue);
}

function setWarranty(value: 0 | 1) {
  if (!props.saving) form.isWarranty = value;
}

function scanDeviceNo() {
  if (props.saving || scanning.value) return;
  scanning.value = true;
  uni.scanCode({
    scanType: ["barCode", "qrCode"],
    success: (result) => {
      const value = String(result.result || "").trim();
      if (!value) {
        uni.showToast({ title: "未识别到设备编号", icon: "none" });
        return;
      }
      form.deviceNo = value;
    },
    fail: (error) => {
      if (
        !String(error.errMsg || "")
          .toLowerCase()
          .includes("cancel")
      ) {
        uni.showToast({ title: "扫码失败，请重试", icon: "none" });
      }
    },
    complete: () => {
      scanning.value = false;
    },
  });
}

function submit() {
  if (!form.deviceType) {
    uni.showToast({ title: "请选择设备类型", icon: "none" });
    return;
  }
  if (!form.deviceNo.trim()) {
    uni.showToast({ title: "请输入或扫描设备编号", icon: "none" });
    return;
  }
  if (!form.installDate) {
    uni.showToast({ title: "请选择安装日期", icon: "none" });
    return;
  }

  const serviceLife = form.serviceLife ? Number(form.serviceLife) : null;
  emit("submit", {
    id: form.id,
    deviceType: form.deviceType,
    deviceNo: form.deviceNo.trim(),
    brand: form.brand.trim(),
    model: form.model.trim(),
    installDate: form.installDate,
    productionDate: form.productionDate || null,
    serviceLife,
    isWarranty: form.isWarranty === "" ? undefined : form.isWarranty,
    purchaseChannel: form.purchaseChannel.trim(),
    remark: form.remark.trim(),
  });
}

function handleMaskClick() {
  if (!props.saving) emit("cancel");
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
</script>

<style scoped lang="scss">
@import "@/styles/variables.scss";

.popup-mask {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: flex;
  align-items: flex-end;
  background: rgba(13, 32, 65, 0.46);
}

.device-popup {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  max-height: 92vh;
  padding: 16rpx 28rpx calc(24rpx + env(safe-area-inset-bottom));
  border-radius: 34rpx 34rpx 0 0;
  background: #fff;
  box-shadow: 0 -12rpx 40rpx rgba(25, 54, 103, 0.14);
}

.popup-handle {
  flex-shrink: 0;
  width: 72rpx;
  height: 8rpx;
  margin: 0 auto 16rpx;
  border-radius: 4rpx;
  background: #dce3ef;
}

.popup-head {
  flex-shrink: 0;
  text-align: center;
}
.popup-title {
  display: block;
  color: #18335f;
  font-size: 34rpx;
  font-weight: 900;
}
.popup-subtitle {
  display: block;
  margin-top: 5rpx;
  color: #9aa8c0;
  font-size: 22rpx;
}
.form-scroll {
  flex: 1;
  min-height: 0;
  margin-top: 20rpx;
}
.form-list {
  padding: 0 4rpx;
}
.form-row {
  display: flex;
  align-items: center;
  min-height: 82rpx;
  border-bottom: 2rpx solid #edf0f5;
}
.form-label {
  flex: 0 0 188rpx;
  color: #263858;
  font-size: 26rpx;
}
.form-label.required::before {
  color: #f04455;
  content: "*";
}
.form-input,
.form-value {
  flex: 1;
  min-width: 0;
  height: 82rpx;
  color: #263858;
  font-size: 25rpx;
  line-height: 82rpx;
  text-align: right;
}
.form-input {
  padding: 0;
}
.form-input.scan-input {
  padding-right: 12rpx;
  font-size: 23rpx;
}
.picker-value {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10rpx;
}
.placeholder {
  color: #b5bdcb;
}
.scan-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 68rpx;
  width: 68rpx;
  height: 68rpx;
  margin: 0;
  padding: 0;
  background: transparent;
}
.scan-btn::after,
.popup-button::after {
  border: 0;
}
.warranty-options {
  display: flex;
  justify-content: flex-end;
  flex: 1;
  gap: 30rpx;
}
.radio-option {
  display: flex;
  align-items: center;
  gap: 9rpx;
  color: #263858;
  font-size: 25rpx;
}
.radio-dot {
  box-sizing: border-box;
  width: 28rpx;
  height: 28rpx;
  border: 2rpx solid #9ca8bb;
  border-radius: 50%;
}
.radio-dot.checked {
  border: 8rpx solid $primary-color;
}
.remark-row {
  align-items: flex-start;
  padding: 20rpx 0;
}
.remark-row .form-label {
  line-height: 42rpx;
}
.remark-input {
  box-sizing: border-box;
  flex: 1;
  min-height: 96rpx;
  padding: 10rpx 16rpx;
  border-radius: 14rpx;
  color: #263858;
  font-size: 25rpx;
  line-height: 38rpx;
  text-align: left;
  background: #f7f9fc;
}
.popup-actions {
  display: grid;
  grid-template-columns: 1fr 1.7fr;
  flex-shrink: 0;
  gap: 18rpx;
  margin-top: 24rpx;
}
.popup-button {
  height: 76rpx;
  margin: 0;
  padding: 0;
  border-radius: 40rpx;
  font-size: 26rpx;
  line-height: 76rpx;
}
.popup-button.cancel {
  color: #8d9ab0;
  background: #f2f5f9;
}
.popup-button.confirm {
  color: #fff;
  background: linear-gradient(100deg, #347cf0, #5572e9);
}
</style>
