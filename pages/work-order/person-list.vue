<template>
  <view class="work-order-page page safe-page">
    <AppNavbar :title="title" show-back />

    <view class="tabs-wrap">
      <view class="tabs" :style="tabCountStyle">
        <button
          v-for="tab in tabs"
          :key="tab.dictValue"
          class="tab-item"
          :class="{ active: activeStatus === tab.dictValue }"
          @click="changeStatus(tab.dictValue)"
        >
          {{ tab.dictLabel }}
        </button>
      </view>
    </view>

    <view class="search-panel">
      <view class="search-box">
        <input
          id="keywordInput"
          v-model="searchKeyword"
          class="search-input"
          confirm-type="search"
          placeholder="请输入户号、户名、手机号、地址、表号"
          placeholder-class="placeholder"
          :focus="searchFocused"
          @confirm="handleSearch"
          @blur="searchFocused = false"
        />
        <button v-if="searchKeyword" class="clear-btn" @click="clearSearch">
          X
        </button>
      </view>
      <button class="search-btn" @click="handleSearch">
        <uni-icons type="search" color="$primary-color" size="20"></uni-icons>
        <text>查询</text>
      </button>
      <view class="time-sort-btn" @click="toggleTimeSort">
        <image class="time-sort-icon" :src="timeSortIcon" mode="aspectFit" />
      </view>
    </view>

    <view class="total-count">
      <view class="total-count-label">
        <view class="total-count-mark" />
        <text>当前筛选总计</text>
      </view>
      <view class="total-count-value">
        <text class="total-count-number">{{ total }}</text>
        <text class="total-count-unit">位用户</text>
      </view>
    </view>

    <view v-if="error" class="error-card">
      <view class="error-title">用户列表加载失败</view>
      <view class="error-desc">{{ error }}</view>
      <button class="retry-btn" @click="refreshList">重试</button>
    </view>

    <scroll-view
      v-else
      class="user-list"
      scroll-y
      :show-scrollbar="false"
      lower-threshold="120"
      @scrolltolower="loadMore"
    >
      <view class="user-list-content">
        <view
          v-for="item in userViews"
          :key="item.id"
          class="user-card"
          @click="openUserDetail(item)"
        >
          <view class="card-header">
            <view class="name-line">
              <text class="household-name">{{ item.householdName }}</text>
              <button class="phone-icon-btn" @click.stop="handleCall(item)">
                <uni-icons
                  type="phone-filled"
                  color="#1677ff"
                  size="20"
                ></uni-icons>
              </button>
            </view>
            <text class="status-pill" :class="item.statusClass">
              {{ item.statusText }}
            </text>
          </view>

          <view class="number-row">
            <view class="number-item">
              <text class="number-label">户号</text>
              <text class="number-value">{{ item.householdNo }}</text>
            </view>
            <view class="number-item">
              <text class="number-label">表号</text>
              <text class="number-value">{{ item.meterNo }}</text>
            </view>
          </view>

          <view class="divider" />

          <view class="info-row">
            <view class="info-icon">
              <uni-icons type="calendar" color="#8aa4cf" size="18"></uni-icons>
            </view>
            <text class="info-label">预约时间</text>
            <text class="info-value">{{ item.appointmentTime }}</text>
          </view>
          <view class="info-row address-info">
            <view class="info-icon">
              <uni-icons type="location" color="#8aa4cf" size="18"></uni-icons>
            </view>
            <text class="info-label">地址</text>
            <text class="info-value address-value">{{ item.userAddress }}</text>
          </view>

          <view class="card-actions" @click.stop>
            <button
              class="action-btn appointment-btn"
              @click="openChangeTime(item)"
            >
              修改预约时间
            </button>
            <button
              class="action-btn navigate-btn"
              @click="handleNavigate(item)"
            >
              <uni-icons
                type="location-filled"
                color="#1677ff"
                size="25"
              ></uni-icons>
            </button>
          </view>
        </view>

        <view v-if="loading && !list.length" class="loading-text">
          <uni-load-more
            status="loading"
            color="#1677FF"
            content-text="用户加载中..."
          />
        </view>
        <AppEmpty
          v-if="!loading && !list.length"
          title="暂无安检用户"
          desc="调整状态或搜索条件后再试"
          show-retry
          @retry="refreshList"
        />
        <view v-if="loading && list.length" class="footer-text">
          加载更多...
        </view>
        <view v-if="finished && list.length" class="footer-text">
          没有更多用户了
        </view>
      </view>
    </scroll-view>

    <view v-if="popupVisible" class="popup-mask" @click="closePopup">
      <view class="popup" @click.stop>
        <view class="popup-title">修改预约时间</view>
        <view class="current-time">
          <text class="label">当前预约时间</text>
          <text class="value">
            {{ currentUser?.appointmentTime || "暂未预约" }}
          </text>
        </view>

        <view class="picker-row">
          <picker
            mode="date"
            :value="appointmentDate"
            @change="handleDateChange"
          >
            <view class="picker-field">
              <text>日期</text>
              <text>{{ appointmentDate || "请选择日期" }}</text>
            </view>
          </picker>
          <picker
            mode="time"
            :value="appointmentTime"
            @change="handleTimeChange"
          >
            <view class="picker-field">
              <text>时间</text>
              <text>{{ appointmentTime || "请选择时间" }}</text>
            </view>
          </picker>
        </view>

        <view class="popup-actions">
          <button class="popup-btn cancel" @click="closePopup">取消</button>
          <button
            class="popup-btn confirm"
            :disabled="updating"
            @click="confirmChangeTime"
          >
            {{ updating ? "提交中..." : "确认修改" }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { onLoad, onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import AppEmpty from "@/components/AppEmpty.vue";
import AppNavbar from "@/components/AppNavbar.vue";
import {
  getWorkOrderUserListApi,
  updateWorkOrderUserAppointmentApi,
} from "@/modules/work-order/api";
import type {
  WorkOrderUser,
  WorkOrderUserQuery,
  WorkOrderUserView,
} from "@/modules/work-order/types";
import { getDictsByTypes, getDictLabelByValue } from "@/utils/common";
import type { DictDataVO } from "@/modules/common/types";

const workOrderId = ref("");
const title = ref("安检用户");
const searchKeyword = ref("");
const searchFocused = ref(false);
const activeStatus = ref("1");
const timeSort = ref<1 | 2>(2);
const list = ref<WorkOrderUser[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = 10;
const loading = ref(false);
const refreshing = ref(false);
const finished = ref(false);
const error = ref("");
const popupVisible = ref(false);
const currentUser = ref<WorkOrderUserView | null>(null);
const appointmentDate = ref("");
const appointmentTime = ref("");
const updating = ref(false);
const tabs = ref<DictDataVO[]>([]);

const tabCountStyle = computed(() => ({
  gridTemplateColumns: `repeat(${tabs.value.length}, minmax(0, 1fr))`,
}));

const timeSortIcon = computed(() =>
  timeSort.value === 1
    ? "/static/images/shijianzhengxu.png"
    : "/static/images/shijiandaoxu.png",
);

const userViews = computed<WorkOrderUserView[]>(() =>
  list.value.map(formatUser),
);

getDictsByTypes(["order_user_status"], true).then((dicts) => {
  tabs.value = dicts.order_user_status || [];
});

onLoad((options) => {
  workOrderId.value = decodeURIComponent(options?.workOrderId || "");
  title.value = decodeURIComponent(options?.title || "安检用户");
});
onShow(() => {
  refreshList();
});

onPullDownRefresh(async () => {
  uni.showToast({
    title: "用户数据获取中...",
    icon: "none",
    duration: 1000,
  });
  await refreshList();
  uni.stopPullDownRefresh();
});

function buildQuery(): WorkOrderUserQuery {
  const query: WorkOrderUserQuery = {
    keyword: searchKeyword.value.trim(),
    sort: timeSort.value,
    pageNum: pageNum.value,
    pageSize,
  };

  if (activeStatus.value !== "all") {
    query.status = activeStatus.value;
  }

  return query;
}

async function fetchList(reset = false) {
  if (loading.value) return;
  if (!workOrderId.value) {
    error.value = "缺少工单ID";
    return;
  }

  loading.value = true;
  error.value = "";
  try {
    const result = await getWorkOrderUserListApi(
      workOrderId.value,
      buildQuery(),
    );
    total.value = result.total || 0;
    list.value = reset ? result.list : [...list.value, ...result.list];
    finished.value = list.value.length >= total.value;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "用户列表加载失败";
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

async function refreshList() {
  refreshing.value = true;
  pageNum.value = 1;
  finished.value = false;
  await fetchList(true);
}

async function loadMore() {
  if (loading.value || finished.value) return;
  pageNum.value += 1;
  await fetchList(false);
}

function changeStatus(status: string) {
  if (activeStatus.value === status) return;
  activeStatus.value = status;
  refreshList();
}

function handleSearch() {
  refreshList();
}

function clearSearch() {
  searchKeyword.value = "";
  refreshList();
  nextTick(() => {
    searchFocused.value = true;
  });
}

function toggleTimeSort() {
  timeSort.value = timeSort.value === 1 ? 2 : 1;
  refreshList();
  uni.showToast({
    title: timeSort.value === 1 ? "按预约时间升序" : "按预约时间降序",
    icon: "none",
  });
}

function formatValue(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "--";
  return String(value);
}

function formatUser(item: WorkOrderUser): WorkOrderUserView {
  const status = String(item.status || "");
  return {
    ...item,
    id: String(item.id),
    householdName: formatValue(item.householdName),
    householdNo: formatValue(item.householdNo),
    userAddress: formatValue(item.userAddress),
    mobilePhone: formatValue(item.mobilePhone),
    meterNo: formatValue(item.meterNo),
    inspectionAreaName: formatValue(item.inspectionAreaName),
    communityName: formatValue(item.communityName),
    appointmentTime: formatValue(item.appointmentTime),
    finishTime: formatValue(item.finishTime || item.inspectionFinishTime),
    statusText: getStatusText(status, item.unableReason),
    statusClass: getStatusClass(status),
  };
}

function getStatusText(status: string, unableReason?: string | null) {
  if (status === "3") {
    if (unableReason === "1") {
      return "到访不遇";
    }
    return "拒绝安检";
  }
  return getDictLabelByValue(tabs.value, status) || status || "--";
}

function getStatusClass(status: WorkOrderUser["status"]) {
  const classMap: Record<string, string> = {
    "1": "is-pending",
    "2": "is-completed",
    "3": "is-canceled",
    "4": "is-ended",
  };
  return classMap[String(status)] || "is-pending";
}

function handleCall(item: WorkOrderUserView) {
  if (!item.mobilePhone || item.mobilePhone === "--") {
    uni.showToast({
      title: "用户手机号为空",
      icon: "none",
    });
    return;
  }

  uni.makePhoneCall({
    phoneNumber: item.mobilePhone,
  });
}

function handleNavigate(item: WorkOrderUserView) {
  // uni.showToast({
  //   title: item.userAddress === '--' ? '暂无地址信息' : '暂无坐标信息，无法导航',
  //   icon: 'none'
  // })
  uni.openLocation({
    latitude: 30.19033,
    longitude: 120.17552,
    name: item.householdName,
    address: item.userAddress,
    scale: 16,
  });
}

function openUserDetail(item: WorkOrderUserView) {
  uni.navigateTo({
    url: `/pages/work-order/user-detail?workOrderUserId=${encodeURIComponent(item.id)}&userStatus=${item.status}`,
  });
}

function parseAppointmentValue(value?: string | null) {
  const normalized = String(value || "").trim();

  if (!normalized || normalized === "--") {
    return { date: "", time: "" };
  }

  const [date = "", rawTime = ""] = normalized.split(/\s+/);
  return {
    date,
    time: rawTime.slice(0, 5),
  };
}

function buildAppointmentDateTime(date: string, time: string) {
  return `${date} ${time.slice(0, 5)}:00`;
}

function openChangeTime(item: WorkOrderUserView) {
  currentUser.value = item;
  const parsed = parseAppointmentValue(item.appointmentTime);
  appointmentDate.value = parsed.date;
  appointmentTime.value = parsed.time;
  popupVisible.value = true;
}

function closePopup() {
  if (updating.value) return;
  popupVisible.value = false;
}

function handleDateChange(event: { detail: { value: string | number } }) {
  appointmentDate.value = String(event.detail.value);
}

function handleTimeChange(event: { detail: { value: string | number } }) {
  appointmentTime.value = String(event.detail.value);
}

async function confirmChangeTime() {
  if (!currentUser.value) return;
  if (!appointmentDate.value || !appointmentTime.value) {
    uni.showToast({
      title: "请选择新的预约时间",
      icon: "none",
    });
    return;
  }

  updating.value = true;
  try {
    await updateWorkOrderUserAppointmentApi(
      currentUser.value.id,
      buildAppointmentDateTime(appointmentDate.value, appointmentTime.value),
    );
    popupVisible.value = false;
    uni.showToast({
      title: "预约时间修改成功",
      icon: "success",
    });
    await refreshList();
  } catch (err) {
    uni.showToast({
      title: err instanceof Error ? err.message : "预约时间修改失败",
      icon: "none",
    });
  } finally {
    updating.value = false;
  }
}
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";
@import "@/styles/mixins.scss";

.work-order-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 0;
  overflow: hidden;
  background: $bg-page;
}

.tabs-wrap {
  flex: 0 0 auto;
  width: 100%;
  background: #fff;
  padding: 0 20rpx;
}

.tabs {
  display: grid;
  align-items: center;
  width: 100%;
  gap: 4rpx;
  padding: 6rpx;
}

.tab-item {
  @include flex-center;
  min-width: 0;
  height: 60rpx;
  padding: 0 2rpx;
  border-radius: $status-radius;
  color: $info-color;
  font-size: 24rpx;
}

.tab-item.active {
  color: $primary-color;
  background: $primary-bg;
}

.search-panel {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 140rpx 80rpx;
  gap: 12rpx;
  align-items: center;
  padding: 26rpx 24rpx 32rpx;
  margin-bottom: 24rpx;
  background: #ffffff;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
  height: 80rpx;
  padding: 0 22rpx;
  border: 2rpx solid $border-color;
  border-radius: $common-radius;
  background: $bg-page;
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 80rpx;
  color: $text-main;
  font-size: 26rpx;
}

.placeholder {
  color: #a4b1c5;
}

.clear-btn {
  @include flex-center;
  flex-shrink: 0;
  width: 44rpx;
  height: 44rpx;
  color: $text-muted;
  font-size: 26rpx;
}

.search-btn {
  @include flex-center;
  gap: 6rpx;
  height: 80rpx;
  line-height: 0rpx;
  border: 2rpx solid $border-color;
  border-radius: $common-radius;
  color: $primary-color;
  font-size: 28rpx;
  background: #fff;
  box-shadow:
    0 3px 14px rgba(4, 46, 138, 0.06),
    0 2px 4px rgba(4, 46, 138, 0.03);
}

.time-sort-btn {
  @include flex-center;
  width: 80rpx;
  height: 80rpx;
  border: 2rpx solid $border-color;
  border-radius: $common-radius;
  background: #fff;
  box-shadow:
    0 3px 14px rgba(4, 46, 138, 0.06),
    0 2px 4px rgba(4, 46, 138, 0.03);
}

.time-sort-icon {
  width: 40rpx;
  height: 40rpx;
}

.total-count {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  min-height: 76rpx;
  margin: 0 24rpx 20rpx;
  padding: 0 22rpx;
  border: 1rpx solid rgba(22, 119, 255, 0.12);
  border-radius: 18rpx;
  background: linear-gradient(90deg, #f8fbff 0%, #eef6ff 100%);
  box-shadow: 0 6rpx 18rpx rgba(22, 119, 255, 0.05);
}

.total-count-label,
.total-count-value {
  display: flex;
  align-items: center;
}

.total-count-label {
  gap: 12rpx;
  color: $info-color;
  font-size: 25rpx;
  font-weight: 600;
}

.total-count-mark {
  width: 7rpx;
  height: 28rpx;
  border-radius: 4rpx;
  background: $primary-color;
  box-shadow: 0 4rpx 10rpx rgba(22, 119, 255, 0.28);
}

.total-count-value {
  gap: 6rpx;
  color: $primary-color;
}

.total-count-number {
  font-size: 34rpx;
  font-weight: 800;
  line-height: 1;
}

.total-count-unit {
  font-size: 23rpx;
  font-weight: 600;
}

.user-list {
  box-sizing: border-box;

  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.user-list-content {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  padding: 0 24rpx 32rpx;
}

.user-card {
  padding: 28rpx 30rpx 30rpx;
  border-radius: $card-radius;
  background: #ffffff;
  box-shadow: 0 16rpx 38rpx rgba(13, 39, 82, 0.06);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.name-line {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12rpx;
}

.household-name {
  @include text-ellipsis;
  color: $text-main;
  font-size: 30rpx;
  font-weight: 800;
  line-height: 42rpx;
}

.phone-icon-btn {
  @include flex-center;
  flex: 0 0 54rpx;
  width: 54rpx;
  height: 54rpx;
  padding: 0;
  border-radius: 50%;
  background: $primary-bg;
}

.phone-icon-btn::after,
.navigate-btn::after {
  border: 0;
}

.status-pill {
  @include flex-center;
  flex-shrink: 0;
  min-width: 116rpx;
  height: 60rpx;
  padding: 0 20rpx;
  border-radius: 40rpx;
  font-size: 26rpx;
  font-weight: 600;
}

.status-pill.is-pending,
.status-pill.is-processing {
  color: $primary-color;
  background: $primary-bg;
}

.status-pill.is-completed {
  color: $success-color;
  background: $success-bg;
}

.status-pill.is-ended,
.status-pill.is-canceled {
  color: $info-color;
  background: $info-bg;
}

.status-pill.is-danger,
.status-pill.is-failed {
  color: $error-color;
  background: $error-bg;
}

.status-pill.is-warning {
  color: $warning-color;
  background: $warning-bg;
}
.number-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24rpx;
  margin-top: 38rpx;
  font-size: 26rpx;
}

.number-item {
  min-width: 0;
}

.number-label {
  display: block;
  color: $text-muted;
  line-height: 32rpx;
}

.number-value {
  @include text-ellipsis;
  display: block;
  margin-top: 4rpx;
  color: $text-main;
  font-weight: 600;
  line-height: 38rpx;
}

.divider {
  height: 2rpx;
  margin: 28rpx 0 24rpx;
  background: #edf1f6;
}

.info-row {
  display: grid;
  grid-template-columns: 34rpx 132rpx minmax(0, 1fr);
  align-items: start;
  column-gap: 8rpx;
  min-width: 0;
  font-size: 26rpx;
}

.info-row + .info-row {
  margin-top: 18rpx;
}

.info-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34rpx;
  height: 34rpx;
}

.info-label {
  color: $text-muted;
  line-height: 36rpx;
}

.info-value {
  @include text-ellipsis;
  text-align: right;
  min-width: 0;
  color: $text-main;
  font-weight: 600;
  line-height: 36rpx;
}

.address-value {
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
}

.card-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 72rpx;
  gap: 24rpx;
  margin-top: 34rpx;
}

.action-btn {
  @include flex-center;
  height: 72rpx;
  padding: 0;
  border-radius: 20rpx;
  font-size: 26rpx;
  font-weight: 800;
}

.appointment-btn {
  color: $primary-color;
  background: $primary-bg;
}

.navigate-btn {
  width: 72rpx;
  border-radius: 24rpx;
  background: $primary-bg;
}

.loading-text,
.footer-text {
  padding: 32rpx 0;
  color: $info-color;
  font-size: 25rpx;
  text-align: center;
}

.error-card {
  margin: 0 24rpx;
  padding: 36rpx 28rpx;
  border-radius: $card-radius;
  background: #ffffff;
  box-shadow: $shadow-card;
}

.error-title {
  color: $error-color;
  font-size: 30rpx;
  font-weight: 700;
}

.error-desc {
  margin-top: 12rpx;
  color: $info-color;
  font-size: 25rpx;
}

.retry-btn {
  @include flex-center;
  width: 180rpx;
  height: 72rpx;
  margin-top: 24rpx;
  border-radius: 36rpx;
  color: #ffffff;
  font-size: 26rpx;
  background: $primary-color;
}

.popup-mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  background: rgba(11, 31, 68, 0.42);
}

.popup {
  width: 100%;
  padding: 34rpx 30rpx calc(34rpx + env(safe-area-inset-bottom));
  border-radius: 34rpx 34rpx 0 0;
  background: #ffffff;
}

.popup-title {
  color: $text-main;
  font-size: 34rpx;
  font-weight: 800;
  text-align: center;
}

.current-time {
  margin-top: 28rpx;
  padding: 24rpx;
  border-radius: 20rpx;
  background: #f7faff;
}

.label {
  display: block;
  color: $info-color;
  font-size: 24rpx;
}

.value {
  display: block;
  margin-top: 8rpx;
  color: $text-main;
  font-size: 30rpx;
  font-weight: 700;
}

.picker-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
  margin-top: 22rpx;
}

.picker-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 88rpx;
  padding: 0 22rpx;
  border-radius: 20rpx;
  color: $text-main;
  font-size: 26rpx;
  background: #f7faff;
}

.popup-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
  margin-top: 34rpx;
}

.popup-btn {
  @include flex-center;
  height: 86rpx;
  border-radius: 43rpx;
  font-size: 28rpx;
  font-weight: 700;
}

.popup-btn.cancel {
  color: $info-color;
  background: $info-bg;
}

.popup-btn.confirm {
  color: #ffffff;
  background: $confirm-btn-bg;
}
</style>
