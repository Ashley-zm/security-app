export type BusinessId = string;
export type UploadStatus = "pending" | "uploading" | "success" | "failed";

export interface InspectionTemplateSubItem {
  id: string | number;
  subItemName: string;
  subItemType: string;
  dangerType?: string | null;
  dangerLevelName?: string | null;
  enabled: number;
}

export interface InspectionTemplateItem {
  id: string | number;
  itemName: string;
  itemDesc?: string | null;
  checkStandard?: string | null;
  inputType: string;
  photoRule: string;
  maxPhotoCount?: number | null;
  maxInputLength?: number | null;
  detectLabels?: string;
  enabled: number;
  disposalMeasures?: string;
  subItemList?: InspectionTemplateSubItem[];
}

export interface InspectionTemplateGroup {
  id: string | number;
  groupName: string;
  itemList?: InspectionTemplateItem[];
}

export interface InspectionTemplate {
  id: string | number;
  templateName: string;
  templateType: string;
  templateVersion: string;
  groupList?: InspectionTemplateGroup[];
}

export interface InspectionPhoto {
  id: string;
  fileId?: string;
  fileUrl?: string;
  localPath?: string;
  aiResult?: string;
  uploadStatus: UploadStatus;
  errorMessage?: string;
}

export type SignatureUploadStatus = "idle" | "uploading" | "success" | "failed";

export interface InspectionSignature {
  localPath?: string;
  fileId?: string;
  fileUrl?: string;
  uploadStatus: SignatureUploadStatus;
  errorMessage?: string;
  signedAt?: string;
}

export interface InspectionFormItem {
  groupId: string;
  itemId: string;
  inputType: string;
  selectedSubItemIds: string[];
  inputValue: string;
  remark: string;
  selectedDisposalMeasures: string[];
  photos: InspectionPhoto[];
  aiResult?: string;
  aiSuggestion?: string;
  aiDetectedSubItemIds: string[];
  aiConfidence?: number;
  aiRawData?: Record<string, unknown>;
  completed: boolean;
}

export interface InspectionItemResult {
  itemId: string;
  itemName: string;
  inputType: string;
  selectedSubItemIds: string[];
  inputValue: string;
  remark?: string;
  photoList: UploadedInspectionFile[];
  aiSuggestion?: string;
  selectedDisposalMeasures: string[];
}
export interface InspectionGroupResult {
  groupId: string;
  groupName: string;
  itemResults: InspectionItemResult[];
}
export interface SubmitInspectionRequest {
  workOrderUserId: string;
  inspectionMode: string; // 1: AI 安检，2: 人工安检，3: 无法安检
  inspectionStartTime?: string; // 安检开始时间
  inspectionFinishTime?: string; // 安检结束时间
  templateId?: string;
  groupResults?: InspectionGroupResult[];
  signatureFileId?: string; // 签名文件id
  signatureUrl?: string; // 签名文件url
  unableReason?: string; // 无法安检原因:1到访不遇，2拒绝安检
  remark?: string; // 无法安检备注
  unablePhotoList?: UploadedInspectionFile[]; // 无法安检照片列表
}
export interface SubmitInspectionResponse {
  inspectionRecordId: string;
  workOrderId: string;
  status: string;
  dangerCount?: number;
  highestDangerLevel?: string;
}

export interface InspectionHistorySelectedItem {
  id: string | number;
  subItemName?: string;
  itemName?: string;
  dangerLevelName?: string | null;
}

export interface InspectionHistoryItemDetail {
  itemId: string;
  itemName?: string;
  inputType?: string | number;
  selectedSubItemIds?: Array<string | number>;
  selectedSubItems?: InspectionHistorySelectedItem[];
  inputValue?: string | number | null;
  remark?: string | null;
  photoList?: UploadedInspectionFile[];
  aiSuggestion?: string | null;
  selectedDisposalMeasures?: Array<string | number>;
  disposalMeasureNames?: string[];
}

export interface InspectionHistoryGroupDetail {
  groupId: string | number;
  groupName?: string;
  itemResults?: InspectionHistoryItemDetail[];
}

/** 历史安检详情。部分展示字段允许为空，兼容旧版本记录。 */
export interface InspectionHistoryDetail {
  id?: string | number;
  recordId?: string | number;
  recordNo?: string;
  workOrderUserId?: string | number;
  householdName?: string;
  userName?: string;
  userAddress?: string;
  address?: string;
  inspectorName?: string;
  inspectionMode?: string | number;
  inspectionResult?: string | number | null;
  inspectionStartTime?: string | null;
  inspectionFinishTime?: string | null;
  dangerCount?: number | null;
  templateName?: string;
  unableReason?: string | number | null;
  remark?: string | null;
  unablePhotoList?: UploadedInspectionFile[];
  signatureFileId?: string | number;
  signatureUrl?: string;
  groupResults?: InspectionHistoryGroupDetail[];
  template?: InspectionTemplate;
}
export interface InspectionAiResult {
  result?: string;
  suggestion?: string;
  detectedSubItemIds?: Array<string | number>;
  confidence?: number;
  inputValue: string;
  rawData?: Record<string, unknown>;
}
export interface InspectionValidationError {
  groupId: string;
  itemId: string;
  message: string;
}

export interface UploadedInspectionFile {
  fileId: string;
  fileUrl?: string;
  aiResult?: string;
}

export type InspectionAudioStatus =
  | "idle"
  | "starting"
  | "recording"
  | "stopping"
  | "stopped"
  | "uploading"
  | "uploaded"
  | "upload_failed"
  | "error";
