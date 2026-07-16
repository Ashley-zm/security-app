<template>
  <view class="inspection-page">
    <view class="topbar" :style="{ paddingTop: `${statusBarHeight}px` }">
      <view class="topbar-inner">
        <button class="back" @click="requestBack">‹</button>
        <view class="titles">
          <text class="title">AI Agent 安检</text>
          <text class="subtitle">智能识别回填，请确认结果</text>
        </view>
        <button class="manual-btn" @click="switchManual">
          {{
            inspectionMode === INSPECTION_ACTIONS.MANUAL.mode
              ? "人工填写"
              : "切换人工"
          }}
        </button>
      </view>
    </view>

    <view v-if="loading" class="state">
      <u-loading-icon text="模板加载中" />
    </view>
    <view v-else-if="loadError" class="state">
      <text class="state-title">加载失败</text>
      <text class="state-desc">{{ loadError }}</text>
      <button class="state-btn" @click="loadTemplate">重新加载</button>
    </view>
    <view v-else-if="isEmpty" class="state">
      <text class="state-title">暂无安检模板数据</text>
      <button class="state-btn" @click="requestBack">返回</button>
    </view>
    <scroll-view
      v-else
      class="form-scroll"
      scroll-y
      :scroll-into-view="scrollTarget"
      :scroll-with-animation="true"
    >
      <view class="form-content">
        <view class="user-card">
          <text class="user-avatar">
            <image src="/static/tabbar/mine-active.png" class="avatar" />
          </text>
          <view class="user-copy">
            <text class="user-name">{{ userName || "安检用户" }}</text>
            <text class="user-address">{{ address || "暂无地址" }}</text>
          </view>
        </view>
        <!-- 安检项目 -->
        <InspectionGroup
          v-for="group in enabledGroups"
          :key="String(group.id)"
          :group="group"
          :form-data="formData"
          :expanded="expandedGroups[String(group.id)] !== false"
          :progress="getGroupProgress(group)"
          :error-item-id="errorItemId"
          :danger-level-dict="dictionaries.danger_level"
          :disposal-measure-dict="dictionaries.disposal_measures"
          @toggle="toggleGroup(String(group.id))"
          @option-change="onOptionChange"
          @input-change="onInputChange"
          @disposal-change="onDisposalChange"
          @choose-photo="handlePhotoAction"
          @retry-photo="retryPhoto"
          @remove-photo="removePhoto"
        />
        <view class="signature-entry" @click="openSignaturePopup">
          <view class="signature-entry-head">
            <view>
              <text class="signature-entry-title">用户签名</text>
              <text class="signature-entry-desc">
                请用户本人确认本次安检结果
              </text>
            </view>
            <text
              class="signature-entry-status"
              :class="{
                success: signature.uploadStatus === 'success',
                error: signature.uploadStatus === 'failed',
              }"
            >
              {{ signatureStatusText }}
            </text>
          </view>
          <view v-if="signaturePreview" class="signature-preview-wrap">
            <image
              class="signature-preview"
              :src="signaturePreview"
              mode="aspectFit"
            />
            <text class="resign-tip">点击重新签名</text>
          </view>
          <view v-else class="signature-empty">
            <text class="signature-empty-icon">✎</text>
            <text class="signature-empty-text">提交前需要完成用户签名</text>
            <text class="signature-empty-action">去签名 ›</text>
          </view>
        </view>
      </view>
    </scroll-view>
    <!-- 无法安检弹窗 -->
    <InspectionPhotoPopup
      :visible="photoPopupVisible"
      :item-name="photoPopupItem?.itemName || ''"
      :photos="popupPhotos"
      :remark="popupRemark"
      :can-continue="popupCanContinue"
      :deleting-photo-ids="deletingPhotoIds"
      @capture="captureFromPopup"
      @remove="removePopupPhoto"
      @retry="retryPopupPhoto"
      @remark-change="updateItemRemark"
      @cancel="cancelPhotoPopup"
      @confirm="confirmPhotoPopup"
    />
    <!-- 用户签名弹窗 -->
    <InspectionSignaturePopup
      :visible="signaturePopupVisible"
      :user-name="userName"
      :address="address"
      :confirm-loading="signatureUploading"
      @cancel="closeSignaturePopup"
      @confirm="confirmSignature"
    />
    <!-- 安检录音弹窗 -->
    <InspectionAudioFloat
      v-if="workOrderUserId"
      :status="audioStatus"
      :duration="audioDuration"
      :error-message="audioErrorMessage"
    />
    <view v-if="!loading && !isEmpty && !loadError" class="submit-bar">
      <button
        class="submit-btn"
        :loading="submitting"
        :disabled="submitting"
        @click="submit"
      >
        {{ submitButtonText }}
      </button>
      <text class="progress-text">
        智能记录 {{ totalProgress.completed }}/{{ totalProgress.total }} 项
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from "vue";
import { onBackPress, onLoad } from "@dcloudio/uni-app";
import InspectionGroup from "@/pages/work-order/inspection/components/InspectionGroup.vue";
import InspectionPhotoPopup from "@/pages/work-order/inspection/components/InspectionPhotoPopup.vue";
import InspectionSignaturePopup from "@/pages/work-order/inspection/components/InspectionSignaturePopup.vue";
import InspectionAudioFloat from "@/pages/work-order/inspection/components/InspectionAudioFloat.vue";
import {
  normalizeMaxPhotoCount,
  INSPECTION_ACTIONS,
} from "@/pages/work-order/inspection/constants/inspection";
import { useInspectionForm } from "@/pages/work-order/inspection/composables/useInspectionForm";
import { useInspectionDictionaries } from "@/pages/work-order/inspection/composables/useInspectionDictionaries";
import { useInspectionAudioRecorder } from "@/pages/work-order/inspection/composables/useInspectionAudioRecorder";
import { captureInspectionPhotos } from "@/pages/work-order/inspection/composables/useInspectionCamera";
import { getWorkOrderUserDetailApi } from "@/modules/work-order/api";
import { deleteFileApi, uploadFilesApi } from "@/modules/common/api";
import { FILE_UPLOAD_TYPE } from "@/modules/common/types";
import {
  submitInspectionRecordApi,
  uploadInspectionPhoto,
} from "@/modules/work-order/inspection/api";
import { useInspectionStore } from "@/stores/inspection";
import type {
  InspectionPhoto,
  InspectionSignature,
  InspectionTemplate,
  InspectionTemplateItem,
} from "@/modules/work-order/inspection/types";

const store = useInspectionStore();
const { dictionaries, loadInspectionDictionaries } =
  useInspectionDictionaries();
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 0;
const workOrderId = ref("");
const workOrderUserId = ref("");
const userName = ref("");
const address = ref("");
const template = ref<InspectionTemplate | null>(null);
const loading = ref(true);
const loadError = ref("");
const submitting = ref(false);
const inspectionSubmittedToServer = ref(false);
const inspectionMode = ref<string>(INSPECTION_ACTIONS.AI.mode);
const expandedGroups = reactive<Record<string, boolean>>({});
const scrollTarget = ref("");
const errorItemId = ref("");
const dirty = ref(false);
const submitted = ref(false);
const navigatingBack = ref(false);
const photoPopupVisible = ref(false);
const cameraOpening = ref(false);
const deletingPhotoIds = ref<string[]>([]);
const signaturePopupVisible = ref(false);
const signatureUploading = ref(false);
const signature = reactive<InspectionSignature>({
  uploadStatus: "idle",
});
const photoPopupItem = ref<InspectionTemplateItem | null>(null);
let photoPopupSnapshot: InspectionPhoto[] = [];
let photoPopupRemarkSnapshot = "";
let photoPopupDirtySnapshot = false;
let highlightTimer: ReturnType<typeof setTimeout> | undefined;
const {
  formData,
  enabledGroups,
  totalProgress,
  initialize,
  updateCompleted,
  getGroupProgress,
  validate,
  buildSubmitRequest,
} = useInspectionForm();
const {
  status: audioStatus,
  duration: audioDuration,
  uploadedFile: uploadedAudioFile,
  errorMessage: audioErrorMessage,
  startRecording,
  stopRecording,
  uploadRecording,
  stopForPageClose,
  dispose: disposeAudioRecorder,
} = useInspectionAudioRecorder();
const popupPhotos = computed(() => {
  const item = photoPopupItem.value;
  return item ? formData[String(item.id)]?.photos || [] : [];
});
const popupRemark = computed(() => {
  const item = photoPopupItem.value;
  return item ? formData[String(item.id)]?.remark || "" : "";
});
const popupCanContinue = computed(() => {
  const item = photoPopupItem.value;
  return Boolean(
    item &&
    popupPhotos.value.length < normalizeMaxPhotoCount(item.maxPhotoCount),
  );
});
const signaturePreview = computed(
  () => signature.localPath || signature.fileUrl || "",
);
const signatureStatusText = computed(() => {
  if (signatureUploading.value) return "上传中";
  if (signature.uploadStatus === "success") return "已签名";
  if (signature.uploadStatus === "failed") return "上传失败";
  return "未签名";
});
const submitButtonText = computed(() => {
  if (submitting.value) return "正在提交...";
  if (inspectionSubmittedToServer.value && !uploadedAudioFile.value?.fileId) {
    return "重试上传录音";
  }
  return signature.fileId ? "确认并提交" : "提交安检结果";
});
const isEmpty = computed(
  () =>
    !template.value ||
    !(template.value.groupList || []).length ||
    totalProgress.value.total === 0,
);

onLoad((options) => {
  workOrderUserId.value = decodeURIComponent(options?.workOrderUserId || "");
  inspectionMode.value = options?.inspectionMode;
  void startRecording(workOrderUserId.value);
  loadTemplate();
});
onBackPress(() => {
  if (signaturePopupVisible.value) {
    if (signatureUploading.value) {
      uni.showToast({ title: "签名正在上传，请稍候", icon: "none" });
    } else {
      closeSignaturePopup();
    }
    return true;
  }
  if (photoPopupVisible.value) {
    cancelPhotoPopup();
    return true;
  }
  if (navigatingBack.value) return false;
  requestBack();
  return true;
});
onBeforeUnmount(() => {
  if (highlightTimer) clearTimeout(highlightTimer);
  disposeAudioRecorder();
});
// 加载安检模板
async function loadTemplate() {
  loading.value = true;
  loadError.value = "";
  try {
    await loadInspectionDictionaries();
    const cached = store.detail;
    const detail =
      cached && String(cached.workOrderUser.id) === workOrderUserId.value
        ? cached
        : await getWorkOrderUserDetailApi(workOrderUserId.value);
    if (!detail.template) {
      template.value = null;
      return;
    }
    template.value = detail.template as InspectionTemplate;
    workOrderId.value = String(detail.workOrder.id);
    userName.value = detail.workOrderUser.householdName || "";
    address.value = detail.workOrderUser.userAddress || "";
    initialize(template.value);
    (template.value.groupList || []).forEach((group) => {
      expandedGroups[String(group.id)] = true;
    });
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : "安检模板加载失败";
  } finally {
    loading.value = false;
  }
}
// 分组展开/收起
function toggleGroup(id: string) {
  expandedGroups[id] = expandedGroups[id] === false;
}
// 选项改变
function onOptionChange(item: InspectionTemplateItem, value: string[]) {
  formData[String(item.id)].selectedSubItemIds = [...value];
  updateCompleted(item);
  dirty.value = true;
}
// 输入框值改变
function onInputChange(item: InspectionTemplateItem, value: string) {
  formData[String(item.id)].inputValue = value;
  updateCompleted(item);
  dirty.value = true;
}
// 处置措施改变
function onDisposalChange(item: InspectionTemplateItem, value: string[]) {
  formData[String(item.id)].selectedDisposalMeasures = [...new Set(value)];
  dirty.value = true;
}
// 克隆照片，保留ai识别结果
function clonePhotos(photos: InspectionPhoto[]) {
  return photos.map((photo) => ({
    ...photo,
    aiResult: photo.aiResult || "",
  }));
}
function preparePhotoPopup(item: InspectionTemplateItem) {
  const state = formData[String(item.id)];
  photoPopupItem.value = item;
  photoPopupSnapshot = clonePhotos(state.photos);
  photoPopupRemarkSnapshot = state.remark;
  photoPopupDirtySnapshot = dirty.value;
}

// 照片操作
function handlePhotoAction(item: InspectionTemplateItem) {
  const state = formData[String(item.id)];
  preparePhotoPopup(item);
  if (!state.photos.length) {
    void capturePhoto(item);
    return;
  }
  photoPopupVisible.value = true;
}

// 关闭照片弹窗
function closePhotoPopup() {
  photoPopupVisible.value = false;
  photoPopupItem.value = null;
  photoPopupSnapshot = [];
  photoPopupRemarkSnapshot = "";
}
// 取消照片弹窗
function cancelPhotoPopup() {
  const item = photoPopupItem.value;
  if (item) {
    formData[String(item.id)].photos = clonePhotos(photoPopupSnapshot);
    formData[String(item.id)].remark = photoPopupRemarkSnapshot;
    updateCompleted(item);
    dirty.value = photoPopupDirtySnapshot;
  }
  closePhotoPopup();
}
// 确认照片弹窗
function confirmPhotoPopup() {
  const item = photoPopupItem.value;
  if (!item) {
    closePhotoPopup();
    return;
  }

  const state = formData[String(item.id)];
  const pendingPhotos = state.photos.filter(
    (photo) => photo.uploadStatus === "pending",
  );
  updateCompleted(item);
  closePhotoPopup();
  // 本次拍摄内容只有确认后才上传保存。
  if (pendingPhotos.length) enqueuePhotoUploads(item, pendingPhotos);
  console.log("确认照片弹窗", item, state);
}

// 拍照照片
function captureFromPopup() {
  const item = photoPopupItem.value;
  if (item) capturePhoto(item);
}
// 删除照片
function removePopupPhoto(photoId: string) {
  const item = photoPopupItem.value;
  if (item) void removePhoto(item, photoId);
}
// 重试照片
function retryPopupPhoto(photoId: string) {
  const item = photoPopupItem.value;
  if (item) retryPhoto(item, photoId);
}
// 更新备注
function updateItemRemark(value: string) {
  const item = photoPopupItem.value;
  if (!item) return;
  formData[String(item.id)].remark = value;
  dirty.value = true;
}
// 拍照照片
async function capturePhoto(item: InspectionTemplateItem) {
  if (cameraOpening.value) return;
  const state = formData[String(item.id)];
  const remain =
    normalizeMaxPhotoCount(item.maxPhotoCount) - state.photos.length;
  if (remain <= 0) {
    uni.showToast({
      title: `最多上传 ${normalizeMaxPhotoCount(item.maxPhotoCount)} 张照片`,
      icon: "none",
    });
    return;
  }

  cameraOpening.value = true;
  try {
    const selectedPaths = await captureInspectionPhotos(
      inspectionMode.value,
      item.detectLabels,
    );
    const uniqueResults = [
      ...new Map(
        selectedPaths
          .filter(
            (result) =>
              Boolean(result.path) &&
              !state.photos.some((photo) => photo.localPath === result.path),
          )
          .map((result) => [result.path, result]),
      ).values(),
    ].slice(0, remain);
    const photos = uniqueResults.map<InspectionPhoto>((result) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      localPath: result.path,
      aiResult: result.aiResult,
      uploadStatus: "pending",
    }));

    if (photos.length) {
      // 新照片先作为弹框草稿保存，用户确认前不调用上传接口。
      state.photos.push(...photos);
      dirty.value = true;
      if (
        !photoPopupItem.value ||
        String(photoPopupItem.value.id) !== String(item.id)
      ) {
        preparePhotoPopup(item);
      }
      photoPopupVisible.value = true;
    } else if (!photoPopupVisible.value && !state.photos.length) {
      closePhotoPopup();
    }
  } catch (error) {
    if (!photoPopupVisible.value && !state.photos.length) closePhotoPopup();
    uni.showToast({
      title: error instanceof Error ? error.message : "拍照失败，请重试",
      icon: "none",
    });
  } finally {
    cameraOpening.value = false;
  }
}

function enqueuePhotoUploads(
  item: InspectionTemplateItem,
  photos: InspectionPhoto[],
) {
  // 每张图片独立请求，Promise.all 并行上传以缩短整体等待时间。
  Promise.all(photos.map((photo) => uploadPhoto(item, photo))).then(() => {
    console.log("所有照片上传完成", item);
    const state = formData[String(item.id)];
    // 模拟ai建议数据
    state.aiSuggestion = "模拟ai建议数据，重大风险，需上报燃气公司维修整改！";
    updateCompleted(item);
  });
}

// 上传照片
async function uploadPhoto(
  item: InspectionTemplateItem,
  photo: InspectionPhoto,
) {
  const state = formData[String(item.id)];
  const target = state.photos.find((current) => current.id === photo.id);
  if (!target) return;
  if (target.uploadStatus === "uploading" || target.uploadStatus === "success")
    return;

  target.uploadStatus = "uploading";
  target.errorMessage = undefined;
  try {
    const result = await uploadInspectionPhoto(target);
    target.fileId = result.fileId;
    target.fileUrl = result.fileUrl;
    target.uploadStatus = "success";
  } catch (error) {
    target.uploadStatus = "failed";
    target.errorMessage = error instanceof Error ? error.message : "上传失败";
  } finally {
    updateCompleted(item);
  }
}

// 重试上传照片
function retryPhoto(item: InspectionTemplateItem, id: string) {
  const photo = formData[String(item.id)].photos.find((x) => x.id === id);
  if (photo) uploadPhoto(item, photo);
}
function setPhotoDeleting(photoId: string, deleting: boolean) {
  deletingPhotoIds.value = deleting
    ? [...new Set([...deletingPhotoIds.value, photoId])]
    : deletingPhotoIds.value.filter((id) => id !== photoId);
}

// 删除照片：服务器文件删除成功后，才同步移除前端状态。
async function removePhoto(item: InspectionTemplateItem, id: string) {
  const state = formData[String(item.id)];
  const photo = state.photos.find((current) => current.id === id);
  if (!photo || deletingPhotoIds.value.includes(id)) return;

  if (photo.uploadStatus === "uploading") {
    uni.showToast({ title: "照片正在上传，请稍候再删除", icon: "none" });
    return;
  }

  const fileId = String(photo.fileId || "").trim();
  if (fileId) {
    setPhotoDeleting(id, true);
    try {
      await deleteFileApi(fileId);
      // 服务端删除不可撤销，弹窗取消时也不能恢复该照片。
      photoPopupSnapshot = photoPopupSnapshot.filter(
        (current) => current.id !== id,
      );
    } catch {
      // request 封装会展示后端错误；删除失败时保留照片，允许用户重试。
      return;
    } finally {
      setPhotoDeleting(id, false);
    }
  }

  state.photos = state.photos.filter((current) => current.id !== id);
  updateCompleted(item);
  dirty.value = true;
}
function openSignaturePopup() {
  if (submitting.value || signatureUploading.value) return;
  signaturePopupVisible.value = true;
}

function closeSignaturePopup() {
  if (signatureUploading.value) return;
  signaturePopupVisible.value = false;
}

async function confirmSignature(localPath: string) {
  if (!localPath || signatureUploading.value) return;
  const previousFileId = String(signature.fileId || "").trim();
  const hadUploadedSignature = Boolean(previousFileId);
  const previousSignature = { ...signature };
  signatureUploading.value = true;
  signature.uploadStatus = "uploading";
  signature.errorMessage = undefined;
  try {
    const files = await uploadFilesApi([localPath], FILE_UPLOAD_TYPE.SIGNATURE);
    const uploaded = files[0];
    if (!uploaded?.fileId) throw new Error("签名上传结果为空");

    const newFileId = String(uploaded.fileId);
    signature.localPath = localPath;
    signature.fileId = newFileId;
    signature.fileUrl = uploaded.url;
    signature.uploadStatus = "success";
    signature.signedAt = new Date().toISOString();
    signaturePopupVisible.value = false;
    dirty.value = true;

    let previousDeleteFailed = false;
    if (previousFileId && previousFileId !== newFileId) {
      try {
        // 新签名保存成功后再删除旧文件，避免删除成功但新签名上传失败。
        await deleteFileApi(previousFileId);
      } catch {
        previousDeleteFailed = true;
        signature.errorMessage = "旧签名文件删除失败";
      }
    }

    uni.showToast({
      title: previousDeleteFailed
        ? "新签名已保存，旧签名删除失败"
        : "签名保存成功",
      icon: previousDeleteFailed ? "none" : "success",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "签名上传失败";
    if (hadUploadedSignature) {
      Object.assign(signature, previousSignature, {
        uploadStatus: "success",
        errorMessage: message,
      });
    } else {
      signature.localPath = localPath;
      signature.uploadStatus = "failed";
      signature.errorMessage = message;
    }
    uni.showToast({ title: message, icon: "none" });
  } finally {
    signatureUploading.value = false;
  }
}
// 切换人工填写
function switchManual() {
  if (inspectionMode.value === INSPECTION_ACTIONS.MANUAL.mode) return;
  uni.showModal({
    title: "切换人工填写",
    content: "切换人工填写后，AI 自动回填结果将保留，您可以手动修改。",
    success: (result) => {
      if (result.confirm) {
        inspectionMode.value = INSPECTION_ACTIONS.MANUAL.mode;
        dirty.value = true;
      }
    },
  });
}
// 提交安检结果
async function submit() {
  if (submitting.value) return;
  if (!template.value || !(template.value.groupList || []).length) {
    uni.showToast({ title: "暂无安检模板数据", icon: "none" });
    return;
  }
  if (!workOrderUserId.value || !String(template.value.id)) {
    uni.showToast({ title: "缺少工单、用户或模板参数", icon: "none" });
    return;
  }
  const error = validate();
  if (error) {
    focusError(error.groupId, error.itemId);
    uni.showToast({ title: error.message, icon: "none" });
    return;
  }
  if (signatureUploading.value) {
    uni.showToast({ title: "用户签名正在上传，请稍候", icon: "none" });
    return;
  }
  if (signature.uploadStatus !== "success" || !signature.fileId) {
    openSignaturePopup();
    return;
  }

  submitting.value = true;
  try {
    // 所有业务校验通过后才结束录音，校验失败不会中断录音。
    await stopRecording();
    const payload = buildSubmitRequest({
      workOrderUserId: workOrderUserId.value,
      templateId: String(template.value.id),
      inspectionMode: inspectionMode.value,
      signatureFileId: signature.fileId,
      signatureUrl: signature.fileUrl,
    });

    // 首次提交并发上传录音和提交安检结果；部分成功后仅重试失败的一方。
    const audioTask = uploadedAudioFile.value?.fileId
      ? Promise.resolve(uploadedAudioFile.value)
      : uploadRecording(workOrderUserId.value);
    const inspectionTask = inspectionSubmittedToServer.value
      ? Promise.resolve()
      : submitInspectionRecordApi(payload).then(() => {
          inspectionSubmittedToServer.value = true;
        });
    const [audioResult, inspectionResult] = await Promise.allSettled([
      audioTask,
      inspectionTask,
    ]);
    const audioSucceeded = audioResult.status === "fulfilled";
    const inspectionSucceeded = inspectionResult.status === "fulfilled";

    if (!audioSucceeded || !inspectionSucceeded) {
      let message = "录音上传及安检结果提交失败，请重试";
      if (inspectionSucceeded && !audioSucceeded) {
        message = "安检结果已提交，录音上传失败，请重新提交";
      } else if (audioSucceeded && !inspectionSucceeded) {
        message = "录音已上传，安检结果提交失败，请重试";
      }
      uni.showToast({ title: message, icon: "none" });
      return;
    }

    submitted.value = true;
    dirty.value = false;
    store.clear();
    uni.$emit("inspection-submitted", {
      workOrderId: workOrderId.value,
    });
    uni.showToast({ title: "提交成功", icon: "success" });
    setTimeout(() => {
      void navigateBackAfterStopping();
    }, 500);
  } catch (error) {
    uni.showToast({
      title:
        error instanceof Error ? error.message : "录音结束失败，暂无法提交",
      icon: "none",
    });
  } finally {
    submitting.value = false;
  }
}
// 聚焦错误项
function focusError(groupId: string, itemId: string) {
  expandedGroups[groupId] = true;
  errorItemId.value = itemId;
  scrollTarget.value = "";
  setTimeout(() => {
    scrollTarget.value = `inspection-item-${itemId}`;
  }, 50);
  if (highlightTimer) clearTimeout(highlightTimer);
  highlightTimer = setTimeout(() => {
    errorItemId.value = "";
  }, 1800);
}
// 页面关闭前自动结束录音，但未提交时不上传录音文件。
async function navigateBackAfterStopping(clearStore = false) {
  if (navigatingBack.value) return;
  navigatingBack.value = true;
  await stopForPageClose();
  if (clearStore) store.clear();
  uni.navigateBack();
}

// 确认退出
function requestBack() {
  if (submitting.value) {
    uni.showToast({ title: "正在提交，请稍候", icon: "none" });
    return;
  }
  if (!dirty.value || submitted.value) {
    void navigateBackAfterStopping();
    return;
  }
  const content = inspectionSubmittedToServer.value
    ? "安检结果已提交，但录音尚未上传，确定退出吗？"
    : "当前安检结果尚未提交，确定退出吗？";
  uni.showModal({
    title: "确认退出",
    content,
    success: (result) => {
      if (result.confirm) {
        void navigateBackAfterStopping(true);
      }
    },
  });
}
</script>

<style scoped lang="scss">
.inspection-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #f2f6fc;
}

.topbar {
  flex: 0 0 auto;
  background: #fff;
  box-shadow: 0 4rpx 18rpx rgba(31, 66, 120, 0.05);
  z-index: 10;
}

.topbar-inner {
  display: flex;
  align-items: center;
  min-height: 108rpx;
  padding: 0 22rpx;
}

.back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 66rpx;
  height: 66rpx;
  padding: 0;
  color: #263a60;
  font-size: 56rpx;
  line-height: 60rpx;
  background: transparent;
}

.back::after,
.manual-btn::after,
.state-btn::after,
.submit-btn::after {
  border: 0;
}

.titles {
  flex: 1;
  min-width: 0;
  margin-left: 8rpx;
}

.title,
.subtitle {
  display: block;
}

.title {
  color: #21375e;
  font-size: 32rpx;
  font-weight: 900;
}

.subtitle {
  margin-top: 4rpx;
  color: #8c9bb6;
  font-size: 21rpx;
}

.manual-btn {
  height: 58rpx;
  padding: 0 20rpx;
  border-radius: 18rpx;
  color: #3475df;
  font-size: 22rpx;
  line-height: 58rpx;
  background: #eaf3ff;
}

.manual-btn[disabled] {
  color: #8392ac;
  background: #eef1f6;
}

.form-scroll {
  flex: 1;
  min-height: 0;
}

.form-content {
  padding: 24rpx 24rpx 240rpx;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 28rpx;
  border-radius: 24rpx;
  background: #e8f2ff;
}

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 64rpx;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  color: #3474df;
  font-size: 32rpx;
  background: #fff;
}

.avatar {
  width: 45rpx;
  height: 45rpx;
  border-radius: 50%;
}

.user-copy {
  flex: 1;
  min-width: 0;
}

.user-name,
.user-address {
  display: block;
}

.user-name {
  color: #24416f;
  font-size: 29rpx;
  font-weight: 800;
}

.user-address {
  margin-top: 6rpx;
  color: #647a9e;
  font-size: 24rpx;
  line-height: 34rpx;
  word-break: break-all;
}

.submit-bar {
  flex: 0 0 auto;
  padding: 18rpx 24rpx calc(18rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -8rpx 30rpx rgba(32, 66, 120, 0.1);
  z-index: 20;
}

.submit-btn {
  height: 86rpx;
  border-radius: 24rpx;
  color: #fff;
  font-size: 29rpx;
  font-weight: 800;
  line-height: 86rpx;
  background: linear-gradient(100deg, #3179ee, #665be5);
}

.submit-btn[disabled] {
  opacity: 0.6;
}

.progress-text {
  display: block;
  margin-top: 10rpx;
  color: #8090aa;
  font-size: 22rpx;
  text-align: center;
}

.state {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50rpx;
  color: #8797b2;
}

.state-title {
  color: #31476d;
  font-size: 30rpx;
  font-weight: 800;
}

.state-desc {
  margin-top: 14rpx;
  font-size: 24rpx;
}

.state-btn {
  width: 210rpx;
  height: 70rpx;
  margin-top: 28rpx;
  border-radius: 35rpx;
  color: #fff;
  font-size: 25rpx;
  line-height: 70rpx;
  background: #3478e8;
}
.signature-entry {
  margin-top: 28rpx;
  padding: 26rpx;
  border: 2rpx solid #e5eaf4;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 8rpx 28rpx rgba(39, 76, 140, 0.06);
}

.signature-entry-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.signature-entry-title,
.signature-entry-desc {
  display: block;
}

.signature-entry-title {
  color: #223b64;
  font-size: 28rpx;
  font-weight: 800;
}

.signature-entry-desc {
  margin-top: 5rpx;
  color: #8a99b1;
  font-size: 21rpx;
}

.signature-entry-status {
  flex: 0 0 auto;
  padding: 7rpx 14rpx;
  border-radius: 12rpx;
  color: #8a97ac;
  font-size: 20rpx;
  background: #f0f3f7;
}

.signature-entry-status.success {
  color: #287d58;
  background: #e8f7ef;
}

.signature-entry-status.error {
  color: #d45663;
  background: #fff0f2;
}

.signature-empty {
  display: flex;
  align-items: center;
  gap: 14rpx;
  min-height: 82rpx;
  margin-top: 20rpx;
  padding: 0 20rpx;
  border: 2rpx dashed #c8d2e2;
  border-radius: 18rpx;
  background: #f8faff;
}

.signature-empty-icon {
  color: #665be5;
  font-size: 36rpx;
}

.signature-empty-text {
  flex: 1;
  color: #70819d;
  font-size: 22rpx;
}

.signature-empty-action {
  color: #3978df;
  font-size: 22rpx;
  font-weight: 700;
}

.signature-preview-wrap {
  position: relative;
  height: 150rpx;
  margin-top: 20rpx;
  overflow: hidden;
  border: 2rpx solid #e4eaf3;
  border-radius: 18rpx;
  background: #fafbfe;
}

.signature-preview {
  width: 100%;
  height: 100%;
}

.resign-tip {
  position: absolute;
  right: 12rpx;
  bottom: 10rpx;
  padding: 5rpx 12rpx;
  border-radius: 10rpx;
  color: #fff;
  font-size: 19rpx;
  background: rgba(37, 55, 89, 0.66);
}
</style>
