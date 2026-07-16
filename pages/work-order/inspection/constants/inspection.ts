export const INPUT_TYPE = {
  RADIO: "1",
  CHECKBOX: "2",
  TEXT: "3",
} as const;
export const PHOTO_RULE = {
  NONE: "1",
  OPTIONAL: "2",
  REQUIRED: "3",
  ABNORMAL_REQUIRED: "4",
} as const;
export const SUB_ITEM_TYPE = { NORMAL: "1", DANGER: "2" } as const;
export const DEFAULT_MAX_PHOTO_COUNT = 3;
export const DEFAULT_MAX_INPUT_LENGTH = 200;

export function normalizeMaxPhotoCount(value?: number | null) {
  return Number.isInteger(value) && Number(value) > 0
    ? Number(value)
    : DEFAULT_MAX_PHOTO_COUNT;
}

export const INSPECTION_ACTIONS = {
  AI: {
    mode: "1",
    label: "AI安检",
    desc: "智能安检",
    className: "is-ai",
  },
  MANUAL: {
    mode: "2",
    label: "人工安检",
    desc: "手动逐项录入",
    className: "is-manual",
  },
  UNABLE: {
    mode: "3",
    label: "无法安检",
    desc: "异常情况记录",
    className: "is-unable",
  },
};
export const UNABLE_INSPECTION_MAX_PHOTO_COUNT = 5;

export const UNABLE_INSPECTION_REASON_OPTIONS = [
  { label: "到访不遇", value: "1" },
  { label: "拒绝安检", value: "2" },
];
export const UNABLE_INSPECTION_DEFAULT_REASON =
  UNABLE_INSPECTION_REASON_OPTIONS[0].value;
