import { computed, reactive, shallowRef } from "vue";
import {
  INPUT_TYPE,
  PHOTO_RULE,
  SUB_ITEM_TYPE,
} from "@/pages/work-order/inspection/constants/inspection";
import type {
  InspectionAiResult,
  InspectionFormItem,
  InspectionTemplate,
  InspectionTemplateGroup,
  InspectionTemplateItem,
  InspectionValidationError,
  SubmitInspectionRequest,
  UploadStatus,
} from "@/modules/work-order/inspection/types";

export function useInspectionForm() {
  const formData = reactive<Record<string, InspectionFormItem>>({});
  const currentTemplate = shallowRef<InspectionTemplate | null>(null);

  const enabledGroups = computed(() =>
    (currentTemplate.value?.groupList || []).map((group) => ({
      ...group,
      itemList: (group.itemList || []).filter(
        (item) => Number(item.enabled) === 1,
      ),
    })),
  );
  const enabledItems = computed(() =>
    enabledGroups.value.flatMap((group) => group.itemList || []),
  );
  const totalProgress = computed(() => ({
    completed: enabledItems.value.filter(
      (item) => formData[String(item.id)]?.completed,
    ).length,
    total: enabledItems.value.length,
  }));

  function initialize(template: InspectionTemplate) {
    const groupList = template?.groupList?.filter(
      (group) => (group.itemList || []).length > 0,
    );
    currentTemplate.value = {
      ...template,
      groupList: groupList || [],
    };
    Object.keys(formData).forEach((key) => delete formData[key]);

    enabledGroups.value.forEach((group) =>
      (group.itemList || []).forEach((item) => {
        const itemId = String(item.id);
        formData[itemId] = {
          groupId: String(group.id),
          itemId,
          inputType: String(item.inputType),
          selectedSubItemIds: [],
          inputValue: "",
          remark: "",
          selectedDisposalMeasures: [],
          photos: [],
          aiDetectedSubItemIds: [],
          aiCheckStatus: "idle",
          aiSuggestedSubItemIds: [],
          aiSuggestionPending: false,
          manuallyEdited: false,
          completed: false,
        };
        updateCompleted(item);
      }),
    );
  }

  // 更新表单完成状态
  function updateCompleted(item: InspectionTemplateItem) {
    const state = formData[String(item.id)];
    if (!state) return;
    const type = String(item.inputType);
    const inputCompleted =
      type === INPUT_TYPE.RADIO
        ? state.selectedSubItemIds.length === 1
        : type === INPUT_TYPE.CHECKBOX
          ? state.selectedSubItemIds.length > 0
          : state.inputValue.trim().length > 0;
    const photoCompleted =
      !isPhotoRequired(item, state) ||
      state.photos.some((photo) => photo.uploadStatus === "success");
    state.completed = inputCompleted && photoCompleted;
  }

  /** 必拍始终要求照片；异常必拍仅在选中隐患项后要求照片。 */
  function isPhotoRequired(
    item: InspectionTemplateItem,
    state: InspectionFormItem,
  ) {
    const rule = String(item.photoRule);
    if (rule === PHOTO_RULE.REQUIRED) return true;
    if (rule !== PHOTO_RULE.ABNORMAL_REQUIRED) return false;
    const dangerIds = new Set(
      (item.subItemList || [])
        .filter(
          (subItem) =>
            Number(subItem.enabled) === 1 &&
            String(subItem.subItemType) === SUB_ITEM_TYPE.DANGER,
        )
        .map((subItem) => String(subItem.id)),
    );
    return state.selectedSubItemIds.some((id) => dangerIds.has(id));
  }
  function getGroupProgress(group: InspectionTemplateGroup) {
    const items = (group.itemList || []).filter(
      (item) => Number(item.enabled) === 1,
    );
    return {
      completed: items.filter((item) => formData[String(item.id)]?.completed)
        .length,
      total: items.length,
    };
  }

  function applyAiResult(
    item: InspectionTemplateItem,
    result: InspectionAiResult,
  ) {
    const state = formData[String(item.id)];
    if (!state) return;
    const allowed = new Set(
      (item.subItemList || [])
        .filter((x) => Number(x.enabled) === 1)
        .map((x) => String(x.id)),
    );
    const detected = [
      ...new Set(
        (result.detectedSubItemIds || [])
          .map(String)
          .filter((id) => allowed.has(id)),
      ),
    ];
    state.aiResult = result.result;
    state.aiSuggestion = result.suggestion;
    state.aiDetectedSubItemIds = detected;
    state.aiConfidence = result.confidence;
    state.aiRawData = result.rawData;
    state.selectedSubItemIds =
      String(item.inputType) === INPUT_TYPE.RADIO
        ? detected.slice(0, 1)
        : detected;
    if (result.inputValue !== undefined)
      state.inputValue = String(result.inputValue);
    updateCompleted(item);
  }

  function validate(): InspectionValidationError | null {
    for (const group of enabledGroups.value)
      for (const item of group.itemList || []) {
        const state = formData[String(item.id)];
        const fail = (message: string) => ({
          groupId: String(group.id),
          itemId: String(item.id),
          message,
        });
        if (!state) return fail(`请完成“${item.itemName}”`);
        if (state.photos.some((p) => p.uploadStatus === "uploading"))
          return fail(`“${item.itemName}”照片正在上传，请稍候`);
        if (state.photos.some((p) => p.uploadStatus === "failed"))
          return fail(`“${item.itemName}”存在上传失败的照片`);
        if (
          String(item.inputType) === INPUT_TYPE.RADIO &&
          state.selectedSubItemIds.length > 1
        )
          return fail(`“${item.itemName}”只能选择一项`);
        if (
          new Set(state.selectedSubItemIds).size !==
          state.selectedSubItemIds.length
        )
          return fail(`“${item.itemName}”存在重复选项`);
        const allowed = new Set(
          (item.subItemList || [])
            .filter((x) => Number(x.enabled) === 1)
            .map((x) => String(x.id)),
        );
        if (state.selectedSubItemIds.some((id) => !allowed.has(id)))
          return fail(`“${item.itemName}”包含无效选项`);
        if (
          isPhotoRequired(item, state) &&
          !state.photos.some((p) => p.uploadStatus === "success")
        )
          return fail(`请为“${item.itemName}”上传照片`);
        if (!state.completed) return fail(`请完成“${item.itemName}”`);
      }
    return null;
  }

  function buildSubmitRequest(
    base: Omit<SubmitInspectionRequest, "groupResults">,
  ): SubmitInspectionRequest {
    return {
      ...base,
      groupResults: enabledGroups.value.map((group) => ({
        groupId: String(group.id),
        groupName: group.groupName,
        itemResults: (group.itemList || []).map((item) => {
          const state = formData[String(item.id)];
          return {
            itemId: String(item.id),
            itemName: item.itemName,
            inputType: String(item.inputType),
            selectedSubItemIds: [...state.selectedSubItemIds],
            inputValue: state.inputValue.trim(),
            ...(state.remark.trim() ? { remark: state.remark.trim() } : {}),
            photoList: state.photos
              .filter(
                (photo) => photo.uploadStatus === "success" && photo.fileId,
              )
              .map((photo) => ({
                fileId: photo.fileId!,
                fileUrl: photo.fileUrl,
                aiResult: photo.aiResult,
              })),
            aiSuggestion: state.aiSuggestion,
            selectedDisposalMeasures: [...state.selectedDisposalMeasures],
          };
        }),
      })),
    };
  }

  return {
    formData,
    enabledGroups,
    totalProgress,
    initialize,
    updateCompleted,
    getGroupProgress,
    applyAiResult,
    validate,
    buildSubmitRequest,
  };
}
