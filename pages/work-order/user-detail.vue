<template>
  <view class="user-detail-page page">
    <AppNavbar title="用户信息" show-back />

    <view v-if="loading" class="state-view">
      <uni-load-more
        status="loading"
        color="#1677FF"
        content-text="用户加载中..."
      />
    </view>

    <view v-else-if="error" class="error-card">
      <text class="error-title">用户详情加载失败</text>
      <text class="error-desc">{{ error }}</text>
      <button class="retry-btn" @click="loadDetail">重新加载</button>
    </view>

    <scroll-view
      v-else-if="detail"
      class="detail-scroll"
      scroll-y
      :show-scrollbar="false"
    >
      <view class="detail-content">
        <view class="section-block">
          <text class="section-title">工单信息</text>
          <view class="work-order-card">
            <view class="work-order-top">
              <text class="work-order-no">
                {{ displayValue(detail.workOrder.workOrderNo) }}
              </text>
              <text class="status-tag" :class="workOrderStatusClass">
                {{ workOrderStatusText }}
              </text>
            </view>
            <text class="work-order-name">{{
              displayValue(detail.workOrder.workOrderName)
            }}</text>
          </view>
        </view>

        <view class="section-block">
          <text class="section-title">用户信息</text>
          <view class="info-card">
            <view class="info-row with-action">
              <text class="info-label">户名：</text>
              <text class="info-value">
                {{ displayValue(detail.workOrderUser.householdName) }}
              </text>
              <button class="phone-btn" @click="makePhoneCall">
                <uni-icons type="phone-filled" color="#1677FF" size="20" />
              </button>
            </view>
            <view
              v-for="item in userInfoRows"
              :key="item.label"
              class="info-row"
              :class="{ 'address-row': item.isAddress }"
            >
              <text class="info-label">{{ item.label }}：</text>
              <text class="info-value">{{ item.value }}</text>
            </view>
          </view>
        </view>

        <view class="section-block">
          <view class="section-title device-title">
            <text>设备信息</text>
            <view class="add-device-btn" @click="openAddDevice">
              <uni-icons type="plusempty" color="#fff" size="15" />
              添加设备
            </view>
          </view>
          <uni-swipe-action v-if="deviceList.length" class="device-list">
            <uni-swipe-action-item
              v-for="device in deviceList"
              :key="String(device.id || device.deviceNo)"
              class="device-swipe"
              :right-options="DEVICE_SWIPE_OPTIONS"
              @click="confirmDeleteDevice(device)"
            >
              <view class="device-card" @click="openEditDevice(device)">
                <view class="device-main">
                  <text v-if="device.deviceType" class="device-type">
                    {{ getDeviceTypeText(device.deviceType) }}
                  </text>
                  <view class="info-row">
                    <text class="info-label">设备品牌：</text>
                    <text class="info-value">
                      {{ displayValue(device.brand) }}
                    </text>
                  </view>
                  <view class="info-row">
                    <text class="info-label">设备型号：</text>
                    <text class="info-value">
                      {{ displayValue(device.model) }}
                    </text>
                  </view>
                  <view class="info-row">
                    <text class="info-label">安装日期：</text>
                    <text class="info-value">
                      {{ displayValue(device.installDate) }}
                    </text>
                  </view>
                  <view class="info-row">
                    <text class="info-label">使用年限：</text>
                    <text class="info-value">
                      {{ displayValue(device.serviceLife) }}
                    </text>
                  </view>
                </view>
                <uni-icons type="right" color="#9AA8C5" size="15" />
              </view>
            </uni-swipe-action-item>
          </uni-swipe-action>
          <view v-else class="device-empty">暂无设备信息</view>
        </view>
        <view class="section-block">
          <text class="section-title">安检历史</text>
          <view v-if="historyList.length" class="history-list">
            <view
              v-for="record in historyList"
              :key="record.id"
              class="history-card"
              @click="navigateToDetail(record)"
            >
              <view class="history-main">
                <view
                  class="status-tag is-processing history-tag"
                  v-if="record.currentWorkOrderLatest"
                >
                  本次安检记录
                </view>
                <view class="info-row">
                  <text class="info-label">安检时间：</text>
                  <text class="info-value">{{
                    displayValue(record.inspectionFinishTime)
                  }}</text>
                </view>
                <view class="info-row">
                  <text class="info-label">安检员：</text>
                  <text class="info-value">{{
                    displayValue(record.inspectorName)
                  }}</text>
                </view>
                <view class="info-row">
                  <text class="info-label">隐患数：</text>
                  <text class="info-value">{{
                    displayValue(record.dangerCount)
                  }}</text>
                </view>
                <view class="info-row result-row">
                  <text class="info-label">安检结果：</text>
                  <text
                    class="result-tag"
                    :class="getResultClass(record.inspectionResult)"
                  >
                    {{
                      record.inspectionResult === "3"
                        ? getResultText(record.unableReason, true)
                        : getResultText(record.inspectionResult)
                    }}
                  </text>
                </view>
              </view>
              <uni-icons type="right" color="#9AA8C5" size="15" />
            </view>
          </view>
          <view v-else class="history-empty">暂无安检历史</view>
        </view>
      </view>
    </scroll-view>

    <view
      v-if="detail?.workOrderUser.status === '1'"
      class="inspection-actions"
    >
      <template
        v-for="action in Object.values(INSPECTION_ACTIONS)"
        :key="action.mode"
      >
        <button
          v-if="
            (action.mode === '1' && isAgentAgentEnabled) ||
            (action.mode === '2' && isHumanAgentEnabled) ||
            action.mode === '3'
          "
          class="inspection-action"
          :class="action.className"
          @click="handleInspectionAction(action.mode)"
        >
          <image
            class="action-icon"
            :src="getActionIcon(action.mode)"
            mode="aspectFit"
          />
          <text class="action-title">{{ action.label }}</text>
          <text class="action-desc">{{ action.desc }}</text>
        </button>
      </template>
    </view>
    <DeviceFormPopup
      :visible="devicePopupVisible"
      :mode="deviceFormMode"
      :device="editingDevice"
      :device-type-options="deviceTypeDict"
      :saving="deviceSaving"
      @cancel="closeDevicePopup"
      @submit="saveDevice"
    />
    <!-- 无法安检弹窗 -->
    <UnableInspectionPopup
      :visible="unablePopupVisible"
      :reason-options="UNABLE_INSPECTION_REASON_OPTIONS"
      :selected-reason="unableReason"
      :remark="unableRemark"
      :photos="unablePhotos"
      :max-photo-count="UNABLE_INSPECTION_MAX_PHOTO_COUNT"
      :operating="unableOperating"
      :deleting-photo-ids="unableDeletingPhotoIds"
      @reason-change="unableReason = $event"
      @remark-change="unableRemark = $event"
      @capture="captureUnablePhoto"
      @remove-photo="removeUnablePhoto"
      @cancel="cancelUnableInspection"
      @confirm="submitUnableInspection"
    />
  </view>
  <!-- 删除设备确认框弹窗 -->
  <uni-popup ref="deleteDialogRef" type="dialog">
    <uni-popup-dialog
      type="error"
      cancelText="取消"
      confirmText="确定"
      title="删除设备"
      :content="confirmContent"
      @confirm="removeDevice"
    ></uni-popup-dialog>
  </uni-popup>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onPullDownRefresh, onUnload } from "@dcloudio/uni-app";
import { formatDateTime } from "@/utils/date";
import AppNavbar from "@/components/AppNavbar.vue";
import UnableInspectionPopup from "@/pages/work-order/inspection/components/UnableInspectionPopup.vue";
import DeviceFormPopup from "@/pages/work-order/components/DeviceFormPopup.vue";
import type {
  InspectionHistoryRecord,
  WorkOrderUserDetailResult,
  WorkOrderUserInfoRow,
  DeviceItem,
} from "@/modules/work-order/types";
import {
  addDeviceApi,
  deleteDeviceApi,
  getDeviceDetailApi,
  getWorkOrderUserDetailApi,
  updateDeviceApi,
  getParameterConfigListApi,
} from "@/modules/work-order/api";
import { submitInspectionRecordApi } from "@/modules/work-order/inspection/api";
import type { InspectionPhoto } from "@/modules/work-order/inspection/types";
import { captureInspectionPhotos } from "@/pages/work-order/inspection/composables/useInspectionCamera";
import { deleteFileApi, uploadFilesApi } from "@/modules/common/api";
import { FILE_UPLOAD_TYPE } from "@/modules/common/types";
import type { DictDataVO } from "@/modules/common/types";
import {
  getDictLabelByType,
  getDictLabelByValue,
  getDictsByTypes,
} from "@/utils/common";
import {
  ANDROID_PERMISSIONS,
  ensureRecordingPermissions,
} from "@/utils/appPermission";
import { useInspectionStore } from "@/stores/inspection";
import {
  UNABLE_INSPECTION_DEFAULT_REASON,
  UNABLE_INSPECTION_MAX_PHOTO_COUNT,
  INSPECTION_ACTIONS,
  UNABLE_INSPECTION_REASON_OPTIONS,
} from "@/pages/work-order/inspection/constants/inspection";

const workOrderUserId = ref("");
const detail = ref<WorkOrderUserDetailResult | null>(null);
const loading = ref(false);
const error = ref("");
const workOrderStatusText = ref("--");
const inspectionStore = useInspectionStore();
const navigatingToInspection = ref(false);
const checkingInspectionPermissions = ref(false);
const navigatingToHistory = ref(false);
const unablePopupVisible = ref(false);
const unableInspectionStartTime = ref("");
const unableReason = ref<string>(UNABLE_INSPECTION_DEFAULT_REASON);
const unableRemark = ref("");
const unablePhotos = ref<InspectionPhoto[]>([]);
const unableSubmitting = ref(false);
const unableCameraOpening = ref(false);
const unableCancelling = ref(false);
const unableDeletingPhotoIds = ref<string[]>([]);
const unableOperating = computed(
  () =>
    unableSubmitting.value ||
    unableCameraOpening.value ||
    unableCancelling.value,
);
const deviceTypeDict = ref<DictDataVO[]>([]);
const devicePopupVisible = ref(false);
const deviceFormMode = ref<"add" | "edit">("add");
const editingDevice = ref<DeviceItem | null>(null);
const deviceSaving = ref(false);
const deviceOpening = ref(false);
const deletingDeviceId = ref<string>("");
const deleteDialogRef = ref<any>();
const confirmContent = ref("");
const DEVICE_SWIPE_OPTIONS = [
  {
    text: "删除",
    style: {
      backgroundColor: "#F04455",
      color: "#FFFFFF",
      fontSize: "26rpx",
    },
  },
];
async function loadDeviceTypeDict() {
  try {
    const dicts = await getDictsByTypes(["cyc_device_type"]);
    deviceTypeDict.value = dicts.cyc_device_type || [];
  } catch {
    deviceTypeDict.value = [];
  }
}

const historyList = computed<InspectionHistoryRecord[]>(
  () => detail.value?.historyList || [],
);
const deviceList = computed<DeviceItem[]>(() => detail.value?.deviceList || []);
const userInfoRows = computed<WorkOrderUserInfoRow[]>(() => {
  const user = detail.value?.workOrderUser;
  return [
    { label: "户号", value: displayValue(user?.householdNo) },
    { label: "手机号码", value: displayValue(user?.mobilePhone) },
    { label: "表号", value: displayValue(user?.meterNo) },
    {
      label: "预约时间",
      value: displayValue(user?.appointmentTime),
    },
    { label: "地址", value: displayValue(user?.userAddress), isAddress: true },
  ];
});

const workOrderStatusClass = computed(() =>
  getUserStatusClass(detail.value?.workOrder.status),
);

onLoad((options) => {
  workOrderUserId.value = decodeURIComponent(options?.workOrderUserId || "");
  loadParameterConfigList();
  loadDeviceTypeDict();
  loadDetail();
  uni.$on("inspection-submitted", handleInspectionSubmitted);
});

onUnload(() => {
  uni.$off("inspection-submitted", handleInspectionSubmitted);
  cleanupUnableUploadedFiles();
});

onPullDownRefresh(async () => {
  uni.showToast({
    title: "用户数据获取中...",
    icon: "none",
    duration: 1000,
  });
  await loadDeviceTypeDict();
  await loadDetail();
  await loadParameterConfigList();
  uni.stopPullDownRefresh();
});

// 是否开启Agent安检
const isAgentAgentEnabled = ref(false);
// 是否开启人工安检
const isHumanAgentEnabled = ref(false);
// 是否开启自动录音
const isAutoRecordingEnabled = ref(false);

async function loadParameterConfigList() {
  try {
    const result = await getParameterConfigListApi();
    console.log("user-detail loadParameterConfigList", result);
    isAgentAgentEnabled.value = result
      .filter((item) => item.configType === 1)
      .some((item) => item.configValue === "1");
    isHumanAgentEnabled.value = result
      .filter((item) => item.configType === 2)
      .some((item) => item.configValue === "1");
    isAutoRecordingEnabled.value = result
      .filter((item) => item.configType === 3)
      .some((item) => item.configValue === "1");
  } catch (error) {
    isHumanAgentEnabled.value = false;
    isAgentAgentEnabled.value = false;
    isAutoRecordingEnabled.value = false;
  }
}

async function loadDetail() {
  if (!workOrderUserId.value) {
    error.value = "缺少安检用户 ID";
    return;
  }

  loading.value = true;
  error.value = "";
  try {
    const result = await getWorkOrderUserDetailApi(workOrderUserId.value);
    detail.value = result;
    console.log("user-detail loadDetail", detail.value?.workOrderUser.status);

    await resolveWorkOrderStatus(result.workOrder.status);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "用户详情加载失败";
  } finally {
    loading.value = false;
  }
}

async function resolveWorkOrderStatus(status: string) {
  try {
    workOrderStatusText.value = await getDictLabelByType(
      "work_order_status",
      status,
    );
  } catch (error) {
    workOrderStatusText.value = "";
  }
  workOrderStatusText.value = workOrderStatusText.value;
}

function displayValue(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "--";
  return String(value);
}

function getUserStatusClass(status?: string | number | null) {
  const classMap: Record<string, string> = {
    "1": "is-pending",
    "2": "is-processing",
    "3": "is-completed",
    "4": "is-failed",
    "5": "is-canceled",
  };
  return classMap[String(status ?? "")] || "is-pending";
}

function getResultText(result?: string | number | null, isUnable?: boolean) {
  if (result === undefined || result === null || result === "") return "--";
  const value = String(result);
  const fallback: Record<string, string> = {
    "1": "合格",
    "2": "不合格",
    "3": "无法安检",
  };
  const unableFallbackMap: Record<string, string> = {
    "1": "到访不遇",
    "2": "拒绝安检",
  };
  if (isUnable) {
    return unableFallbackMap[value] || value;
  }
  return fallback[value] || value;
}

function getResultClass(result?: string | number | null) {
  const classMap: Record<string, string> = {
    "1": "is-passed",
    "2": "is-failed",
    "3": "is-unable",
  };
  return classMap[String(result ?? "")] || "is-unable";
}

function makePhoneCall() {
  const phone = detail.value?.workOrderUser.mobilePhone;
  if (!phone) {
    uni.showToast({ title: "用户手机号码为空", icon: "none" });
    return;
  }
  uni.makePhoneCall({ phoneNumber: phone });
}

function getActionIcon(mode: string) {
  const iconMap: Record<string, string> = {
    "1": "/static/images/work-order/ai.svg",
    "2": "/static/images/work-order/person.svg",
    "3": "/static/images/work-order/unable.svg",
  };
  return iconMap[mode] || "";
}

function getDeviceTypeText(deviceType?: string) {
  return (
    getDictLabelByValue(deviceTypeDict.value, String(deviceType || "")) ||
    "其他设备"
  );
}

function openAddDevice() {
  if (deviceOpening.value || deviceSaving.value) return;
  deviceFormMode.value = "add";
  editingDevice.value = null;
  devicePopupVisible.value = true;
}

async function openEditDevice(device: DeviceItem) {
  if (deviceOpening.value || deviceSaving.value) return;
  const deviceId = String(device.id || "").trim();
  if (!workOrderUserId.value || !deviceId) {
    uni.showToast({ title: "缺少设备参数", icon: "none" });
    return;
  }

  deviceOpening.value = true;
  uni.showLoading({ title: "设备加载中", mask: true });
  try {
    const result = await getDeviceDetailApi(workOrderUserId.value, deviceId);
    editingDevice.value = { ...result, id: String(result.id || deviceId) };
    deviceFormMode.value = "edit";
    devicePopupVisible.value = true;
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "设备详情加载失败",
      icon: "none",
    });
  } finally {
    deviceOpening.value = false;
    uni.hideLoading();
  }
}

function closeDevicePopup() {
  if (deviceSaving.value) return;
  devicePopupVisible.value = false;
  editingDevice.value = null;
}

async function saveDevice(device: DeviceItem) {
  if (deviceSaving.value || !workOrderUserId.value) return;
  deviceSaving.value = true;
  try {
    if (deviceFormMode.value === "edit") {
      const deviceId = String(
        device.id || editingDevice.value?.id || "",
      ).trim();
      if (!deviceId) throw new Error("缺少设备 ID");
      await updateDeviceApi(workOrderUserId.value, { ...device, id: deviceId });
    } else {
      const { id: _id, ...createData } = device;
      await addDeviceApi(workOrderUserId.value, createData);
    }
    devicePopupVisible.value = false;
    editingDevice.value = null;
    await loadDetail();
    uni.showToast({ title: "保存成功", icon: "success" });
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "设备保存失败",
      icon: "none",
    });
  } finally {
    deviceSaving.value = false;
  }
}

async function removeDevice() {
  if (!workOrderUserId.value || !deletingDeviceId.value) {
    uni.showToast({ title: "缺少设备参数", icon: "none" });
    return;
  }

  try {
    await deleteDeviceApi(workOrderUserId.value, deletingDeviceId.value);
    await loadDetail();
    uni.showToast({ title: "删除成功", icon: "success" });
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "设备删除失败",
      icon: "none",
    });
  } finally {
    deletingDeviceId.value = "";
    deleteDialogRef?.value?.close();
  }
}
function confirmDeleteDevice(device: DeviceItem) {
  deletingDeviceId.value = String(device.id || "").trim();
  confirmContent.value = `确定删除“${getDeviceTypeText(device.deviceType) || "未编号设备"}”吗？`;
  deleteDialogRef?.value?.open();
}
// 处理安检操作
async function handleInspectionAction(mode: string) {
  if (
    mode === INSPECTION_ACTIONS.AI.mode ||
    mode === INSPECTION_ACTIONS.MANUAL.mode
  ) {
    if (navigatingToInspection.value || checkingInspectionPermissions.value) {
      return;
    }
    if (!detail.value?.template) {
      uni.showToast({ title: "未配置安检模板", icon: "none" });
      return;
    }
    const currentWorkOrderUserId = workOrderUserId.value;
    if (!currentWorkOrderUserId) {
      uni.showToast({ title: "缺少工单或用户参数", icon: "none" });
      return;
    }
    navigatingToInspection.value = true;
    checkingInspectionPermissions.value = true;
    try {
      if (
        !(await ensureRecordingPermissions([
          ANDROID_PERMISSIONS.RECORD_AUDIO,
          ANDROID_PERMISSIONS.POST_NOTIFICATIONS,
        ]))
      ) {
        navigatingToInspection.value = false;
        return;
      }
    } finally {
      checkingInspectionPermissions.value = false;
    }

    inspectionStore.setDetail(detail.value);
    const ModelStatus =
      mode === INSPECTION_ACTIONS.AI.mode
        ? isHumanAgentEnabled.value
        : isAgentAgentEnabled.value;
    uni.navigateTo({
      url: `/pages/work-order/inspection/index?workOrderUserId=${encodeURIComponent(currentWorkOrderUserId)}&inspectionMode=${mode}&modelStatus=${ModelStatus}&isAutoRecordingEnabled=${isAutoRecordingEnabled.value}`,
      complete: () => {
        setTimeout(() => {
          navigatingToInspection.value = false;
        }, 500);
      },
    });
    return;
  }
  if (mode === INSPECTION_ACTIONS.UNABLE.mode) {
    openUnableInspection();
    return;
  }
}

// 导航到工单详情
function navigateToDetail(record: InspectionHistoryRecord) {
  if (navigatingToHistory.value) return;
  const currentRecordId = String(record.id || "").trim();
  if (!workOrderUserId.value || !currentRecordId) {
    uni.showToast({ title: "缺少安检记录参数", icon: "none" });
    return;
  }

  navigatingToHistory.value = true;
  uni.navigateTo({
    url: `/pages/work-order/inspection/history-detail?workOrderUserId=${encodeURIComponent(workOrderUserId.value)}&recordId=${encodeURIComponent(currentRecordId)}`,
    complete: () => {
      setTimeout(() => {
        navigatingToHistory.value = false;
      }, 500);
    },
  });
}
function resetUnableInspectionForm() {
  unableInspectionStartTime.value = "";
  unableReason.value = UNABLE_INSPECTION_DEFAULT_REASON;
  unableRemark.value = "";
  unablePhotos.value = [];
  unableDeletingPhotoIds.value = [];
}

function openUnableInspection() {
  if (unableOperating.value) return;
  if (!workOrderUserId.value) {
    uni.showToast({ title: "缺少工单用户参数", icon: "none" });
    return;
  }
  resetUnableInspectionForm();
  unableInspectionStartTime.value = formatDateTime();
  unablePopupVisible.value = true;
}

async function captureUnablePhoto() {
  if (
    unableOperating.value ||
    unablePhotos.value.length >= UNABLE_INSPECTION_MAX_PHOTO_COUNT
  ) {
    return;
  }
  unableCameraOpening.value = true;
  try {
    const remaining =
      UNABLE_INSPECTION_MAX_PHOTO_COUNT - unablePhotos.value.length;
    const results = await captureInspectionPhotos(
      INSPECTION_ACTIONS.UNABLE.mode,
    );
    const existingPaths = new Set(
      unablePhotos.value.map((photo) => photo.localPath).filter(Boolean),
    );
    const photos = results
      .filter((result) => result.path && !existingPaths.has(result.path))
      .slice(0, remaining)
      .map<InspectionPhoto>((result) => ({
        id: "unable-" + Date.now() + "-" + Math.random().toString(36).slice(2),
        localPath: result.path,
        uploadStatus: "pending",
      }));
    unablePhotos.value.push(...photos);
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "拍照失败，请重试",
      icon: "none",
    });
  } finally {
    unableCameraOpening.value = false;
  }
}

function setUnablePhotoDeleting(photoId: string, deleting: boolean) {
  unableDeletingPhotoIds.value = deleting
    ? [...new Set([...unableDeletingPhotoIds.value, photoId])]
    : unableDeletingPhotoIds.value.filter((id) => id !== photoId);
}

async function removeUnablePhoto(photoId: string) {
  const photo = unablePhotos.value.find((item) => item.id === photoId);
  if (!photo || unableDeletingPhotoIds.value.includes(photoId)) return;
  if (photo.uploadStatus === "uploading") {
    uni.showToast({ title: "照片正在上传，请稍候", icon: "none" });
    return;
  }

  const fileId = String(photo.fileId || "").trim();
  if (fileId) {
    setUnablePhotoDeleting(photoId, true);
    try {
      await deleteFileApi(fileId);
    } catch {
      return;
    } finally {
      setUnablePhotoDeleting(photoId, false);
    }
  }
  unablePhotos.value = unablePhotos.value.filter((item) => item.id !== photoId);
}

async function deleteUnableUploadedFiles() {
  const fileIds = [
    ...new Set(
      unablePhotos.value
        .map((photo) => String(photo.fileId || "").trim())
        .filter(Boolean),
    ),
  ];
  if (!fileIds.length) return;
  await Promise.allSettled(fileIds.map((fileId) => deleteFileApi(fileId)));
}

function cleanupUnableUploadedFiles() {
  if (unableSubmitting.value) return;
  deleteUnableUploadedFiles();
}

async function cancelUnableInspection() {
  if (unableOperating.value) return;
  unableCancelling.value = true;
  try {
    // 提交失败后可能已有服务器文件，取消时清理，避免孤儿文件。
    await deleteUnableUploadedFiles();
  } finally {
    unableCancelling.value = false;
    unablePopupVisible.value = false;
    resetUnableInspectionForm();
  }
}

async function uploadUnablePhotos() {
  const targets = unablePhotos.value.filter((photo) => !photo.fileId);
  if (!targets.length) return;
  const paths = targets.map((photo) => photo.localPath || "");
  if (paths.some((path) => !path)) throw new Error("无法安检照片路径无效");

  targets.forEach((photo) => {
    photo.uploadStatus = "uploading";
    photo.errorMessage = undefined;
  });
  try {
    const uploadedFiles = await uploadFilesApi(
      paths,
      FILE_UPLOAD_TYPE.INSPECTION_IMAGE,
    );
    console.log("uploadedFiles", uploadedFiles.length, uploadedFiles);
    console.log("targets", targets.length, targets);

    if (uploadedFiles.length < targets.length) {
      throw new Error("无法安检照片上传结果不完整");
    }
    targets.forEach((photo, index) => {
      const uploaded = uploadedFiles[index];
      if (!uploaded?.fileId) throw new Error("照片上传结果为空");
      photo.fileId = String(uploaded.fileId);
      photo.fileUrl = uploaded.url;
      photo.uploadStatus = "success";
    });
  } catch (error) {
    targets.forEach((photo) => {
      if (photo.uploadStatus !== "success") {
        photo.uploadStatus = "failed";
        photo.errorMessage =
          error instanceof Error ? error.message : "照片上传失败";
      }
    });
    throw error;
  }
}

async function submitUnableInspection() {
  if (unableSubmitting.value) return;
  if (!unableReason.value) {
    uni.showToast({ title: "请选择无法安检原因", icon: "none" });
    return;
  }
  if (!workOrderUserId.value) {
    uni.showToast({ title: "缺少工单用户参数", icon: "none" });
    return;
  }

  unableSubmitting.value = true;
  try {
    await uploadUnablePhotos();
    await submitInspectionRecordApi({
      workOrderUserId: workOrderUserId.value,
      inspectionMode: INSPECTION_ACTIONS.UNABLE.mode,
      inspectionStartTime: unableInspectionStartTime.value || formatDateTime(),
      inspectionFinishTime: formatDateTime(),
      unableReason: unableReason.value,
      remark: unableRemark.value.trim(),
      unablePhotoList: unablePhotos.value
        .filter((photo) => photo.fileId)
        .map((photo) => ({
          fileId: String(photo.fileId),
          fileUrl: photo.fileUrl,
        })),
    });
    unablePopupVisible.value = false;
    resetUnableInspectionForm();
    await loadDetail();
    uni.showToast({ title: "提交成功", icon: "success" });
  } catch (error) {
    uni.showToast({
      title:
        error instanceof Error ? error.message : "无法安检提交失败，请重试",
      icon: "none",
    });
  } finally {
    unableSubmitting.value = false;
  }
}
async function handleInspectionSubmitted() {
  await loadDetail();
}
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";
@import "@/styles/mixins.scss";

.user-detail-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: $bg-page;
}

.detail-scroll {
  flex: 1;
  min-height: 0;
}

.detail-content {
  padding: 24rpx 24rpx 40rpx;
}

.section-block + .section-block {
  margin-top: 42rpx;
}

.section-title {
  display: block;
  margin: 0 8rpx 20rpx;
  color: $text-main;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 42rpx;
}
.device-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
}
.add-device-btn {
  @include flex-center;
  gap: 5rpx;
  padding: 10rpx 20rpx;
  border-radius: 28rpx;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 38rpx;
  background: linear-gradient(100deg, #347cf0, #5572e9);
  box-shadow: 0 7rpx 18rpx rgba(54, 116, 225, 0.22);
  color: #fff;
}
.work-order-card,
.info-card,
.device-card,
.device-empty,
.history-card,
.history-empty,
.error-card {
  background: #fff;
  border-radius: $card-radius;
  box-shadow: $shadow-card;
}

.work-order-card {
  padding: 28rpx 32rpx 32rpx;
}

.work-order-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.work-order-no {
  min-width: 0;
  overflow: hidden;
  color: $info-color;
  font-size: 26rpx;
  line-height: 38rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-tag {
  @include flex-center;
  flex-shrink: 0;
  min-width: 108rpx;
  height: 52rpx;
  padding: 0 18rpx;
  border-radius: 28rpx;
  font-size: 24rpx;
  font-weight: 700;
}

.status-tag.is-pending,
.status-tag.is-processing {
  color: $primary-color;
  background: $primary-bg;
}

.status-tag.is-completed {
  color: $success-color;
  background: $success-bg;
}

.status-tag.is-failed {
  color: $error-color;
  background: $error-bg;
}

.status-tag.is-canceled {
  color: $info-color;
  background: $info-bg;
}

.work-order-name {
  display: block;
  margin-top: 26rpx;
  color: $text-main;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 44rpx;
}

.info-card {
  padding: 18rpx 32rpx;
}

.info-row {
  display: flex;
  align-items: flex-start;
  min-width: 0;
  padding: 6rpx 0;
  font-size: 26rpx;
}

.info-row.with-action {
  align-items: center;
}

.info-label {
  width: 130rpx;
  flex: 0 0 auto;
  color: #8b9ab7;
  font-weight: 600;
  line-height: 38rpx;
}

.info-value {
  min-width: 0;
  color: $text-main;
  font-weight: 600;
  line-height: 38rpx;
  word-break: break-all;
}

.info-row:not(.address-row) .info-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.phone-btn {
  @include flex-center;
  flex: 0 0 54rpx;
  width: 54rpx;
  height: 54rpx;
  margin-left: auto;
  padding: 0;
  border-radius: 50%;
  background: $primary-bg;
}

.phone-btn::after,
.inspection-action::after,
.retry-btn::after {
  border: 0;
}

.device-list,
.history-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}

.device-swipe {
  overflow: hidden;
  border-radius: $card-radius;
  box-shadow: $shadow-card;
}

.device-swipe .device-card {
  border-radius: 0;
  box-shadow: none;
}

.device-card,
.history-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx 32rpx;
}

.device-main,
.history-main {
  flex: 1;
  min-width: 0;
}
.history-main {
  position: relative;
}
.history-tag {
  position: absolute;
  top: -10rpx;
  right: -40rpx;
}
.device-type {
  color: $text-main;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 60rpx;
}

.result-row {
  align-items: center;
}

.result-tag {
  @include flex-center;
  min-width: 76rpx;
  height: 46rpx;
  padding: 0 16rpx;
  border-radius: 24rpx;
  font-size: 23rpx;
  font-weight: 600;
}

.result-tag.is-passed {
  color: #fff;
  background: $success-color;
}

.result-tag.is-failed {
  color: #fff;
  background: $error-color;
}

.result-tag.is-unable {
  color: $info-color;
  background: $info-bg;
}

.device-empty,
.history-empty {
  padding: 44rpx 0;
  color: $info-color;
  font-size: 26rpx;
  text-align: center;
}

.inspection-actions {
  display: flex;
  // grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  padding: 18rpx 24rpx calc(18rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 8rpx 24rpx rgba(28, 83, 171, 0.2);
  z-index: 10;
}

.inspection-action {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 120rpx;
  padding: 0 4rpx;
  border-radius: 20rpx;
  background: #f5f8ff;
}

.inspection-action.is-unable {
  border: 2rpx solid $border-color;
  background: #fff;
}

.action-icon {
  @include flex-center;
  width: 32rpx;
  height: 28rpx;
  color: $primary-color;
  font-size: 23rpx;
  font-weight: 700;
  line-height: 28rpx;
}

.inspection-action.is-unable .action-icon {
  color: $info-color;
}

.action-title {
  margin-top: 5rpx;
  color: $primary-color;
  font-size: 26rpx;
  font-weight: 700;
  line-height: 34rpx;
  white-space: nowrap;
}

.action-desc {
  margin-top: 2rpx;
  overflow: hidden;
  color: $text-muted;
  font-size: 20rpx;
  line-height: 26rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.state-view {
  @include flex-center;
  flex: 1;
  color: $info-color;
  font-size: 27rpx;
}

.error-card {
  margin: 24rpx;
  padding: 36rpx 32rpx;
}

.error-title {
  display: block;
  color: $error-color;
  font-size: 30rpx;
  font-weight: 700;
}

.error-desc {
  display: block;
  margin-top: 14rpx;
  color: $info-color;
  font-size: 25rpx;
  line-height: 36rpx;
}

.retry-btn {
  @include flex-center;
  width: 180rpx;
  height: 68rpx;
  margin: 28rpx 0 0;
  border-radius: 34rpx;
  color: #fff;
  font-size: 25rpx;
  background: $primary-color;
}
</style>
