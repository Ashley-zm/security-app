export type ElTagType = "primary" | "success" | "info" | "warning" | "danger";

export interface DictDataVO {
  dictCode?: string;
  dictLabel: string;
  dictValue: string;
  cssClass?: string;
  listClass?: ElTagType;
  dictSort?: number;
  remark?: string;
}

export interface DictDataOption {
  label: string;
  value: string;
  elTagType?: ElTagType;
  elTagClass?: string;
}
export const FILE_UPLOAD_TYPE = {
  INSPECTION_IMAGE: 1,
  AUDIO: 2,
  USER_AVATAR: 3,
  SIGNATURE: 4,
  QRCODE: 5,
  OTHER: 9,
} as const;

export type FileUploadType =
  (typeof FILE_UPLOAD_TYPE)[keyof typeof FILE_UPLOAD_TYPE];

export interface UploadedFileVO {
  fileId: string;
  url: string;
  uploadType: number;
  uploadTypeName?: string;
  fileName?: string;
  originalName?: string;
  relativePath?: string;
  absolutePath?: string;
  size?: number;
  contentType?: string;
  suffix?: string;
}

export interface UploadApiResponse {
  code?: number;
  msg?: string;
  message?: string;
  data?: Array<Omit<UploadedFileVO, "fileId"> & { fileId: string | number }>;
}
