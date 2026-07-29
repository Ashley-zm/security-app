<template>
  <view class="history-detail-page">
    <AppNavbar title="安检记录详情" show-back />

    <view v-if="loading" class="state-view">
      <uni-load-more
        status="loading"
        color="#1677FF"
        content-text="详情加载中..."
      />
    </view>
    <view v-else-if="error" class="state-card">
      <text class="state-title">安检详情加载失败</text>
      <text class="state-desc">{{ error }}</text>
      <button class="retry-btn" @click="loadDetail">重新加载</button>
    </view>
    <scroll-view v-else-if="detail" class="detail-scroll" scroll-y>
      <view class="detail-content">
        <view class="summary-card">
          <view class="summary-head">
            <view>
              <text class="record-label">安检结果</text>
              <text class="record-no">{{ displayValue(detail.recordNo) }}</text>
            </view>
            <text class="result-tag" :class="resultClass">
              {{ resultText }}
            </text>
          </view>
          <view class="summary-divider" />
          <view v-for="row in summaryRows" :key="row.label" class="info-row">
            <text class="info-label">{{ row.label }}</text>
            <text class="info-value">{{ row.value }}</text>
          </view>
        </view>

        <view v-if="isUnableInspection" class="section-block">
          <text class="section-title">无法安检信息</text>
          <view class="content-card">
            <view class="info-row">
              <text class="info-label">安检结果</text>
              <text class="info-value">{{ unableReasonText }}</text>
            </view>
            <view class="info-row top-aligned">
              <text class="info-label">备注</text>
              <text class="info-value multiline">{{
                displayValue(detail.remark)
              }}</text>
            </view>
            <view v-if="unablePhotos.length" class="photo-block">
              <text class="field-title">现场照片</text>
              <view class="photo-grid">
                <image
                  v-for="photo in unablePhotos"
                  :key="photo.key"
                  class="photo"
                  :src="photo.url"
                  mode="aspectFill"
                  @click="previewPhotos(unablePhotos, photo.url)"
                />
              </view>
            </view>
          </view>
        </view>

        <view v-else class="section-block">
          <text class="section-title">检查结果</text>
          <view v-if="groups.length" class="group-list">
            <view
              v-for="group in groups"
              :key="group.groupId"
              class="group-block"
            >
              <view class="group-title-row">
                <text class="group-title">
                  {{ group.groupName || "未命名分组" }}
                </text>
                <text class="group-count">
                  {{ group.itemResults.length }} 项
                </text>
              </view>
              <view class="item-list">
                <view
                  v-for="item in group.itemResults"
                  :key="item.itemId"
                  class="item-card"
                >
                  <view class="item-head">
                    <view class="item-icon-wrap">
                      <image
                        class="item-icon"
                        src="/static/images/item.png"
                        mode="aspectFit"
                      />
                    </view>
                    <view class="item-title-wrap">
                      <text class="item-title">
                        {{ item.itemName || "未命名检查项" }}
                      </text>
                      <text class="item-type">{{
                        getInputTypeText(item.inputType)
                      }}</text>
                    </view>
                  </view>

                  <view
                    v-if="item.selectedSubItemIds?.length"
                    class="field-block"
                  >
                    <text class="field-title">检查选项</text>
                    <view class="tag-list">
                      <text
                        v-for="option in getSubItemListByGroupId(
                          group.groupId,
                          item.itemId,
                        )"
                        :key="option.id"
                        :class="[
                          'value-tag',
                          {
                            'selected-tag': item.selectedSubItemIds?.includes(
                              option.id,
                            ),
                          },
                        ]"
                      >
                        {{ option.subItemName || "未命名检查项" }}
                      </text>
                    </view>
                  </view>
                  <view v-if="hasValue(item.inputValue)" class="field-block">
                    <text class="field-title">填写结果</text>
                    <text class="field-value">
                      {{ item.inputValue }}
                    </text>
                  </view>
                  <view v-if="hasValue(item.remark)" class="field-block">
                    <text class="field-title">备注</text>
                    <text class="field-value">{{ item.remark }}</text>
                  </view>
                  <view
                    v-if="item.selectedDisposalMeasures?.length"
                    class="field-block"
                  >
                    <text class="field-title">处置措施</text>
                    <view class="tag-list">
                      <text
                        v-for="measure in getDisposalTexts(item)"
                        :key="measure"
                        class="value-tag disposal-tag"
                        >{{ measure }}</text
                      >
                    </view>
                  </view>
                  <view v-if="getItemPhotos(item).length" class="field-block">
                    <text class="field-title">安检照片</text>
                    <view class="photo-grid">
                      <image
                        v-for="photo in getItemPhotos(item)"
                        :key="photo.key"
                        class="photo"
                        :src="photo.url"
                        mode="aspectFill"
                        @click="previewPhotos(getItemPhotos(item), photo.url)"
                      />
                    </view>
                  </view>
                  <view v-if="hasValue(item.aiSuggestion)" class="ai-card">
                    <text class="ai-title">AI 建议</text>
                    <text class="ai-content">{{ item.aiSuggestion }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
          <view v-else class="empty-card">暂无检查项目明细</view>
        </view>

        <view v-if="detail.signatureUrl" class="section-block">
          <text class="section-title">用户签名</text>
          <view class="signature-card">
            <image
              class="signature-image"
              :src="FILE_URL + detail.signatureUrl"
              mode="aspectFit"
              @click="previewSignature"
            />
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import AppNavbar from "@/components/AppNavbar.vue";
import { getInspectionHistoryDetailApi } from "@/modules/work-order/inspection/api";
import type {
  InspectionHistoryDetail,
  InspectionHistoryItemDetail,
  UploadedInspectionFile,
} from "@/modules/work-order/inspection/types";
import { INSPECTION_ACTIONS } from "@/pages/work-order/inspection/constants/inspection";
import type { DictDataVO } from "@/modules/common/types";
import { getDictLabelByValue, getDictsByTypes } from "@/utils/common";
import { FILE_URL } from "@/utils/request";

const workOrderUserId = ref("");
const recordId = ref("");
const loading = ref(false);
const error = ref("");
const detail = ref<InspectionHistoryDetail | null>(null);
const dictionaries = reactive<Record<string, DictDataVO[]>>({
  input_type: [],
  disposal_measures: [],
});

const groups = computed(() =>
  (detail.value?.groupResults || []).map((group) => ({
    ...group,
    groupId: String(group.groupId),
    itemResults: group.itemResults || [],
  })),
);
const isUnableInspection = computed(
  () =>
    detail.value?.inspectionMode === INSPECTION_ACTIONS.UNABLE.mode ||
    hasValue(detail.value?.unableReason),
);
const resultText = computed(() => {
  const value = String(detail.value?.inspectionResult ?? "");
  return { "1": "合格", "2": "不合格", "3": "无法安检" }[value] || "--";
});
const resultClass = computed(() => {
  const value = String(detail.value?.inspectionResult ?? "");
  return value === "1"
    ? "is-passed"
    : value === "2"
      ? "is-failed"
      : "is-unable";
});
const inspectionModeText = computed(() => {
  return (
    Object.values(INSPECTION_ACTIONS).find(
      (action) => action.mode === detail.value?.inspectionMode,
    )?.label || "--"
  );
});
const unableReasonText = computed(
  () =>
    ({ "1": "到访不遇", "2": "拒绝安检" })[
      String(detail.value?.unableReason ?? "")
    ] || displayValue(detail.value?.unableReason),
);
const summaryRows = computed(() => [
  {
    label: "用户姓名",
    value: displayValue(detail.value?.householdName || detail.value?.userName),
  },
  {
    label: "用户地址",
    value: displayValue(detail.value?.userAddress || detail.value?.address),
  },
  { label: "安检方式", value: inspectionModeText.value },
  { label: "安检人员", value: displayValue(detail.value?.inspectorName) },
  { label: "开始时间", value: displayValue(detail.value?.inspectionStartTime) },
  {
    label: "完成时间",
    value: displayValue(detail.value?.inspectionFinishTime),
  },
  { label: "安检模板", value: displayValue(detail.value?.templateName) },
  { label: "隐患数量", value: displayValue(detail.value?.dangerCount) },
]);
const unablePhotos = computed(() =>
  normalizePhotos(detail.value?.unablePhotoList),
);

onLoad((options) => {
  workOrderUserId.value = decodeURIComponent(
    String(options?.workOrderUserId || ""),
  );
  recordId.value = decodeURIComponent(String(options?.recordId || ""));
  void loadDetail();
});

async function loadDetail() {
  if (!workOrderUserId.value || !recordId.value) {
    error.value = "缺少工单用户 ID 或安检记录 ID";
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    const [result, dictResult] = await Promise.all([
      getInspectionHistoryDetailApi(workOrderUserId.value, recordId.value),
      getDictsByTypes(["input_type", "disposal_measures"]).catch(
        () => ({}) as Record<string, DictDataVO[]>,
      ),
    ]);
    if (!result) throw new Error("安检记录不存在");
    detail.value = result;
    dictionaries.input_type = dictResult.input_type || [];
    dictionaries.disposal_measures = dictResult.disposal_measures || [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : "安检详情加载失败";
  } finally {
    loading.value = false;
  }
}

function getSubItemListByGroupId(groupId: string, itemId: string) {
  return (
    detail.value?.template?.groupList
      ?.find((item) => item.id === groupId)
      ?.itemList?.find((item) => item.id === itemId)?.subItemList || []
  );
}

function displayValue(value?: string | number | null) {
  return hasValue(value) ? String(value) : "--";
}

function hasValue(value: unknown): value is string | number {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function getInputTypeText(value?: string | number) {
  const key = String(value ?? "");
  return (
    getDictLabelByValue(dictionaries.input_type, key) ||
    { "1": "单选", "2": "多选", "3": "输入框" }[key] ||
    "检查项"
  );
}

function getDisposalTexts(item: InspectionHistoryItemDetail) {
  return [
    ...new Set(
      (item.selectedDisposalMeasures || []).map((value) => {
        const key = String(value);
        return getDictLabelByValue(dictionaries.disposal_measures, key) || key;
      }),
    ),
  ];
}

function normalizePhotos(
  photos?: UploadedInspectionFile[],
): { key: string; url: string }[] {
  return (photos || []).map((photo) => ({
    key: photo.fileId || "",
    url: FILE_URL + (photo.fileUrl || ""),
  }));
}

function getItemPhotos(item: InspectionHistoryItemDetail) {
  console.log("item.photoList", item.photoList);

  return normalizePhotos(item.photoList);
}

function previewPhotos(
  photos: { key: string; url: string }[],
  current: string,
) {
  const urls = photos.map((photo) => photo.url);
  if (!urls.length) return;
  uni.previewImage({ current, urls });
}

function previewSignature() {
  if (!detail.value?.signatureUrl) return;
  uni.previewImage({
    current: FILE_URL + detail.value.signatureUrl,
    urls: [FILE_URL + detail.value.signatureUrl],
  });
}
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";
@import "@/styles/mixins.scss";

.history-detail-page {
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
  padding: 24rpx 24rpx calc(40rpx + env(safe-area-inset-bottom));
}
.summary-card,
.content-card,
.item-card,
.empty-card,
.signature-card,
.state-card {
  background: #fff;
  border-radius: $card-radius;
  box-shadow: $shadow-card;
}
.summary-card {
  padding: 30rpx 32rpx;
}
.summary-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
}
.record-label {
  display: block;
  color: $text-main;
  font-size: 32rpx;
  font-weight: 800;
}
.record-no {
  display: block;
  margin-top: 8rpx;
  color: $info-color;
  font-size: 23rpx;
}
.result-tag {
  flex-shrink: 0;
  padding: 10rpx 24rpx;
  border-radius: 30rpx;
  color: #fff;
  font-size: 24rpx;
  font-weight: 700;
}
.result-tag.is-passed {
  background: $success-color;
}
.result-tag.is-failed {
  background: $error-color;
}
.result-tag.is-unable {
  color: $info-color;
  background: $info-bg;
}
.summary-divider {
  height: 2rpx;
  margin: 24rpx 0 16rpx;
  background: #edf1f8;
}
.info-row {
  display: flex;
  align-items: flex-start;
  padding: 9rpx 0;
  font-size: 26rpx;
  line-height: 38rpx;
}
.info-label {
  flex: 0 0 144rpx;
  color: #8b9ab7;
  font-weight: 600;
}
.info-value {
  min-width: 0;
  color: $text-main;
  font-weight: 600;
  word-break: break-all;
}
.info-value.multiline {
  white-space: pre-wrap;
}
.section-block {
  margin-top: 38rpx;
}
.section-title {
  display: block;
  margin: 0 8rpx 18rpx;
  color: $text-main;
  font-size: 30rpx;
  font-weight: 800;
}
.content-card {
  padding: 24rpx 32rpx 30rpx;
}
.group-list,
.item-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.group-block + .group-block {
  margin-top: 16rpx;
}
.group-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 8rpx 16rpx;
}
.group-title {
  color: #173a75;
  font-size: 29rpx;
  font-weight: 800;
}
.group-count {
  color: $primary-color;
  font-size: 23rpx;
}
.item-card {
  padding: 28rpx;
}
.item-head {
  display: flex;
  align-items: center;
  gap: 18rpx;
}
.item-icon-wrap {
  @include flex-center;
  flex: 0 0 66rpx;
  width: 66rpx;
  height: 66rpx;
  border-radius: 18rpx;
  background: #f0efff;
}
.item-icon {
  width: 42rpx;
  height: 42rpx;
}
.item-title-wrap {
  min-width: 0;
}
.item-title {
  display: block;
  color: $text-main;
  font-size: 28rpx;
  font-weight: 800;
  line-height: 40rpx;
}
.item-type {
  display: block;
  margin-top: 3rpx;
  color: $info-color;
  font-size: 22rpx;
}
.field-block,
.photo-block {
  margin-top: 24rpx;
}
.field-title {
  display: block;
  margin-bottom: 12rpx;
  color: #7f8eaa;
  font-size: 23rpx;
  font-weight: 600;
}
.field-value {
  display: block;
  color: $text-main;
  font-size: 26rpx;
  line-height: 40rpx;
  white-space: pre-wrap;
  word-break: break-all;
}
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.value-tag {
  padding: 9rpx 18rpx;
  border-radius: 22rpx;
  color: #31588e;
  font-size: 23rpx;
  background: #edf4ff;
}
.selected-tag {
  color: #fff;
  background: linear-gradient(100deg, #347cf0, #5572e9);
  box-shadow: 0 7rpx 18rpx rgba(54, 116, 225, 0.22);
}
.disposal-tag {
  color: #6d52aa;
  background: #f2edff;
}
.photo-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12rpx;
}
.photo {
  width: 100%;
  height: 142rpx;
  border-radius: 14rpx;
  background: #eef2f8;
}
.ai-card {
  margin-top: 24rpx;
  padding: 20rpx 22rpx;
  border-radius: 16rpx;
  background: #f2edff;
}
.ai-title {
  display: block;
  color: #7456bc;
  font-size: 24rpx;
  font-weight: 800;
}
.ai-content {
  display: block;
  margin-top: 8rpx;
  color: #6d52aa;
  font-size: 24rpx;
  line-height: 36rpx;
}
.signature-card {
  padding: 20rpx;
}
.signature-image {
  width: 100%;
  height: 230rpx;
  border-radius: 12rpx;
  background: #fafbfe;
}
.empty-card {
  padding: 50rpx 20rpx;
  color: $info-color;
  font-size: 25rpx;
  text-align: center;
}
.state-view {
  @include flex-center;
  flex: 1;
}
.state-card {
  margin: 24rpx;
  padding: 38rpx 32rpx;
}
.state-title {
  display: block;
  color: $error-color;
  font-size: 30rpx;
  font-weight: 800;
}
.state-desc {
  display: block;
  margin-top: 12rpx;
  color: $info-color;
  font-size: 25rpx;
}
.retry-btn {
  width: 180rpx;
  height: 68rpx;
  margin: 28rpx 0 0;
  border-radius: 34rpx;
  color: #fff;
  font-size: 25rpx;
  background: $primary-color;
}
.retry-btn::after {
  border: 0;
}
</style>
