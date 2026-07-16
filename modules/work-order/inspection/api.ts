import { request } from "@/utils/request";
import { uploadFilesApi } from "@/modules/common/api";
import { FILE_UPLOAD_TYPE } from "@/modules/common/types";
import type {
  InspectionPhoto,
  SubmitInspectionRequest,
  SubmitInspectionResponse,
  UploadedInspectionFile,
} from "@/modules/work-order/inspection/types";

// 提交安检工单
export function submitInspectionRecordApi(data: SubmitInspectionRequest) {
  return request<SubmitInspectionResponse, SubmitInspectionRequest>({
    url: "/inspection/app/workOrder/v0.2/submit",
    method: "POST",
    data,
  });
}

/** 安检拍照上传适配层，统一调用公共批量文件上传接口。 */
export async function uploadInspectionPhoto(
  photo: InspectionPhoto,
): Promise<UploadedInspectionFile> {
  if (!photo.localPath) throw new Error("本地图片不存在");
  const files = await uploadFilesApi(
    [photo.localPath],
    FILE_UPLOAD_TYPE.INSPECTION_IMAGE,
  );
  const uploaded = files[0];
  if (!uploaded?.fileId) throw new Error("图片上传结果为空");
  return { fileId: uploaded.fileId, fileUrl: uploaded.url };
}
