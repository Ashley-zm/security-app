import { computed, ref } from "vue";
import { uploadFilesApi } from "@/modules/common/api";
import { FILE_UPLOAD_TYPE } from "@/modules/common/types";
import type { UploadedFileVO } from "@/modules/common/types";
import type { InspectionAudioStatus } from "@/modules/work-order/inspection/types";

interface AudioRecordResult {
  success?: boolean;
  status?: string;
  filePath?: string;
  duration?: number;
  message?: string;
  [key: string]: unknown;
}

interface AudioRecordPlugin {
  startRecord?: (
    options: {
      fileName?: string;
      sampleRate?: number;
      bitRate?: number;
    },
    callback: (result?: AudioRecordResult) => void,
  ) => void;
  stopRecord?: (
    options: Record<string, never>,
    callback: (result?: AudioRecordResult) => void,
  ) => void;
}

interface PlusRuntime {
  os?: { version?: string };
  android?: {
    requestPermissions?: (
      permissions: string[],
      success: (event: { granted?: string[] }) => void,
      fail: () => void,
    ) => void;
  };
}

export function useInspectionAudioRecorder() {
  const status = ref<InspectionAudioStatus>("idle");
  const duration = ref(0);
  const filePath = ref("");
  const uploadedFile = ref<UploadedFileVO | null>(null);
  const errorMessage = ref("");
  const isAppRuntime = ref(false);
  let plugin: AudioRecordPlugin | null = null;
  let startTask: Promise<void> | null = null;
  let stopTask: Promise<string> | null = null;
  let uploadTask: Promise<UploadedFileVO> | null = null;
  let durationTimer: ReturnType<typeof setInterval> | undefined;
  let durationBase = 0;
  let durationStartedAt = 0;

  // #ifdef APP-PLUS
  isAppRuntime.value = true;
  try {
    plugin = uni.requireNativePlugin("AudioRecordPlugin") as AudioRecordPlugin;
  } catch (error) {
    console.error("获取 AudioRecordPlugin 失败", error);
  }
  // #endif

  const isRecording = computed(() => status.value === "recording");
  const isUploaded = computed(
    () => status.value === "uploaded" && Boolean(uploadedFile.value?.fileId),
  );

  function setError(message: string) {
    errorMessage.value = message;
    status.value = "error";
    stopDurationTimer();
  }

  function checkPlugin() {
    if (!isAppRuntime.value) {
      setError("当前环境不支持原生录音");
      return false;
    }
    if (!plugin?.startRecord || !plugin.stopRecord) {
      setError("AudioRecordPlugin 未加载");
      return false;
    }
    return true;
  }

  function requestAndroidPermissions() {
    return new Promise<boolean>((resolve) => {
      // #ifdef APP-PLUS
      if (uni.getSystemInfoSync().platform !== "android") {
        resolve(true);
        return;
      }
      const plusRuntime = (globalThis as { plus?: PlusRuntime }).plus;
      const permissions = ["android.permission.RECORD_AUDIO"];
      const osVersion = Number.parseInt(plusRuntime?.os?.version || "0", 10);
      if (osVersion >= 13) {
        permissions.push("android.permission.POST_NOTIFICATIONS");
      }
      if (!plusRuntime?.android?.requestPermissions) {
        resolve(false);
        return;
      }
      plusRuntime.android.requestPermissions(
        permissions,
        (event) =>
          resolve(
            Boolean(event.granted?.includes("android.permission.RECORD_AUDIO")),
          ),
        () => resolve(false),
      );
      // #endif

      // #ifndef APP-PLUS
      resolve(false);
      // #endif
    });
  }

  function startDurationTimer(initialDuration = 0) {
    stopDurationTimer();
    durationBase = Math.max(0, Number(initialDuration) || 0);
    duration.value = durationBase;
    durationStartedAt = Date.now();
    durationTimer = setInterval(() => {
      duration.value = durationBase + Date.now() - durationStartedAt;
    }, 1000);
  }

  function stopDurationTimer() {
    if (durationTimer) clearInterval(durationTimer);
    durationTimer = undefined;
  }

  async function startRecording(workOrderUserId: string) {
    if (status.value === "recording" || startTask) return startTask;
    if (!String(workOrderUserId || "").trim()) {
      setError("缺少工单用户 ID，无法开始录音");
      return;
    }
    if (!checkPlugin()) return;

    startTask = (async () => {
      status.value = "starting";
      errorMessage.value = "";
      const granted = await requestAndroidPermissions();
      if (!granted) {
        setError("未获得麦克风权限");
        uni.showModal({
          title: "录音权限提示",
          content:
            "安检过程需要持续录音，请开启麦克风权限；Android 13 及以上还需要允许通知权限。",
          showCancel: false,
        });
        return;
      }

      await new Promise<void>((resolve, reject) => {
        plugin?.startRecord?.(
          {
            fileName: `inspection_${Date.now()}.m4a`,
            sampleRate: 16000,
            bitRate: 64000,
          },
          (result) => {
            if (!result?.success) {
              reject(new Error(result?.message || "开始录音失败"));
              return;
            }
            filePath.value = "";
            uploadedFile.value = null;
            status.value = "recording";
            errorMessage.value = "";
            startDurationTimer(Number(result.duration || 0));
            resolve();
          },
        );
      });
    })()
      .catch((error: unknown) => {
        setError(error instanceof Error ? error.message : "开始录音失败");
      })
      .finally(() => {
        startTask = null;
      });

    return startTask;
  }

  async function stopRecording(): Promise<string> {
    if (stopTask) return stopTask;
    if (
      ["uploaded", "uploading", "stopped", "upload_failed"].includes(
        status.value,
      ) &&
      filePath.value
    ) {
      return filePath.value;
    }
    if (startTask) await startTask;
    if (status.value !== "recording") {
      throw new Error(errorMessage.value || "录音未正常开始");
    }
    if (!plugin?.stopRecord) throw new Error("录音插件不可用");

    stopTask = new Promise<string>((resolve, reject) => {
      status.value = "stopping";
      plugin?.stopRecord?.({}, (result) => {
        if (!result?.success || !result.filePath) {
          const message = result?.message || "结束录音失败";
          setError(message);
          reject(new Error(message));
          return;
        }
        filePath.value = result.filePath;
        duration.value = Number(result.duration || duration.value);
        status.value = "stopped";
        errorMessage.value = "";
        stopDurationTimer();
        resolve(result.filePath);
      });
    }).finally(() => {
      stopTask = null;
    });

    return stopTask;
  }

  async function uploadRecording(
    workOrderUserId: string,
  ): Promise<UploadedFileVO> {
    if (uploadedFile.value?.fileId) return uploadedFile.value;
    if (uploadTask) return uploadTask;
    const businessId = String(workOrderUserId || "").trim();
    if (!businessId) throw new Error("缺少录音关联业务 ID");
    if (!filePath.value) throw new Error("录音文件不存在");

    status.value = "uploading";
    errorMessage.value = "";
    uploadTask = uploadFilesApi(
      [filePath.value],
      FILE_UPLOAD_TYPE.AUDIO,
      businessId,
    )
      .then((files) => {
        const file = files[0];
        if (!file?.fileId) throw new Error("录音上传结果为空");
        uploadedFile.value = file;
        status.value = "uploaded";
        return file;
      })
      .catch((error: unknown) => {
        errorMessage.value =
          error instanceof Error ? error.message : "录音上传失败";
        status.value = "upload_failed";
        throw error;
      })
      .finally(() => {
        uploadTask = null;
      });

    return uploadTask;
  }

  async function stopForPageClose() {
    if (status.value !== "recording" && !startTask) {
      stopDurationTimer();
      return;
    }
    try {
      await stopRecording();
    } catch (error) {
      console.error("页面关闭时停止录音失败", error);
    } finally {
      stopDurationTimer();
    }
  }

  function dispose() {
    stopDurationTimer();
    if (status.value === "recording" || startTask) {
      void stopForPageClose();
    }
  }

  return {
    status,
    duration,
    filePath,
    uploadedFile,
    errorMessage,
    isRecording,
    isUploaded,
    startRecording,
    stopRecording,
    uploadRecording,
    stopForPageClose,
    dispose,
  };
}
