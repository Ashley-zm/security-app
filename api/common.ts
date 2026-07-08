import { request } from '@/utils/request'
import type { DictDataVO } from '@/types/common'
// 获取字典数据
export function getDicts(data: { dictType: string }) {
  return request<DictDataVO[], { dictType: string }>({
    url: '/system/dict/data/type/' + data.dictType,
    method: 'GET'
  });
}