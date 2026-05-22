<template>
  <view class="assistant-page page safe-page">
    <AppNavbar title="安检助手" show-back right-icon="trash" @right-click="clearMessages" />

    <scroll-view class="assistant-scroll" scroll-y :scroll-into-view="scrollIntoView" scroll-with-animation>
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
            <view class="hero-subtitle">面向入户安检现场的流程、隐患和记录建议</view>
          </view>
        </view>
        <view class="hero-metrics">
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
        </view>
      </view>

      <view class="section-head">
        <view>
          <text class="section-title">快捷咨询</text>
          <text class="section-subtitle">选择常见场景，快速生成现场建议</text>
        </view>
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
          <view class="question-icon">{{ item.icon }}</view>
          <view class="question-copy">
            <text class="question-title">{{ item.title }}</text>
            <text class="question-desc">{{ item.desc }}</text>
          </view>
        </button>
      </view>

      <view class="chat-list">
        <view
          v-for="message in messages"
          :id="`msg-${message.id}`"
          :key="message.id"
          class="chat-row"
          :class="message.role"
        >
          <view class="avatar">
            <text>{{ message.role === 'assistant' ? 'AI' : '我' }}</text>
          </view>
          <view class="bubble">
            <view class="bubble-head">
              <text class="role-name">{{ message.role === 'assistant' ? '安检助手' : '现场提问' }}</text>
            </view>
            <text class="bubble-text">{{ message.content }}</text>

            <view v-if="message.checklist?.length" class="answer-block">
              <view class="answer-title">
                <text class="answer-title-icon">✓</text>
                <text>现场清单</text>
              </view>
              <view v-for="item in message.checklist" :key="item" class="check-item">
                <text class="check-dot" />
                <text>{{ item }}</text>
              </view>
            </view>

            <view v-if="message.references?.length" class="reference-list">
              <text v-for="item in message.references" :key="item" class="reference-tag">{{ item }}</text>
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

            <button v-if="message.role === 'assistant'" class="copy-btn" @click="copyMessage(message.content)">
              <text class="copy-icon">⧉</text>
              <text>复制建议</text>
            </button>
          </view>
        </view>

        <view v-if="loading" id="assistant-loading" class="chat-row assistant">
          <view class="avatar">AI</view>
          <view class="bubble loading-bubble">
            <text class="typing-dot" />
            <text class="typing-dot" />
            <text class="typing-dot" />
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="composer">
      <view class="input-panel">
        <view class="input-badge">问</view>
        <textarea
          v-model="inputValue"
          class="question-input"
          auto-height
          maxlength="120"
          placeholder="请输入安检现场问题"
          :disabled="loading"
          confirm-type="send"
          @confirm="sendQuestion"
        />
      </view>
      <button class="send-btn" :class="{ disabled: !canSend }" :disabled="!canSend" @click="sendQuestion">发送</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { askAssistantApi } from '@/api/assistant'
import AppNavbar from '@/components/AppNavbar.vue'
import type { AssistantAnswer } from '@/types/assistant'

interface ChatMessage {
  id: string
  role: 'assistant' | 'user'
  content: string
  checklist?: string[]
  suggestions?: string[]
  references?: string[]
}

const questionCards = [
  {
    title: '入户安检标准流程',
    desc: '按步骤核验、检查、记录',
    icon: '流',
    type: 'process'
  },
  {
    title: '燃气泄漏如何处置',
    desc: '紧急处置和上报建议',
    icon: '险',
    type: 'risk'
  },
  {
    title: '阀门老化检查要点',
    desc: '识别锈蚀、松动和关闭不严',
    icon: '阀',
    type: 'valve'
  },
  {
    title: '用户不在家如何记录',
    desc: '到访凭证和改约备注',
    icon: '记',
    type: 'record'
  }
]

const welcomeMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: '你好，我可以协助查询安检流程、隐患处置、工单记录和燃气安全知识。你可以直接输入问题，也可以点击上方快捷咨询。',
  suggestions: ['燃气泄漏如何处置', '入户安检标准流程']
}

const messages = ref<ChatMessage[]>([{ ...welcomeMessage }])
const inputValue = ref('')
const loading = ref(false)
const scrollIntoView = ref('')

const canSend = computed(() => inputValue.value.trim().length > 0 && !loading.value)

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

async function askQuestion(question: string) {
  const text = question.trim()
  if (!text || loading.value) return

  messages.value.push({
    id: createId('user'),
    role: 'user',
    content: text
  })
  inputValue.value = ''
  await scrollToBottom()

  loading.value = true
  scrollIntoView.value = 'assistant-loading'

  try {
    const answer = await askAssistantApi({ question: text })
    messages.value.push(toAssistantMessage(answer))
  } catch (error) {
    messages.value.push({
      id: createId('assistant'),
      role: 'assistant',
      content: error instanceof Error ? error.message : '助手暂时无法响应，请稍后再试。'
    })
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}

function sendQuestion() {
  if (!canSend.value) return
  askQuestion(inputValue.value)
}

function toAssistantMessage(answer: AssistantAnswer): ChatMessage {
  return {
    id: answer.id,
    role: 'assistant',
    content: answer.answer,
    checklist: answer.checklist,
    suggestions: answer.suggestions,
    references: answer.references
  }
}

async function scrollToBottom() {
  await nextTick()
  const last = messages.value[messages.value.length - 1]
  if (last) {
    scrollIntoView.value = `msg-${last.id}`
  }
}

function copyMessage(content: string) {
  uni.setClipboardData({
    data: content,
    success: () => {
      uni.showToast({
        title: '已复制',
        icon: 'success'
      })
    }
  })
}

function clearMessages() {
  uni.showModal({
    title: '清空对话',
    content: '是否清空当前安检助手对话？',
    confirmColor: '#1677ff',
    success: (res) => {
      if (!res.confirm) return
      messages.value = [{ ...welcomeMessage }]
      inputValue.value = ''
      scrollToBottom()
    }
  })
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.assistant-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 0 24rpx;
  overflow: hidden;
  background:
    linear-gradient(180deg, #edf5ff 0%, #f6f9ff 38%, #f5f8ff 100%);
}

.assistant-scroll {
  flex: 1;
  min-height: 0;
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

.section-head {
  margin: 30rpx 4rpx 18rpx;
}

.section-subtitle {
  display: block;
  margin-top: 8rpx;
  color: $text-secondary;
  font-size: 23rpx;
}

.quick-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.question-item {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  min-height: 128rpx;
  padding: 20rpx;
  border: 2rpx solid #ffffff;
  border-radius: 22rpx;
  text-align: left;
  background: #ffffff;
  box-shadow: 0 12rpx 26rpx rgba(28, 83, 171, 0.07);
}

.question-icon {
  @include flex-center;
  flex: 0 0 48rpx;
  width: 48rpx;
  height: 48rpx;
  border-radius: 16rpx;
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 800;
}

.question-process .question-icon {
  background: linear-gradient(135deg, #1677ff 0%, #52a6ff 100%);
}

.question-risk .question-icon {
  background: linear-gradient(135deg, #ff6b4a 0%, #ffb04c 100%);
}

.question-valve .question-icon {
  background: linear-gradient(135deg, #19be6b 0%, #63d895 100%);
}

.question-record .question-icon {
  background: linear-gradient(135deg, #6f61ff 0%, #4aa6ff 100%);
}

.question-copy {
  min-width: 0;
}

.question-title,
.question-desc {
  display: block;
}

.question-title {
  color: $text-main;
  font-size: 26rpx;
  font-weight: 800;
  line-height: 1.25;
}

.question-desc {
  margin-top: 10rpx;
  color: $text-secondary;
  font-size: 22rpx;
  line-height: 1.35;
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
  background: linear-gradient(135deg, #1677ff 0%, #38a4ff 100%);
  box-shadow: 0 12rpx 24rpx rgba(22, 119, 255, 0.16);
}

.bubble-head {
  margin-bottom: 12rpx;
}

.role-name {
  color: $text-muted;
  font-size: 21rpx;
  font-weight: 700;
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
  color: $text-secondary;
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
  color: $text-secondary;
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

.loading-bubble {
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 100rpx;
  min-height: 58rpx;
}

.typing-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: $text-muted;
}

.composer {
  display: flex;
  align-items: center;
  gap: 14rpx;
  width: 100%;
  padding: 18rpx 0 calc(18rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(245, 248, 255, 0) 0%, #f5f8ff 20%, #f5f8ff 100%);
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
  line-height: 1.45;
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
  background: linear-gradient(135deg, #1677ff 0%, #38a4ff 100%);
  box-shadow: 0 12rpx 22rpx rgba(22, 119, 255, 0.22);
}

.send-btn.disabled {
  color: #ffffff;
  background: #c8d4e8;
  box-shadow: none;
}
</style>
