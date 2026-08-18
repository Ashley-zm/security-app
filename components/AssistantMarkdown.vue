<template>
  <view
    v-if="assets.tables.length || downloadableImages.length"
    class="download-bar"
  >
    <button
      v-for="(table, index) in assets.tables"
      :key="table.id"
      class="download-btn"
      :disabled="Boolean(downloadingKey)"
      @click="downloadTable(table, index)"
    >
      <uni-icons type="download" size="14" color="#1677ff" />
      <text>表格 {{ index + 1 }}</text>
    </button>
    <button
      v-for="(image, index) in downloadableImages"
      :key="'download-' + image"
      class="download-btn"
      :disabled="Boolean(downloadingKey)"
      @click="downloadImage(image, index)"
    >
      <uni-icons type="download" size="14" color="#1677ff" />
      <text>图片 {{ index + 1 }}</text>
    </button>
  </view>
  <rich-text
    class="assistant-markdown"
    :nodes="renderedHtml"
    selectable
    @itemclick="handleItemClick"
  />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import {
  downloadAssistantImage,
  downloadAssistantTable,
} from "@/modules/assistant/download";
import {
  extractAssistantMarkdownAssets,
  renderAssistantMarkdown,
  type AssistantMarkdownTable,
} from "@/modules/assistant/markdown";

const props = withDefaults(
  defineProps<{
    content: string;
    streaming?: boolean;
    images?: string[];
  }>(),
  { streaming: false, images: () => [] },
);

const renderedHtml = ref("");
const downloadingKey = ref("");
const assets = ref(extractAssistantMarkdownAssets(props.content));
const downloadableImages = computed(() =>
  [
    ...new Set([
      ...props.images,
      ...assets.value.images.map((item) => item.url),
    ]),
  ].filter(Boolean),
);

async function runDownload(key: string, task: () => Promise<string>) {
  if (downloadingKey.value) return;
  downloadingKey.value = key;
  uni.showLoading({ title: "正在保存", mask: true });
  try {
    const title = await task();
    uni.showToast({ title, icon: "none" });
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "下载失败",
      icon: "none",
    });
  } finally {
    uni.hideLoading();
    downloadingKey.value = "";
  }
}

function downloadTable(table: AssistantMarkdownTable, index: number) {
  return runDownload(table.id, () => downloadAssistantTable(table, index));
}

function downloadImage(url: string, index: number) {
  return runDownload("image-" + index, () =>
    downloadAssistantImage(url, index),
  );
}

let renderTimer: ReturnType<typeof setTimeout> | undefined;

function renderNow() {
  if (renderTimer) clearTimeout(renderTimer);
  renderTimer = undefined;
  renderedHtml.value = renderAssistantMarkdown(props.content);
  assets.value = extractAssistantMarkdownAssets(props.content);
}

function scheduleRender() {
  if (!props.streaming) {
    renderNow();
    return;
  }
  if (renderTimer) return;
  renderTimer = setTimeout(renderNow, 80);
}

function handleItemClick(event: {
  detail?: { node?: { name?: string; attrs?: Record<string, string> } };
}) {
  const node = event.detail?.node;
  const href = node?.name === "a" ? node.attrs?.href : "";
  if (!href || !/^https?:\/\//i.test(href)) return;

  // #ifdef H5
  window.open(href, "_blank", "noopener,noreferrer");
  // #endif
  // #ifdef APP-PLUS
  plus.runtime.openURL(href);
  // #endif
}

watch(() => [props.content, props.streaming], scheduleRender, {
  immediate: true,
});
onBeforeUnmount(() => {
  if (renderTimer) clearTimeout(renderTimer);
});
</script>

<style scoped lang="scss">
.download-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 14rpx;
}

.download-btn {
  min-height: 48rpx;
  margin: 0;
  padding: 6rpx 14rpx;
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  border: 1rpx solid #b8d6ff;
  border-radius: 24rpx;
  background: #f4f8ff;
  color: #1677ff;
  font-size: 21rpx;
  line-height: 32rpx;
}

.assistant-markdown {
  width: 100%;
  color: #1d2939;
  font-size: 28rpx;
  line-height: 1.7;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.assistant-markdown :deep(p) {
  margin: 0 0 14rpx;
}

.assistant-markdown :deep(p:last-child) {
  margin-bottom: 0;
}

.assistant-markdown :deep(h1),
.assistant-markdown :deep(h2),
.assistant-markdown :deep(h3),
.assistant-markdown :deep(h4),
.assistant-markdown :deep(h5),
.assistant-markdown :deep(h6) {
  margin: 22rpx 0 12rpx;
  color: #101828;
  font-weight: 650;
  line-height: 1.4;
}

.assistant-markdown :deep(h1) {
  font-size: 36rpx;
}

.assistant-markdown :deep(h2) {
  font-size: 33rpx;
}

.assistant-markdown :deep(h3) {
  font-size: 30rpx;
}

.assistant-markdown :deep(ul),
.assistant-markdown :deep(ol) {
  margin: 10rpx 0 16rpx;
  padding-left: 38rpx;
}

.assistant-markdown :deep(li) {
  margin: 6rpx 0;
}

.assistant-markdown :deep(blockquote) {
  margin: 14rpx 0;
  padding: 12rpx 18rpx;
  border-left: 6rpx solid #84adff;
  color: #475467;
  background: #f5f8ff;
}

.assistant-markdown :deep(a) {
  color: #1677ff;
  text-decoration: underline;
  text-underline-offset: 4rpx;
}

.assistant-markdown :deep(code) {
  padding: 2rpx 8rpx;
  border-radius: 6rpx;
  color: #c7254e;
  background: #f2f4f7;
  font-family: Consolas, Monaco, monospace;
  font-size: 24rpx;
}

.assistant-markdown :deep(pre) {
  max-width: 100%;
  margin: 14rpx 0;
  padding: 20rpx;
  border-radius: 14rpx;
  background: #1e293b;
  overflow-x: auto;
  white-space: pre;
}

.assistant-markdown :deep(pre code) {
  padding: 0;
  color: #e2e8f0;
  background: transparent;
  font-size: 23rpx;
  line-height: 1.65;
}

.assistant-markdown :deep(.md-table-scroll) {
  width: 100%;
  margin: 16rpx 0;
  overflow-x: auto;
}

.assistant-markdown :deep(.md-table) {
  width: 100%;
  min-width: 560rpx;
  border-collapse: collapse;
  font-size: 24rpx;
}

.assistant-markdown :deep(th),
.assistant-markdown :deep(td) {
  padding: 12rpx 14rpx;
  border: 1px solid #d0d5dd;
  text-align: left;
  vertical-align: top;
  white-space: normal;
}

.assistant-markdown :deep(th) {
  color: #344054;
  font-weight: 600;
  background: #f2f4f7;
}

.assistant-markdown :deep(hr) {
  height: 1px;
  margin: 20rpx 0;
  border: 0;
  background: #e4e7ec;
}

.assistant-markdown :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 12rpx;
}

.assistant-markdown :deep(.hljs-keyword),
.assistant-markdown :deep(.hljs-selector-tag),
.assistant-markdown :deep(.hljs-literal) {
  color: #c792ea;
}

.assistant-markdown :deep(.hljs-string),
.assistant-markdown :deep(.hljs-attr) {
  color: #c3e88d;
}

.assistant-markdown :deep(.hljs-number),
.assistant-markdown :deep(.hljs-symbol) {
  color: #f78c6c;
}

.assistant-markdown :deep(.hljs-title),
.assistant-markdown :deep(.hljs-function) {
  color: #82aaff;
}

.assistant-markdown :deep(.hljs-comment) {
  color: #7f8c98;
}
</style>
