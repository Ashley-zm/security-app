import type { DictDataVO } from "@/modules/common/types";
import { getDictsApi } from "@/modules/common/api";

// 根据值获取数据字典某一项的名称
export function getDictLabelByValue(dictData: DictDataVO[], value: string) {
  return dictData.find((item) => item.dictValue === value)?.dictLabel || "";
}

// 根据字典类型和值获取数据字典某一项的名称
export async function getDictLabelByType(dictType: string, value: string) {
  const dict = await getDictsApi(dictType);
  return getDictLabelByValue(dict, value);
}

// 根据值获取数据字典某一项的选项
export function getDictOption(dictData: DictDataVO[], value: string) {
  return dictData.find((item) => item.dictValue === value) || {};
}

// 根据多个字典类型查询字典数据 并返回一个对象，键为字典类型，值为字典数据，isHasEmpty 为是否包含空选项为全部选项，置顶全部选项
export async function getDictsByTypes(dictTypes: string[], isHasEmpty = false) {
  try {
    const dicts = await Promise.all(dictTypes.map((type) => getDictsApi(type)));
    let acc: Record<string, DictDataVO[]> = {};
    dictTypes.forEach((type_1, index) => {
      if (isHasEmpty) {
        dicts[index].unshift({ dictValue: "all", dictLabel: "全部" });
      }
      acc[type_1] = dicts[index];
    });
    return acc;
  } catch (error) {
    console.error("获取字典数据失败:", error);
    return {};
  }
}
// 去除请求参数中的空值
export function removeEmptyParams(
  params: Record<string, string | number | boolean | object | undefined>,
) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([key, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}
