type NativePluginResult = Record<string, unknown>;
import { INSPECTION_ACTIONS } from "@/pages/work-order/inspection/constants/inspection";
interface AiDetectPlugin {
  startDetect?: (
    options: Record<string, unknown>,
    callback: (result?: NativePluginResult) => void,
  ) => NativePluginResult | void;
}

function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// 从拍照结果中提取图片路径和结果
function getSnapshotPaths(
  result: NativePluginResult,
  detectMode: string,
): any[] {
  const paths: any[] = [];
  const images = Array.isArray(result.images) ? result.images : [];

  images.forEach((image) => {
    if (!image || typeof image !== "object") return;
    const record = image as NativePluginResult;
    const path = getString(record.imagePath) || getString(record.path);
    if (path)
      paths.push({
        path,
        aiResult: getAiResult(record, detectMode),
      });
  });
  if (!images.length && result.imagePath) {
    paths.push({
      path: result.imagePath,
      aiResult: getAiResult(result, detectMode, true),
    });
  }
  return paths;
}
// 模糊->翻拍->对象识别或者直接返回结果
function getAiResult(
  result: NativePluginResult,
  detectMode: string,
  isSingleImage: boolean = false,
): string {
  console.log("getAiResult", result);

  if (detectMode === "photo_only") {
    return "";
  }
  if (isSingleImage) {
    if (result.pipelineStatus === "FUZZY") {
      return "模糊";
    }
    if (result.pipelineStatus === "REMAKE") {
      return "翻拍";
    }
    if (result.pipelineStatus === "NO_TARGET") {
      return "未识别到对象";
    }
    return "合规";
  }
  if (result.result === "fail") {
    if (result.fuzzyLabel !== "hegui") {
      return "模糊";
    }
    if (result.remakeLabel !== "hegui") {
      return "翻拍";
    }
    if (!result.target && detectMode === "full_pipeline") {
      return "未识别到对象";
    }
  }
  return "合规";
}

/**
 * 统一封装安检拍照入口。
 * App 端调用项目 AiDetectPlugin；非 App 端仅用于开发调试，降级到 uni.chooseImage。
 */
export function captureInspectionPhotos(
  mode: string,
  detectLabels?: string,
): Promise<{ path: string; aiResult: string }[]> {
  // #ifdef APP-PLUS
  return new Promise((resolve, reject) => {
    let plugin: AiDetectPlugin | null = null;
    try {
      plugin = uni.requireNativePlugin("AiDetectPlugin") as AiDetectPlugin;
    } catch (error) {
      reject(error instanceof Error ? error : new Error("拍照插件加载失败"));
      return;
    }

    if (!plugin?.startDetect) {
      reject(new Error("拍照插件未安装或版本不支持"));
      return;
    }

    let settled = false;
    const collectedPhotos = new Map<
      string,
      { path: string; aiResult: string }
    >();
    const finish = (paths: any[]) => {
      if (settled) return;
      settled = true;
      resolve(paths);
    };
    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      reject(new Error(message));
    };
    let params: Record<string, unknown> = {};
    const handleResult = (result?: NativePluginResult) => {
      if (!result || settled) return;
      const type = getString(result.type);
      if (result.success === false) {
        if (type === "cancel") finish([]);
        else fail(getString(result.message) || "拍照失败，请重试");
        return;
      }
      if (type === "snapshot") {
        const paths = getSnapshotPaths(result, params.detectMode as string);
        paths.forEach((photo) => collectedPhotos.set(photo.path, photo));

        // 拍摄过程中会逐张回调 snapshot，确认完成后才统一结束。
        const isCompleted =
          (Array.isArray(result.images) && result.images.length > 0) ||
          result.mode === "multi" ||
          result.shouldCloseCamera === true;
        if (isCompleted) {
          const photos = [...collectedPhotos.values()];
          if (photos.length) finish(photos);
          else fail("拍照插件未返回图片路径");
        }
        return;
      }
      if (type === "error" || type === "snapshot_error") {
        fail(getString(result.message) || "拍照失败，请重试");
      }
    };

    if (mode === INSPECTION_ACTIONS.AI.mode && detectLabels) {
      params = {
        detectMode: "full_pipeline",
        labels: detectLabels,
        targetModel: {
          modelType: "detection",
          engine: "ncnn",
          modelArch: "yolov5",
          modelName: "mqj_Integration_v14",
          modelPath: "models/object/mqj_Integration_v14.ncnn.param",
          binPath: "models/object/mqj_Integration_v14.ncnn.bin",
          labelPath: "models/object/labels.txt",
          inputSize: 640,
          threshold: 0.5,
          iouThreshold: 0.45,
          useGpu: false,
        },
      };
    } else if (
      mode === INSPECTION_ACTIONS.MANUAL.mode ||
      mode === INSPECTION_ACTIONS.UNABLE.mode
    ) {
      params = {
        detectMode: "photo_only",
      };
    } else if (mode === INSPECTION_ACTIONS.AI.mode && !detectLabels) {
      params = {
        detectMode: "quality_only",
      };
    }
    try {
      const syncResult = plugin.startDetect(params, handleResult);
      if (syncResult) handleResult(syncResult);
    } catch (error) {
      fail(error instanceof Error ? error.message : "拍照插件调用失败");
    }
  });
  // #endif

  // #ifndef APP-PLUS
  return uni
    .chooseImage({
      count: 1,
      sourceType: ["camera"],
      sizeType: ["compressed"],
    })
    .then((result) => {
      const paths = Array.isArray(result.tempFilePaths)
        ? result.tempFilePaths
        : [result.tempFilePaths];
      let results: { path: string; aiResult: string }[] = [];
      paths.forEach((path) => {
        results.push({
          path,
          aiResult: "",
        });
      });
      return results;
    });
  // #endif
}
