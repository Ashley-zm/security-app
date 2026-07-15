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

export interface InspectionPhotoResult {
  fileId: string;
  fileUrl?: string;
}
export interface InspectionItemResult {
  itemId: string;
  itemName: string;
  inputType: string;
  selectedSubItemIds: string[];
  inputValue: string;
  remark?: string;
  photoList: InspectionPhotoResult[];
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
  templateId: string;
  inspectionMode: string; // 1: AI 自动回填，2: 人工填写，3: 手动填写
  groupResults: InspectionGroupResult[];
  signatureFileId?: string; // 签名文件id
  signatureUrl?: string; // 签名文件url
}
export interface SubmitInspectionResponse {
  inspectionRecordId: string;
  workOrderId: string;
  status: string;
  dangerCount?: number;
  highestDangerLevel?: string;
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
