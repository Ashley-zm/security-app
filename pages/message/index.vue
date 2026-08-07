<template>
  <view class="message-page page safe-page">
    <AppNavbar title="消息中心" background-color="#f5f8ff" />

    <view class="summary-card">
      <view>
        <text class="summary-label">待查看消息</text>
        <view class="summary-value"
          ><text>{{ unreadCount }}</text
          ><text class="summary-unit">条</text></view
        >
      </view>
      <view class="summary-types">
        <view v-for="item in typeSummary" :key="item.type" class="summary-type">
          <image
            class="summary-icon"
            :src="iconMap[item.type]"
            mode="aspectFit"
          />
          <text>{{ item.count }}</text>
        </view>
      </view>
    </view>

    <view class="filter-wrap">
      <view class="filter-list">
        <view
          v-for="item in filters"
          :key="item.key"
          class="filter-item"
          :class="{ active: activeFilter === item.key }"
          @click="activeFilter = item.key"
        >
          <text>{{ item.label }}</text>
          <text v-if="item.count" class="filter-count">{{ item.count }}</text>
        </view>
      </view>
    </view>

    <view v-if="filteredMessages.length" class="message-list">
      <view
        v-for="item in filteredMessages"
        :key="item.id"
        class="message-card"
        :class="{ unread: !item.read }"
        @click="markAsRead(item)"
      >
        <view class="icon-wrap" :class="item.type">
          <image
            class="message-icon"
            :src="iconMap[item.type]"
            mode="aspectFit"
          />
        </view>
        <view class="message-main">
          <view class="message-head">
            <view class="title-row">
              <text v-if="!item.read" class="unread-dot" />
              <text class="message-title">{{ typeLabels[item.type] }}</text>
            </view>
            <text class="message-time">{{ item.time }}</text>
          </view>
          <text class="message-desc">{{ item.content }}</text>
          <view class="order-info">
            <text class="order-name">{{ item.orderName }}</text>
            <text class="order-no">{{ item.orderNo }}</text>
          </view>
          <view class="message-footer">
            <text class="message-source">{{ item.source }}</text>
            <view class="detail-link">
              <text>{{ item.read ? "已查看" : "查看消息" }}</text
              ><text class="arrow">›</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="empty-state">
      <view class="empty-icon"><text>✓</text></view>
      <text class="empty-title">暂无此类消息</text>
      <text class="empty-desc">新的工单动态会及时通知您</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import AppNavbar from "@/components/AppNavbar.vue";

type MessageType = "assignment" | "reassignment" | "cancellation";
type FilterType = "all" | MessageType;

interface MessageItem {
  id: number;
  type: MessageType;
  content: string;
  orderName: string;
  orderNo: string;
  source: string;
  time: string;
  read: boolean;
}

const iconMap: Record<MessageType, string> = {
  assignment: "/static/images/message/assignment.png",
  reassignment: "/static/images/message/reassignment.png",
  cancellation: "/static/images/message/cancellation.png",
};

const typeLabels: Record<MessageType, string> = {
  assignment: "工单指派",
  reassignment: "工单改派",
  cancellation: "工单取消",
};

const activeFilter = ref<FilterType>("all");

// 当前使用本地模拟消息，后续接入接口时替换此数据源即可。
const messages = ref<MessageItem[]>([
  {
    id: 1,
    type: "assignment",
    content: "您有一条新的安检工单，请及时查看并安排上门安检。",
    orderName: "滨江花园小区入户安检",
    orderNo: "GD202608060018",
    source: "系统指派",
    time: "今天 09:30",
    read: false,
  },
  {
    id: 2,
    type: "reassignment",
    content: "因人员调度安排，该工单已改派给您，请确认最新任务信息。",
    orderName: "金桂苑燃气安全排查",
    orderNo: "GD202608050126",
    source: "王主管改派",
    time: "今天 08:45",
    read: false,
  },
  {
    id: 3,
    type: "cancellation",
    content: "该安检计划已取消，无需继续执行，请知悉。",
    orderName: "春晖里社区专项安检",
    orderNo: "GD202608050091",
    source: "系统通知",
    time: "昨天 17:20",
    read: false,
  },
  {
    id: 4,
    type: "assignment",
    content: "您有一条新的安检工单，计划执行时间为本周五。",
    orderName: "云景家园常规入户安检",
    orderNo: "GD202608040067",
    source: "李主管指派",
    time: "08-04 14:12",
    read: true,
  },
  {
    id: 5,
    type: "reassignment",
    content: "工单负责人员发生调整，该任务现已转交给您处理。",
    orderName: "锦绣华庭燃气隐患复查",
    orderNo: "GD202608030039",
    source: "赵主管改派",
    time: "08-03 10:08",
    read: true,
  },
  {
    id: 6,
    type: "cancellation",
    content: "因小区临时调整入户时间，本次安检工单已取消。",
    orderName: "东湖新城集中安检",
    orderNo: "GD202608020014",
    source: "系统通知",
    time: "08-02 16:36",
    read: true,
  },
]);

const unreadCount = computed(
  () => messages.value.filter((item) => !item.read).length,
);
const unreadByType = (type: MessageType) =>
  messages.value.filter((item) => item.type === type && !item.read).length;
const typeSummary = computed(() =>
  (["assignment", "reassignment", "cancellation"] as MessageType[]).map(
    (type) => ({
      type,
      count: unreadByType(type),
    }),
  ),
);
const filters = computed(() => [
  { key: "all" as FilterType, label: "全部", count: unreadCount.value },
  {
    key: "assignment" as FilterType,
    label: "工单指派",
    count: unreadByType("assignment"),
  },
  {
    key: "reassignment" as FilterType,
    label: "工单改派",
    count: unreadByType("reassignment"),
  },
  {
    key: "cancellation" as FilterType,
    label: "工单取消",
    count: unreadByType("cancellation"),
  },
]);
const filteredMessages = computed(() =>
  activeFilter.value === "all"
    ? messages.value
    : messages.value.filter((item) => item.type === activeFilter.value),
);

function markAsRead(item: MessageItem) {
  item.read = true;
}
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.message-page {
  min-height: 100vh;
  padding: 0 26rpx calc(40rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  background: #f5f8ff;
}

.summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 152rpx;
  margin-top: 18rpx;
  padding: 28rpx 32rpx;
  box-sizing: border-box;
  border-radius: 28rpx;
  background: linear-gradient(135deg, #176ff0 0%, #4d69ee 100%);
  box-shadow: 0 14rpx 30rpx rgba(37, 94, 218, 0.2);
}

.summary-label {
  color: rgba(255, 255, 255, 0.78);
  font-size: 23rpx;
}

.summary-value {
  display: flex;
  align-items: baseline;
  margin-top: 7rpx;
  color: #fff;
}

.summary-value > text:first-child {
  font-size: 48rpx;
  font-weight: 800;
  line-height: 1;
}

.summary-unit {
  margin-left: 8rpx;
  font-size: 22rpx;
}

.summary-types {
  display: flex;
  gap: 14rpx;
}

.summary-type {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  width: 72rpx;
  height: 86rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.18);
  border-radius: 18rpx;
  color: #fff;
  font-size: 19rpx;
  background: rgba(255, 255, 255, 0.13);
}

.summary-icon {
  width: 37rpx;
  height: 37rpx;
  margin-bottom: 4rpx;
}

.filter-wrap {
  margin-top: 28rpx;
  padding: 8rpx;
  border: 1rpx solid #e5ebf6;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 8rpx 22rpx rgba(31, 72, 143, 0.05);
}

.filter-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6rpx;
  width: 100%;
}

.filter-item {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 64rpx;
  padding: 0 3rpx;
  box-sizing: border-box;
  border-radius: 18rpx;
  color: #70809d;
  font-size: 21rpx;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  background: transparent;
  transition:
    color 0.2s ease,
    background 0.2s ease;
}

.filter-item > text:first-child {
  flex-shrink: 0;
  white-space: nowrap;
}

.filter-item.active {
  color: #fff;
  background: linear-gradient(135deg, #286ff1, #465ce8);
  box-shadow: 0 6rpx 14rpx rgba(48, 91, 224, 0.22);
}

.filter-count {
  flex: 0 0 auto;
  min-width: 26rpx;
  height: 26rpx;
  margin-left: 6rpx;
  padding: 0 5rpx;
  box-sizing: border-box;
  border-radius: 14rpx;
  color: #fff;
  font-size: 16rpx;
  font-weight: 700;
  line-height: 26rpx;
  text-align: center;
  background: #ff536b;
}

.filter-item.active .filter-count {
  color: #e9425b;
  background: #fff;
}
.message-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 18rpx;
}

.message-card {
  display: flex;
  gap: 22rpx;
  padding: 28rpx 26rpx 24rpx;
  border: 1rpx solid transparent;
  border-radius: 28rpx;
  background: #fff;
  box-shadow: 0 9rpx 25rpx rgba(31, 72, 143, 0.055);
}

.message-card.unread {
  border-color: #dfe9fb;
  box-shadow: 0 10rpx 28rpx rgba(31, 93, 204, 0.09);
}

.icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 82rpx;
  width: 82rpx;
  height: 82rpx;
  border-radius: 22rpx;
  background: #eaf3ff;
}

.icon-wrap.reassignment {
  background: #fff4e5;
}

.icon-wrap.cancellation {
  background: #f3fff0;
}

.message-icon {
  width: 56rpx;
  height: 56rpx;
}

.message-main {
  flex: 1;
  min-width: 0;
}

.message-head,
.title-row,
.order-info,
.message-footer,
.detail-link {
  display: flex;
  align-items: center;
}

.message-head,
.message-footer {
  justify-content: space-between;
}

.title-row {
  min-width: 0;
}

.unread-dot {
  flex: 0 0 12rpx;
  width: 12rpx;
  height: 12rpx;
  margin-right: 11rpx;
  border-radius: 50%;
  background: #ff4f67;
}

.message-title {
  color: #10264a;
  font-size: 28rpx;
  font-weight: 800;
}

.message-time {
  flex-shrink: 0;
  margin-left: 14rpx;
  color: #9aa7bd;
  font-size: 20rpx;
}

.message-desc {
  display: block;
  margin-top: 14rpx;
  color: #667590;
  font-size: 23rpx;
  line-height: 1.55;
}

.order-info {
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 18rpx;
  padding: 16rpx 18rpx;
  border-radius: 14rpx;
  background: #f7f9fd;
}

.order-name {
  overflow: hidden;
  color: #344967;
  font-size: 22rpx;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-no {
  flex-shrink: 0;
  color: #8d9ab0;
  font-size: 18rpx;
}

.message-footer {
  margin-top: 19rpx;
}

.message-source {
  color: #98a4b7;
  font-size: 19rpx;
}

.detail-link {
  color: #2872ef;
  font-size: 21rpx;
  font-weight: 600;
}

.arrow {
  margin-left: 7rpx;
  font-size: 30rpx;
  line-height: 1;
}

.empty-state {
  display: flex;
  align-items: center;
  flex-direction: column;
  padding-top: 130rpx;
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 110rpx;
  height: 110rpx;
  border-radius: 50%;
  color: #6192ee;
  font-size: 48rpx;
  background: #e8f1ff;
}

.empty-title {
  margin-top: 24rpx;
  color: #435470;
  font-size: 27rpx;
  font-weight: 700;
}

.empty-desc {
  margin-top: 10rpx;
  color: #9aa7bd;
  font-size: 22rpx;
}

@media screen and (max-width: 360px) {
  .message-page {
    padding-right: 20rpx;
    padding-left: 20rpx;
  }

  .summary-card {
    padding-right: 24rpx;
    padding-left: 24rpx;
  }

  .summary-types {
    gap: 8rpx;
  }

  .message-card {
    gap: 17rpx;
    padding-right: 21rpx;
    padding-left: 21rpx;
  }
}
</style>
