<template>
  <view class="inspection-group">
    <view class="group-head" @click="$emit('toggle')">
      <text class="group-name">
        {{ group.groupName }}（{{ progress.completed }}/{{ progress.total }}）
      </text>
      <text class="arrow" :class="{ open: expanded }">⌄</text>
    </view>
    <view v-if="expanded" class="group-body">
      <view v-if="!items.length" class="empty-items">暂无检查项</view>
      <InspectionItemCard
        v-for="item in items"
        :key="String(item.id)"
        :item="item"
        :form="formData[String(item.id)]"
        :error-active="errorItemId === String(item.id)"
        :danger-level-dict="dangerLevelDict"
        :disposal-measure-dict="disposalMeasureDict"
        @option-change="$emit('optionChange', item, $event)"
        @input-change="$emit('inputChange', item, $event)"
        @disposal-change="$emit('disposalChange', item, $event)"
        @choose-photo="$emit('choosePhoto', item)"
        @retry-photo="$emit('retryPhoto', item, $event)"
        @remove-photo="$emit('removePhoto', item, $event)"
        @retry-ai="$emit('retryAi', item)"
        @apply-ai="$emit('applyAi', item)"
        @ignore-ai="$emit('ignoreAi', item)"
      />
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed } from "vue";
import type {
  InspectionFormItem,
  InspectionTemplateGroup,
  InspectionTemplateItem,
} from "@/modules/work-order/inspection/types";
import type { DictDataVO } from "@/modules/common/types";
import InspectionItemCard from "./InspectionItemCard.vue";
const props = defineProps<{
  group: InspectionTemplateGroup;
  formData: Record<string, InspectionFormItem>;
  expanded: boolean;
  progress: { completed: number; total: number };
  errorItemId?: string;
  dangerLevelDict?: DictDataVO[];
  disposalMeasureDict?: DictDataVO[];
}>();
defineEmits<{
  toggle: [];
  optionChange: [item: InspectionTemplateItem, value: string[]];
  inputChange: [item: InspectionTemplateItem, value: string];
  disposalChange: [item: InspectionTemplateItem, value: string[]];
  choosePhoto: [item: InspectionTemplateItem];
  retryPhoto: [item: InspectionTemplateItem, photoId: string];
  removePhoto: [item: InspectionTemplateItem, photoId: string];
  retryAi: [item: InspectionTemplateItem];
  applyAi: [item: InspectionTemplateItem];
  ignoreAi: [item: InspectionTemplateItem];
}>();
const items = computed(() =>
  (props.group.itemList || []).filter((item) => Number(item.enabled) === 1),
);
</script>
<style scoped lang="scss">
.inspection-group {
  margin-top: 34rpx;
}

.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8rpx;
}

.group-name {
  color: #1e3d70;
  font-size: 31rpx;
  font-weight: 900;
  line-height: 44rpx;
}

.arrow {
  color: #6e83a8;
  font-size: 36rpx;
  transform: rotate(-90deg);
  transition: 0.2s;
}

.arrow.open {
  transform: rotate(0);
}

.empty-items {
  margin-top: 20rpx;
  padding: 42rpx;
  border-radius: 24rpx;
  color: #91a0ba;
  font-size: 25rpx;
  text-align: center;
  background: #fff;
}
</style>
