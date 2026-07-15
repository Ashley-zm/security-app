import {
  getRequestTransportConfig,
  request,
  RequestError,
} from "@/utils/request";
import type {
  DictDataVO,
  FileUploadType,
  UploadedFileVO,
  UploadApiResponse,
} from "@/modules/common/types";
// 获取字典数据
export function getDictsApi(dictType: string) {
  return request<DictDataVO[], { dictType: string }>({
    url: "/system/dict/data/type/" + dictType,
    method: "GET",
  });
}

// 批量上传文件
function parseUploadResponse(rawData: string): UploadApiResponse {
  // 防止后端 Long 类型文件 ID 在 JSON.parse 时发生精度丢失。
  const safeData = rawData.replace(/("fileId"\s*:\s*)(\d{16,})/g, '$1"$2"');
  const parsed = JSON.parse(safeData) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("文件上传响应格式错误");
  }
  return parsed as UploadApiResponse;
}

/**
 * 批量上传文件；uploadType 默认为 1（安检图片）\2（录音）\3（签名）。
 * businessId 通用业务关联值；当前仅录音使用uploadType为2时，传工单用户明细id:workOrderUserId
 * */
export function uploadFilesApi(
  filePaths: string[],
  uploadType: FileUploadType = 1,
  businessId?: string,
): Promise<UploadedFileVO[]> {
  const paths = [...new Set(filePaths.filter(Boolean))];
  if (!paths.length) return Promise.reject(new Error("请选择需要上传的文件"));

  const transport = getRequestTransportConfig("/inspection/file/v0.2/upload");
  return new Promise((resolve, reject) => {
    let params: Record<string, string> = {
      uploadType: String(uploadType),
    };
    if (businessId) {
      params["businessId"] = businessId;
    }
    console.log("params", params);
    uni.uploadFile({
      url: transport.url,
      files: paths.map((uri) => ({ name: "files", uri })),
      header: transport.header,
      formData: params,
      timeout: transport.timeout,
      success: (result) => {
        console.log("44444上传成功", result);
        try {
          if (result.statusCode < 200 || result.statusCode >= 300) {
            throw new RequestError("文件上传失败", {
              statusCode: result.statusCode,
              response: result.data,
            });
          }
          const response = parseUploadResponse(result.data);
          if (Number(response.code) !== 200 || !Array.isArray(response.data)) {
            throw new RequestError(
              response.msg || response.message || "文件上传失败",
              { code: Number(response.code) || undefined, response },
            );
          }
          resolve(
            response.data.map((file) => ({
              ...file,
              fileId: String(file.fileId),
              url: String(file.url || ""),
              uploadType: Number(file.uploadType || uploadType),
            })),
          );
        } catch (error) {
          reject(error);
        }
      },
      fail: (error) => reject(new Error(error.errMsg || "文件上传失败")),
    });
  });
}
/** 删除已上传文件。fileId 按字符串处理，避免后端 Long 类型精度丢失。 */
export function deleteFileApi(fileId: string): Promise<void> {
  const normalizedFileId = String(fileId || "").trim();
  if (!normalizedFileId) {
    return Promise.reject(new Error("文件 ID 不能为空"));
  }
  return request<void>({
    url: `/inspection/file/v0.2/${encodeURIComponent(normalizedFileId)}`,
    method: "DELETE",
  });
}
