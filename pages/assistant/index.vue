<template>
  <view class="assistant-page page safe-page">
    <AppNavbar
      title="安检助手"
      show-back
      right-icon="trash"
      @right-click="clearMessages"
    />

    <scroll-view
      class="assistant-scroll"
      scroll-y
      :scroll-into-view="scrollIntoView"
      scroll-with-animation
    >
      <view class="hero-card">
        <view class="hero-glow" />
        <view class="hero-main">
          <view class="robot-shell">
            <view class="robot-mark">AI</view>
          </view>
          <view>
            <view class="status-pill">
              <text class="status-dot" />
              <text>在线辅助</text>
            </view>
            <view class="hero-title">AI安检助手</view>
            <view class="hero-subtitle"
              >面向入户安检现场的流程、隐患和记录建议</view
            >
          </view>
        </view>
        <!-- <view class="hero-metrics">
          <view class="metric-item">
            <text class="metric-num">3</text>
            <text class="metric-label">步处置</text>
          </view>
          <view class="metric-item">
            <text class="metric-num">5</text>
            <text class="metric-label">类场景</text>
          </view>
          <view class="metric-item">
            <text class="metric-num">24h</text>
            <text class="metric-label">随时问</text>
          </view>
        </view> -->
      </view>

      <view class="chat-list">
        <view
          v-for="message in messages"
          :id="`msg-${message.id}`"
          :key="message.id"
          v-show="message.role !== 'assistant' || message.content"
          class="chat-row"
          :class="message.role"
        >
          <view class="avatar">
            <text>{{ message.role === "assistant" ? "AI" : "我" }}</text>
          </view>
          <view class="bubble">
            <view class="bubble-head">
              <text class="role-name">
                {{ message.role === "assistant" ? "安检助手" : "现场提问" }}
              </text>
              <text
                v-if="
                  message.role === 'assistant' &&
                  message.durationMs !== undefined
                "
                class="response-time"
              >
                耗时 {{ formatDuration(message.durationMs) }}
              </text>
            </view>
            <text class="bubble-text">{{ message.content }}</text>

            <view v-if="message.checklist?.length" class="answer-block">
              <view class="answer-title">
                <text class="answer-title-icon">✓</text>
                <text>现场清单</text>
              </view>
              <view
                v-for="item in message.checklist"
                :key="item"
                class="check-item"
              >
                <text class="check-dot" />
                <text>{{ item }}</text>
              </view>
            </view>

            <view v-if="message.references?.length" class="reference-list">
              <text
                v-for="item in message.references"
                :key="item"
                class="reference-tag"
                >{{ item }}
              </text>
            </view>

            <view v-if="message.suggestions?.length" class="suggest-list">
              <button
                v-for="item in message.suggestions"
                :key="item"
                class="suggest-item"
                :disabled="loading"
                @click="askQuestion(item)"
              >
                {{ item }}
              </button>
            </view>

            <button
              v-if="message.role === 'assistant'"
              class="copy-btn"
              @click="copyMessage(message.content)"
            >
              <text class="copy-icon">⧉</text>
              <text>复制建议</text>
            </button>
          </view>
        </view>

        <view
          v-if="thinking"
          id="assistant-thinking"
          class="chat-row assistant thinking-row"
        >
          <view class="avatar">AI</view>
          <view class="bubble thinking-bubble">
            <view class="thinking-head">
              <text class="thinking-title">AI 正在思考</text>
              <view class="thinking-dots">
                <text class="typing-dot" />
                <text class="typing-dot" />
                <text class="typing-dot" />
              </view>
            </view>
            <text class="thinking-tip">正在分析问题并整理现场建议</text>
          </view>
        </view>
        <view id="chat-bottom" class="chat-bottom-anchor" />
      </view>
    </scroll-view>

    <view class="composer">
      <view class="quick-consult">
        <view class="quick-consult-head">
          <text class="quick-consult-title">快捷咨询</text>
          <text class="quick-consult-tip">点击即可提问</text>
        </view>
        <view class="quick-list">
          <button
            v-for="item in questionCards"
            :key="item.title"
            class="question-item"
            :class="`question-${item.type}`"
            :disabled="loading"
            @click="askQuestion(item.title)"
          >
            <text class="question-dot" />
            <text class="question-title">{{ item.title }}</text>
          </button>
        </view>
      </view>
      <view class="composer-row">
        <view class="input-panel">
          <view class="input-badge">问</view>
          <textarea
            v-model="inputValue"
            class="question-input"
            auto-height
            maxlength="120"
            placeholder="请输入安检问题..."
            :disabled="loading"
            confirm-type="send"
            @confirm="sendQuestion"
          />
        </view>
        <button
          class="send-btn"
          :class="{ disabled: !canSend }"
          :disabled="!canSend"
          aria-label="发送"
          @click="sendQuestion"
        >
          <image
            class="send-icon"
            src="/static/images/assistant/send.svg"
            mode="aspectFit"
          />
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { askAssistantStreamApi } from "@/modules/assistant/api";
import AppNavbar from "@/components/AppNavbar.vue";
import type {
  AssistantAnswer,
  AssistantConversationMessage,
} from "@/modules/assistant/types";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  checklist?: string[];
  suggestions?: string[];
  references?: string[];
  durationMs?: number;
}

const questionCards = [
  {
    title: "入户安检标准流程",
    desc: "按步骤核验、检查、记录",
    icon: "流",
    type: "process",
  },
  {
    title: "燃气泄漏如何处置",
    desc: "紧急处置和上报建议",
    icon: "险",
    type: "risk",
  },
  {
    title: "阀门老化检查要点",
    desc: "识别锈蚀、松动和关闭不严",
    icon: "阀",
    type: "valve",
  },
  {
    title: "用户不在家如何记录",
    desc: "到访凭证和改约备注",
    icon: "记",
    type: "record",
  },
];

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "你好，我可以协助查询安检流程、隐患处置、工单记录和燃气安全知识。你可以直接输入问题，也可以点击上方快捷咨询。",
  suggestions: ["燃气泄漏如何处置", "入户安检标准流程"],
};

const messages = ref<ChatMessage[]>([{ ...welcomeMessage }]);
const inputValue = ref("");
const loading = ref(false);
const thinking = ref(false);
const scrollIntoView = ref("");

const canSend = computed(
  () => inputValue.value.trim().length > 0 && !loading.value,
);

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function askQuestion(question: string) {
  const text = question.trim();
  if (!text || loading.value) return;
  const startedAt = Date.now();

  messages.value.push({
    id: createId("user"),
    role: "user",
    content: text,
  });
  inputValue.value = "";
  await scrollToBottom();

  loading.value = true;
  thinking.value = true;
  await nextTick();
  scrollIntoView.value = "assistant-thinking";

  try {
    const history: AssistantConversationMessage[] = messages.value
      .slice(1, -1)
      .map((message) => ({ role: message.role, content: message.content }));
    const streamingMessage: ChatMessage = {
      id: createId("assistant"),
      role: "assistant",
      content: "",
    };
    messages.value.push(streamingMessage);
    const answer = await askAssistantStreamApi(
      { question: text, history },
      (content) => {
        thinking.value = false;
        const target = messages.value.find(
          (message) => message.id === streamingMessage.id,
        );
        if (target) target.content = content;
        void scrollToBottom();
      },
    );
    thinking.value = false;
    const target = messages.value.find(
      (message) => message.id === streamingMessage.id,
    );
    if (target) {
      Object.assign(target, toAssistantMessage(answer), {
        id: streamingMessage.id,
        durationMs: Date.now() - startedAt,
      });
    }
  } catch (error) {
    messages.value.push({
      id: createId("assistant"),
      role: "assistant",
      content:
        error instanceof Error
          ? error.message
          : "助手暂时无法响应，请稍后再试。",
    });
  } finally {
    thinking.value = false;
    loading.value = false;
    await scrollToBottom();
  }
}

function sendQuestion() {
  if (!canSend.value) return;
  askQuestion(inputValue.value);
}

function formatDuration(durationMs: number) {
  if (durationMs < 1000) return `${durationMs}ms`;
  return `${(durationMs / 1000).toFixed(1)}s`;
}

function toAssistantMessage(answer: AssistantAnswer): ChatMessage {
  return {
    id: answer.id,
    role: "assistant",
    content: answer.answer,
    checklist: answer.checklist,
    suggestions: answer.suggestions,
    references: answer.references,
  };
}

async function scrollToBottom() {
  scrollIntoView.value = "";
  await nextTick();
  scrollIntoView.value = "chat-bottom";
}

function copyMessage(content: string) {
  uni.setClipboardData({
    data: content,
    success: () => {
      uni.showToast({
        title: "已复制",
        icon: "success",
      });
    },
  });
}

function clearMessages() {
  uni.showModal({
    title: "清空对话",
    content: "是否清空当前安检助手对话？",
    confirmColor: "#1677ff",
    success: (res) => {
      if (!res.confirm) return;
      messages.value = [{ ...welcomeMessage }];
      inputValue.value = "";
      scrollToBottom();
    },
  });
}
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";
@import "@/styles/mixins.scss";

.assistant-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #edf5ff 0%, #f6f9ff 38%, #f5f8ff 100%);
}

.assistant-scroll {
  flex: 1;
  padding: 0 24rpx;
  min-height: 0;
  width: auto;
}

.hero-card {
  position: relative;
  margin-top: 14rpx;
  padding: 28rpx;
  overflow: hidden;
  border-radius: 24rpx;
  color: #ffffff;
  background: linear-gradient(135deg, #0f62d8 0%, #1688ff 52%, #25b8c7 100%);
  box-shadow: 0 18rpx 36rpx rgba(22, 119, 255, 0.2);
}

.hero-glow {
  position: absolute;
  right: -44rpx;
  top: -56rpx;
  width: 210rpx;
  height: 210rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
}

.hero-main {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.robot-shell {
  @include flex-center;
  flex: 0 0 88rpx;
  width: 88rpx;
  height: 88rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.16);
  box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.24);
}

.robot-mark {
  @include flex-center;
  width: 68rpx;
  height: 68rpx;
  border-radius: 22rpx;
  color: $primary-color;
  font-size: 25rpx;
  font-weight: 900;
  background: #ffffff;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  height: 34rpx;
  padding: 0 14rpx;
  border-radius: 17rpx;
  color: rgba(255, 255, 255, 0.92);
  font-size: 20rpx;
  background: rgba(255, 255, 255, 0.16);
}

.status-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: #52f0a3;
}

.hero-title {
  margin-top: 10rpx;
  font-size: 40rpx;
  font-weight: 900;
  line-height: 1.1;
}

.hero-subtitle {
  margin-top: 10rpx;
  color: rgba(255, 255, 255, 0.84);
  font-size: 24rpx;
  line-height: 1.45;
}

.hero-metrics {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14rpx;
  margin-top: 26rpx;
}

.metric-item {
  min-height: 92rpx;
  padding: 16rpx 14rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.14);
  box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.16);
}

.metric-num,
.metric-label {
  display: block;
}

.metric-num {
  font-size: 30rpx;
  font-weight: 900;
}

.metric-label {
  margin-top: 8rpx;
  color: rgba(255, 255, 255, 0.78);
  font-size: 21rpx;
}

.chat-list {
  padding: 30rpx 0 28rpx;
}

.chat-row {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  margin-bottom: 26rpx;
}

.chat-row.user {
  flex-direction: row-reverse;
}

.avatar {
  @include flex-center;
  flex: 0 0 58rpx;
  width: 58rpx;
  height: 58rpx;
  border: 4rpx solid #ffffff;
  border-radius: 20rpx;
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 800;
  background: linear-gradient(135deg, #1677ff 0%, #2fb8ff 100%);
  box-shadow: 0 10rpx 18rpx rgba(22, 119, 255, 0.18);
}

.chat-row.user .avatar {
  background: linear-gradient(135deg, #19be6b 0%, #62d594 100%);
  box-shadow: 0 10rpx 18rpx rgba(25, 190, 107, 0.18);
}

.bubble {
  max-width: 600rpx;
  padding: 22rpx 24rpx;
  border: 2rpx solid #edf2fb;
  border-radius: 8rpx 24rpx 24rpx;
  color: $text-main;
  font-size: 27rpx;
  line-height: 1.55;
  background: #ffffff;
  box-shadow: 0 12rpx 28rpx rgba(28, 83, 171, 0.07);
}

.chat-row.user .bubble {
  border: 0;
  border-radius: 24rpx 8rpx 24rpx 24rpx;
  color: #ffffff;
  background: $confirm-btn-bg;
  box-shadow: 0 12rpx 24rpx rgba(22, 119, 255, 0.16);
}

.bubble-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 12rpx;
}

.role-name {
  color: $text-muted;
  font-size: 21rpx;
  font-weight: 700;
}

.response-time {
  flex-shrink: 0;
  color: $text-muted;
  font-size: 20rpx;
}

.chat-row.user .role-name {
  color: rgba(255, 255, 255, 0.76);
}

.bubble-text {
  display: block;
  white-space: pre-wrap;
  word-break: break-word;
}

.answer-block {
  margin-top: 20rpx;
  padding: 18rpx 18rpx 20rpx;
  border: 2rpx solid #e7f0ff;
  border-radius: 20rpx;
  background: #f5f8ff;
}

.answer-title {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 12rpx;
  color: $text-main;
  font-size: 25rpx;
  font-weight: 700;
}

.answer-title-icon {
  @include flex-center;
  width: 30rpx;
  height: 30rpx;
  border-radius: 50%;
  color: #ffffff;
  font-size: 18rpx;
  background: $success-color;
}

.check-item {
  display: flex;
  align-items: flex-start;
  gap: 10rpx;
  margin-top: 10rpx;
  color: $info-color;
  font-size: 24rpx;
  line-height: 1.45;
}

.check-dot {
  flex: 0 0 9rpx;
  width: 9rpx;
  height: 9rpx;
  margin-top: 13rpx;
  border-radius: 50%;
  background: $primary-color;
}

.reference-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 18rpx;
}

.reference-tag {
  padding: 8rpx 13rpx;
  border-radius: 8rpx;
  color: $info-color;
  font-size: 21rpx;
  background: #eef5ff;
}

.suggest-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 18rpx;
}

.suggest-item {
  min-height: 56rpx;
  line-height: 56rpx;
  text-align: left;
  padding: 0 18rpx;
  border: 2rpx solid rgba(22, 119, 255, 0.1);
  border-radius: 12rpx;
  color: $primary-color;
  font-size: 23rpx;
  background: #ffffff;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 18rpx;
  color: $primary-color;
  font-size: 24rpx;
  text-align: left;
}

.copy-icon {
  font-size: 25rpx;
}

.thinking-bubble {
  display: flex;
  flex-direction: column;
  min-width: 300rpx;
  padding: 20rpx 24rpx;
}

.thinking-head {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.thinking-title {
  color: $text-main;
  font-size: 25rpx;
  font-weight: 700;
}

.thinking-dots {
  display: flex;
  align-items: center;
  gap: 7rpx;
}

.thinking-tip {
  margin-top: 8rpx;
  color: $text-muted;
  font-size: 21rpx;
}

.typing-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: $primary-color;
  animation: thinking-pulse 1.2s ease-in-out infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.16s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.32s;
}

.chat-bottom-anchor {
  width: 100%;
  height: 1rpx;
}

@keyframes thinking-pulse {
  0%,
  60%,
  100% {
    opacity: 0.28;
    transform: translateY(0);
  }

  30% {
    opacity: 1;
    transform: translateY(-5rpx);
  }
}

.composer {
  padding: 18rpx 24rpx calc(18rpx + env(safe-area-inset-bottom));
  width: 100%;
  background: linear-gradient(
    180deg,
    rgba(245, 248, 255, 0) 0%,
    #f5f8ff 20%,
    #f5f8ff 100%
  );
}

.quick-consult {
  margin-bottom: 16rpx;
}

.quick-consult-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14rpx;
  padding: 0 4rpx;
}

.quick-consult-title {
  color: $text-main;
  font-size: 25rpx;
  font-weight: 800;
}

.quick-consult-tip {
  color: $text-muted;
  font-size: 21rpx;
}

.quick-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.question-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  min-width: 0;
  min-height: 66rpx;
  padding: 0 18rpx;
  border: 2rpx solid rgba(22, 119, 255, 0.38);
  border-radius: 18rpx;
  color: $primary-color;
  text-align: left;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 6rpx 16rpx rgba(28, 83, 171, 0.05);
}

.question-item:active {
  background: #edf5ff;
  transform: scale(0.985);
}

.question-item[disabled] {
  opacity: 0.55;
}

.question-dot {
  flex: 0 0 10rpx;
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: $primary-color;
}

.question-risk .question-dot {
  background: #ff7a45;
}

.question-valve .question-dot {
  background: $success-color;
}

.question-record .question-dot {
  background: #7467f0;
}

.question-title {
  overflow: hidden;
  color: inherit;
  font-size: 23rpx;
  font-weight: 600;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.composer-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.input-panel {
  display: flex;
  align-items: center;
  gap: 14rpx;
  flex: 1;
  min-width: 0;
  height: 84rpx;
  padding: 12rpx 16rpx;
  border: 2rpx solid #dde8f8;
  border-radius: 26rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 26rpx rgba(28, 83, 171, 0.08);
}

.input-badge {
  @include flex-center;
  flex: 0 0 48rpx;
  width: 48rpx;
  height: 48rpx;
  border-radius: 16rpx;
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 800;
  background: $primary-color;
}

.question-input {
  flex: 1;
  width: 100%;
  min-width: 0;
  height: 56rpx;
  min-height: 56rpx;
  max-height: 56rpx;
  padding: 8rpx 0;
  border: 0;
  color: $text-main;
  font-size: 27rpx;
  // line-height: 1.45;
  background: transparent;
}

.send-btn {
  @include flex-center;
  flex: 0 0 96rpx;
  width: 96rpx;
  height: 84rpx;
  border-radius: 26rpx;
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 700;
  background: $confirm-btn-bg;
  box-shadow: 0 12rpx 22rpx rgba(22, 119, 255, 0.22);
}

.send-icon {
  width: 40rpx;
  height: 40rpx;
  filter: brightness(0) invert(1);
}

.send-btn.disabled {
  color: #ffffff;
  background: #c8d4e8;
  box-shadow: none;
}
</style>
