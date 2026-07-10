import { request } from '@/utils/request'
import type { DictDataVO } from '@/modules/common/types'
// 获取字典数据
export function getDictsApi(data: { dictType: string }) {
  return request<DictDataVO[], { dictType: string }>({
    url: '/system/dict/data/type/' + data.dictType,
    method: 'GET'
  });
}