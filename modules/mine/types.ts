export interface ChangePasswordParams {
  oldPassword: string;
  newPassword: string;
}

export interface NotificationSettings {
  assignmentNotice: boolean;
  reassignmentNotice: boolean;
  cancellationNotice: boolean;
  soundReminder: boolean;
  vibrationReminder: boolean;
  doNotDisturb: boolean;
  quietStart: string;
  quietEnd: string;
}

export type BooleanSettingKey = Exclude<
  keyof NotificationSettings,
  "quietStart" | "quietEnd"
>;

export type TimeSettingKey = "quietStart" | "quietEnd";

export interface NotificationOrderSetting {
  key: BooleanSettingKey;
  title: string;
  description: string;
  icon: string;
  iconClass: string;
}