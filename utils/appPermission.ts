interface AndroidPermissionResult {
  granted?: string[];
}

interface AppPlusRuntime {
  os?: { version?: string };
  android?: {
    requestPermissions?: (
      permissions: string[],
      success: (result: AndroidPermissionResult) => void,
      fail: () => void,
    ) => void;
    importClass?: (name: string) => any;
    runtimeMainActivity?: () => any;
  };
}

export const ANDROID_PERMISSIONS = {
  RECORD_AUDIO: "android.permission.RECORD_AUDIO",
  POST_NOTIFICATIONS: "android.permission.POST_NOTIFICATIONS",
} as const;

export function openAppPermissionSettings() {
  // #ifdef APP-PLUS
  try {
    const plusRuntime = (globalThis as { plus?: AppPlusRuntime }).plus;
    const android = plusRuntime?.android;
    const activity = android?.runtimeMainActivity?.();
    const Intent = android?.importClass?.("android.content.Intent");
    const Settings = android?.importClass?.("android.provider.Settings");
    const Uri = android?.importClass?.("android.net.Uri");
    if (!activity || !Intent || !Settings || !Uri) return;

    const intent = new Intent();
    intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
    intent.setData(Uri.parse(`package:${activity.getPackageName()}`));
    activity.startActivity(intent);
  } catch (error) {
    console.error("打开应用权限设置失败", error);
    uni.showToast({ title: "请在系统设置中开启应用权限", icon: "none" });
  }
  // #endif
}

function getPermissionGuide(permission: string) {
  if (permission === ANDROID_PERMISSIONS.RECORD_AUDIO) {
    return {
      title: "录音权限提示",
      content: "安检过程需要使用麦克风持续录音，请开启录音权限后重试。",
    };
  }
  if (permission === ANDROID_PERMISSIONS.POST_NOTIFICATIONS) {
    return {
      title: "通知权限提示",
      content: "接收工单提醒和显示前台服务通知需要通知权限，请开启后重试。",
    };
  }
  return {
    title: "权限提示",
    content: "当前操作需要相关系统权限，请开启权限后重试。",
  };
}

export function showRecordingPermissionGuide(permission: string) {
  const guide = getPermissionGuide(permission);
  uni.showModal({
    title: guide.title,
    content: guide.content,
    confirmText: "去设置",
    cancelText: "暂不开启",
    success: (result) => {
      if (result.confirm) openAppPermissionSettings();
    },
  });
}

function requestAndroidPermission(permission: string) {
  return new Promise<boolean>((resolve) => {
    // #ifdef APP-PLUS
    const plusRuntime = (globalThis as { plus?: AppPlusRuntime }).plus;
    const requestPermissions = plusRuntime?.android?.requestPermissions;
    if (!requestPermissions) {
      resolve(false);
      return;
    }

    requestPermissions(
      [permission],
      (result) => resolve(Boolean(result.granted?.includes(permission))),
      () => resolve(false),
    );
    return;
    // #endif

    // #ifndef APP-PLUS
    resolve(true);
    // #endif
  });
}

export async function requestNotificationPermission() {
  // #ifdef APP-PLUS
  if (uni.getSystemInfoSync().platform !== "android") return true;

  const plusRuntime = (globalThis as { plus?: AppPlusRuntime }).plus;
  const androidVersion = Number.parseInt(plusRuntime?.os?.version || "0", 10);
  if (androidVersion < 13) return true;

  return requestAndroidPermission(ANDROID_PERMISSIONS.POST_NOTIFICATIONS);
  // #endif

  // #ifndef APP-PLUS
  return true;
  // #endif
}

export async function requestRecordingPermissions(permissions: string[]) {
  // #ifdef APP-PLUS
  if (uni.getSystemInfoSync().platform !== "android") return true;

  const plusRuntime = (globalThis as { plus?: AppPlusRuntime }).plus;
  const androidVersion = Number.parseInt(plusRuntime?.os?.version || "0", 10);
  const requiredPermissions = [...new Set(permissions.filter(Boolean))].filter(
    (permission) =>
      androidVersion >= 13 ||
      permission !== ANDROID_PERMISSIONS.POST_NOTIFICATIONS,
  );

  for (const permission of requiredPermissions) {
    if (!(await requestAndroidPermission(permission))) {
      showRecordingPermissionGuide(permission);
      return false;
    }
  }
  // #endif

  return true;
}

export async function ensureRecordingPermissions(permissions: string[]) {
  return requestRecordingPermissions(permissions);
}
