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
