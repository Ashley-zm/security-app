import type { DictDataVO } from '@/types/common'
import { getDicts } from '@/api/common'
// 根据值获取数据字典某一项的名称
export function getDictLabel(dictData: DictDataVO[], value: string) {
    return dictData.find(item => item.dictValue === value)?.dictLabel || ''
}
// 根据值获取数据字典某一项的选项
export function getDictOption(dictData: DictDataVO[], value: string) {
    return dictData.find(item => item.dictValue === value) || {}
}
// 根据多个字典类型查询字典数据 并返回一个对象，键为字典类型，值为字典数据，isHasEmpty 为是否包含空选项为全部选项，置顶全部选项
export async function getDictsByTypes(dictTypes: string[], isHasEmpty = false) {
    try {
        const dicts = await Promise.all(dictTypes.map(type => getDicts({ dictType: type })))
        return dictTypes.reduce((acc, type_1, index) => {
            if (isHasEmpty) {
                dicts[index].unshift({ dictValue: '', dictLabel: '全部' })
            }
            if (isHasEmpty) {
                dicts[index].forEach(item => {
                    item.dictValue = item.dictValue
                })
            } else {
                acc[type_1] = dicts[index]
            }
            return acc
        }, {} as Record<string, DictDataVO[]>)
    } catch (error) {
        console.error('获取字典数据失败:', error)
        return {}
    }
}
