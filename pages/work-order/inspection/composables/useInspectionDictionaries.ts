import { reactive } from 'vue'
import type { DictDataVO } from '@/modules/common/types'
import { getDictLabelByValue, getDictsByTypes } from '@/utils/common'

export const INSPECTION_DICT_TYPES = [
  'input_type',
  'photo_rule',
  'detect_label',
  'sub_item_type',
  'danger_type',
  'danger_level',
  'disposal_measures'
] as const

export type InspectionDictType = typeof INSPECTION_DICT_TYPES[number]
export type InspectionDictionaries = Record<InspectionDictType, DictDataVO[]>

export function useInspectionDictionaries() {
  const dictionaries = reactive<InspectionDictionaries>({
    input_type: [],
    photo_rule: [],
    detect_label: [],
    sub_item_type: [],
    danger_type: [],
    danger_level: [],
    disposal_measures: []
  })

  async function loadInspectionDictionaries() {
    const result = await getDictsByTypes([...INSPECTION_DICT_TYPES])
    INSPECTION_DICT_TYPES.forEach(type => {
      dictionaries[type] = result[type] || []
    })
  }

  function getInspectionDictLabel(type: InspectionDictType, value?: string | number | null) {
    if (value === undefined || value === null || value === '') return ''
    return getDictLabelByValue(dictionaries[type], String(value)) || String(value)
  }

  return { dictionaries, loadInspectionDictionaries, getInspectionDictLabel }
}