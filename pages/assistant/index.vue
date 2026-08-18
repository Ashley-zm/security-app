<template>
  <view class="assistant-page">
    <AppNavbar
      title="安检助手"
      show-back
      right-icon="☰"
      @right-click="historyVisible = true"
    />

    <view class="session-bar">
      <view class="session-summary" @click="historyVisible = true">
        <text class="session-label">当前会话</text>
        <text class="session-name">{{ currentSessionName }}</text>
      </view>
      <button class="new-session-btn" :disabled="busy" @click="startNewSession">
        ＋ 新对话
      </button>
    </view>

    <scroll-view
      class="message-scroll"
      scroll-y
      :scroll-into-view="scrollIntoView"
      scroll-with-animation
    >
      <view v-if="initializing" class="state-card">
        <view class="loading-dot" />
        <text>正在连接安检 Agent...</text>
      </view>

      <view v-else-if="initError" class="state-card error-state">
        <text class="state-title">助手初始化失败</text>
        <text class="state-desc">{{ initError }}</text>
        <button class="retry-btn" @click="initialize">重新连接</button>
      </view>

      <view v-else class="message-list">
        <view v-if="!messages.length" class="welcome-card">
          <view class="welcome-icon">AI</view>
          <text class="welcome-title">你好，我是安检助手</text>
          <text class="welcome-desc">
            可以咨询安检流程、隐患处置和记录规范，也可以上传现场图片让我协助分析。
          </text>
          <view class="quick-grid">
            <button
              v-for="item in questionCards"
              :key="item"
              class="quick-item"
              :disabled="busy"
              @click="askQuestion(item)"
            >
              {{ item }}
            </button>
          </view>
        </view>

        <view
          v-for="message in messages"
          :id="`message-${message.id}`"
          :key="message.id"
          class="message-row"
          :class="message.role"
        >
          <view class="avatar">{{
            message.role === "assistant" ? "AI" : "我"
          }}</view>
          <view class="message-main">
            <text class="role-name">
              {{ message.role === "assistant" ? agentName : "现场提问" }}
            </text>
            <view class="bubble" :class="{ failed: message.failed }">
              <view v-if="message.images.length" class="message-images">
                <image
                  v-for="(image, imageIndex) in message.images"
                  :key="`${message.id}-${imageIndex}`"
                  class="message-image"
                  :src="image"
                  mode="aspectFill"
                  @click="previewImages(message.images, imageIndex)"
                />
              </view>
              <text v-if="message.text" class="message-text" selectable>
                {{ message.text }}
              </text>
              <view v-if="message.streaming && !message.text" class="thinking">
                <text>正在分析</text>
                <view class="typing-dots">
                  <text />
                  <text />
                  <text />
                </view>
              </view>
            </view>
            <button
              v-if="message.role === 'assistant' && message.text"
              class="copy-btn"
              @click="copyMessage(message.text)"
            >
              复制
            </button>
          </view>
        </view>
        <view id="message-bottom" class="bottom-anchor" />
      </view>
    </scroll-view>

    <view class="composer">
      <scroll-view
        v-if="draftImages.length"
        class="draft-scroll"
        scroll-x
        show-scrollbar="false"
      >
        <view class="draft-list">
          <view
            v-for="(image, index) in draftImages"
            :key="image.id"
            class="draft-image-wrap"
          >
            <image
              class="draft-image"
              :src="image.path"
              mode="aspectFill"
              @click="previewDraft(index)"
            />
            <button class="remove-image" @click="removeDraftImage(image.id)">
              ×
            </button>
          </view>
        </view>
      </scroll-view>

      <view class="composer-row">
        <button
          class="image-btn"
          :disabled="busy || uploadingImages || draftImages.length >= 4"
          @click="chooseImages"
        >
          <text class="image-icon">＋</text>
          <text>{{ uploadingImages ? "读取中" : "图片" }}</text>
        </button>
        <textarea
          v-model="inputValue"
          class="question-input"
          auto-height
          maxlength="1000"
          placeholder="输入问题，或上传现场图片..."
          :disabled="busy"
          confirm-type="send"
          @confirm="sendQuestion"
        />
        <button
          v-if="isCurrentSessionRunning"
          class="send-btn stop-btn"
          :class="{ disabled: !canInterrupt }"
          :disabled="!canInterrupt"
          @click="interruptReply"
        >
          {{ interrupting ? "停止中" : "停止" }}
        </button>
        <button
          v-else
          class="send-btn"
          :class="{ disabled: !canSend }"
          :disabled="!canSend"
          @click="sendQuestion"
        >
          发送
        </button>
      </view>
      <text class="composer-tip">支持 JPG、PNG、GIF、WebP，最多 4 张</text>
    </view>

    <view
      v-if="historyVisible"
      class="drawer-mask"
      @click="historyVisible = false"
    >
      <view
        class="history-drawer"
        :style="{ paddingTop: drawerTopPadding }"
        @click.stop
      >
        <view class="drawer-head">
          <view>
            <text class="drawer-title">历史会话</text>
            <text class="drawer-count">{{ sessions.length }} 条</text>
          </view>
          <button class="close-btn" @click="historyVisible = false">×</button>
        </view>
        <button
          class="drawer-new-btn"
          :disabled="busy"
          @click="startNewSession"
        >
          ＋ 新建会话
        </button>
        <scroll-view class="session-list" scroll-y>
          <view v-if="sessionsLoading" class="drawer-empty">加载中...</view>
          <view v-else-if="!sessions.length" class="drawer-empty">
            暂无历史会话
          </view>
          <view
            v-for="item in sessions"
            :key="item.session.id"
            class="session-item"
            :class="{ active: item.session.id === currentRecordId }"
            @click="selectSession(item)"
          >
            <view class="session-copy">
              <text class="session-item-name">
                {{ item.session.config.name || "未命名会话" }}
              </text>
              <text class="session-time">
                {{
                  formatTime(item.session.updated_at || item.session.created_at)
                }}
              </text>
            </view>
            <view class="session-actions">
              <button
                class="action-btn"
                aria-label="重命名会话"
                @click.stop="openRename(item)"
              >
                <uni-icons type="compose" color="#667085" size="18" />
              </button>
              <button
                class="action-btn danger"
                aria-label="删除会话"
                @click.stop="confirmDelete(item)"
              >
                <uni-icons type="trash" color="#d92d20" size="18" />
              </button>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <view v-if="renameTarget" class="dialog-mask" @click="closeRename">
      <view class="rename-dialog" @click.stop>
        <text class="dialog-title">重命名会话</text>
        <input
          v-model="renameValue"
          class="rename-input"
          maxlength="40"
          focus
          placeholder="请输入会话名称"
        />
        <view class="dialog-actions">
          <button class="dialog-btn" @click="closeRename">取消</button>
          <button
            class="dialog-btn primary"
            :disabled="!renameValue.trim()"
            @click="submitRename"
          >
            保存
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import AppNavbar from "@/components/AppNavbar.vue";
import {
  createAssistantSessionApi,
  deleteAssistantSessionApi,
  getAssistantAgentsApi,
  getAssistantCredentialsApi,
  getAssistantKnowledgeBaseApi,
  getAssistantMessagesApi,
  getAssistantModelsApi,
  getAssistantSessionsApi,
  getMessageImages,
  getMessageText,
  imagePathToBase64,
  interruptAssistantSessionApi,
  sendAssistantMessageApi,
  streamAssistantReplyApi,
  updateAssistantSessionApi,
} from "@/modules/assistant/api";
import type {
  AssistantCredential,
  AssistantImageDraft,
  AssistantKnowledgeBase,
  AssistantKnowledgeConfig,
  AssistantMessage,
  AssistantModelConfig,
  AssistantSessionItem,
} from "@/modules/assistant/types";

interface ViewMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  images: string[];
  streaming?: boolean;
  failed?: boolean;
}
const DEFAULT_MODEL = import.meta.env.VITE_ASSISTANT_MODEL || "gpt-5.5";
const systemInfo = uni.getSystemInfoSync();
const drawerTopPadding = `${
  Math.max(
    systemInfo.statusBarHeight || 0,
    systemInfo.safeAreaInsets?.top || 0,
  ) + uni.upx2px(28)
}px`;

const questionCards = [
  "入户安检标准流程",
  "燃气泄漏如何处置",
  "阀门老化检查要点",
  "用户不在家如何记录",
];

const initializing = ref(true);
const initError = ref("");
const sessionsLoading = ref(false);
const messagesLoading = ref(false);
const sending = ref(false);
const interrupting = ref(false);
const streamReady = ref(false);
const uploadingImages = ref(false);
const historyVisible = ref(false);
const sessions = ref<AssistantSessionItem[]>([]);
const knowledgeBases = ref<AssistantKnowledgeBase[]>([]);
const messages = ref<ViewMessage[]>([]);
const draftImages = ref<AssistantImageDraft[]>([]);
const inputValue = ref("");
const scrollIntoView = ref("");
const agentId = ref("");
const agentName = ref("安检助手");
const modelConfig = ref<AssistantModelConfig>();
const currentRecordId = ref("");
const currentRuntimeId = ref("");
const renameTarget = ref<AssistantSessionItem>();
const renameValue = ref("");
let activeStreamRequest: ReturnType<typeof streamAssistantReplyApi> | undefined;
let interruptRequested = false;

const currentSessionItem = computed(() =>
  sessions.value.find((item) => item.session.id === currentRecordId.value),
);
const isCurrentSessionRunning = computed(
  () => sending.value || Boolean(currentSessionItem.value?.is_running),
);
const canInterrupt = computed(
  () =>
    isCurrentSessionRunning.value &&
    !interrupting.value &&
    (streamReady.value ||
      (!sending.value && Boolean(currentSessionItem.value?.is_running))) &&
    Boolean(agentId.value && currentRecordId.value),
);

const busy = computed(
  () =>
    initializing.value ||
    messagesLoading.value ||
    sending.value ||
    uploadingImages.value,
);
const canSend = computed(
  () =>
    !busy.value &&
    !isCurrentSessionRunning.value &&
    Boolean(agentId.value && modelConfig.value) &&
    Boolean(inputValue.value.trim() || draftImages.value.length),
);
const currentSessionName = computed(() => {
  if (!currentRecordId.value) return "新对话";
  const item = sessions.value.find(
    (session) => session.session.id === currentRecordId.value,
  );
  return item?.session.config.name || "当前会话";
});

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function providerFromCredential(credential: AssistantCredential) {
  return credential.data.type;
}
function createKnowledgeConfig(): AssistantKnowledgeConfig {
  return {
    knowledge_base_ids: knowledgeBases.value
      .map((item) => item.id)
      .filter(Boolean),
    parameters: { mode: "agentic" },
  };
}

function chooseModel(
  models: { name: string; input_types?: string[] }[],
): string {
  return (
    models.find(
      (model) =>
        model.name === DEFAULT_MODEL &&
        model.input_types?.some((type) => type.startsWith("image/")),
    )?.name ||
    models.find((model) =>
      model.input_types?.some((type) => type.startsWith("image/")),
    )?.name ||
    models[0]?.name ||
    ""
  );
}

async function initialize() {
  initializing.value = true;
  initError.value = "";
  try {
    const [agentResult, credentialResult, knowledgeResult] = await Promise.all([
      getAssistantAgentsApi(),
      getAssistantCredentialsApi(),
      getAssistantKnowledgeBaseApi(),
    ]);
    const agent = agentResult.agents?.[0];
    const credential = credentialResult.credentials?.[0];
    if (!agent) throw new Error("服务端未配置可用的安检 Agent");
    if (!credential) throw new Error("服务端未配置可用的模型凭证");
    knowledgeBases.value = knowledgeResult.knowledge_bases || [];

    agentId.value = agent.id;
    agentName.value = agent.data?.name || "安检助手";
    const provider = providerFromCredential(credential);
    const modelResult = await getAssistantModelsApi(provider);
    const model = chooseModel(modelResult.models || []);
    if (!model) throw new Error("当前模型凭证下没有可用模型");
    modelConfig.value = {
      type: credential.data.type,
      credential_id: credential.id,
      model,
      parameters: {},
    };
    await refreshSessions(false);
  } catch (error) {
    initError.value =
      error instanceof Error ? error.message : "安检助手初始化失败";
  } finally {
    initializing.value = false;
  }
}

async function refreshSessions(selectLatest = false, runtimeId = "") {
  if (!agentId.value) return;
  sessionsLoading.value = true;
  try {
    const result = await getAssistantSessionsApi(agentId.value);
    sessions.value = [...(result.sessions || [])].sort((left, right) =>
      String(
        right.session.updated_at || right.session.created_at || "",
      ).localeCompare(
        String(left.session.updated_at || left.session.created_at || ""),
      ),
    );
    const matched = runtimeId
      ? sessions.value.find(
          (item) =>
            item.session.state.session_id === runtimeId ||
            item.session.id === runtimeId,
        )
      : undefined;
    if (matched) {
      await selectSession(matched, false);
    } else if (selectLatest && sessions.value[0]) {
      await selectSession(sessions.value[0], false);
    }
  } finally {
    sessionsLoading.value = false;
  }
}

function toViewMessage(message: AssistantMessage): ViewMessage {
  return {
    id: message.id,
    role: message.role,
    text: getMessageText(message),
    images: getMessageImages(message).map(
      (image) => `data:${image.source.media_type};base64,${image.source.data}`,
    ),
    failed: Boolean(message.error),
  };
}

async function loadMessages(item: AssistantSessionItem) {
  messagesLoading.value = true;
  try {
    const result = await getAssistantMessagesApi(
      agentId.value,
      item.session.id,
    );
    if (typeof result.is_running === "boolean") {
      item.is_running = result.is_running;
    }
    messages.value = (result.messages || [])
      .filter(
        (message) => message.role === "user" || message.role === "assistant",
      )
      .map(toViewMessage)
      .filter((message) => message.text || message.images.length);
    await scrollToBottom();
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "历史消息加载失败",
      icon: "none",
    });
  } finally {
    messagesLoading.value = false;
  }
}

async function selectSession(item: AssistantSessionItem, closeDrawer = true) {
  if (sending.value) return;
  currentRecordId.value = item.session.id;
  currentRuntimeId.value = item.session.state.session_id || item.session.id;
  draftImages.value = [];
  inputValue.value = "";
  if (closeDrawer) historyVisible.value = false;
  await loadMessages(item);
}

function startNewSession() {
  if (sending.value) return;
  currentRecordId.value = "";
  currentRuntimeId.value = "";
  messages.value = [];
  draftImages.value = [];
  inputValue.value = "";
  historyVisible.value = false;
}

async function ensureSession() {
  if (currentRecordId.value && currentRuntimeId.value) {
    return {
      recordId: currentRecordId.value,
      runtimeId: currentRuntimeId.value,
    };
  }
  if (!modelConfig.value) throw new Error("助手模型尚未初始化");
  const result = await createAssistantSessionApi(
    agentId.value,
    modelConfig.value,
    createKnowledgeConfig(),
  );
  let created: AssistantSessionItem | undefined;
  for (let attempt = 0; attempt < 3 && !created; attempt += 1) {
    await refreshSessions(false);
    created = sessions.value.find(
      (item) => item.session.id === result.session_id,
    );
    if (!created) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
  if (!created) throw new Error("新会话创建成功，但未能获取会话运行 ID");
  currentRecordId.value = created.session.id;
  currentRuntimeId.value =
    created.session.state.session_id || created.session.id;
  return {
    recordId: currentRecordId.value,
    runtimeId: currentRuntimeId.value,
  };
}

async function syncMessagesAfterReply() {
  if (!agentId.value) return;
  if (!currentRecordId.value && currentRuntimeId.value) {
    await refreshSessions(false, currentRuntimeId.value);
    return;
  }
  const item = sessions.value.find(
    (session) => session.session.id === currentRecordId.value,
  );
  if (item) await loadMessages(item);
}

async function askQuestion(question: string) {
  if (busy.value) return;
  inputValue.value = question;
  await sendQuestion();
}

async function sendQuestion() {
  if (!canSend.value) return;
  interruptRequested = false;
  const text = inputValue.value.trim();
  const images = [...draftImages.value];
  const userMessage: ViewMessage = {
    id: createId("user"),
    role: "user",
    text,
    images: images.map((image) => image.path),
  };
  const assistantMessage: ViewMessage = {
    id: createId("assistant"),
    role: "assistant",
    text: "",
    images: [],
    streaming: true,
  };
  sending.value = true;
  messages.value.push(userMessage, assistantMessage);
  inputValue.value = "";
  draftImages.value = [];
  await scrollToBottom();
  let streamRequest: ReturnType<typeof streamAssistantReplyApi> | undefined;

  try {
    const { recordId } = await ensureSession();
    if (currentSessionItem.value) {
      currentSessionItem.value.is_running = true;
    }
    streamRequest = streamAssistantReplyApi(
      agentId.value,
      recordId,
      (delta) => {
        assistantMessage.text = delta;
        void scrollToBottom();
      },
    );
    activeStreamRequest = streamRequest;
    streamReady.value = true;
    await sendAssistantMessageApi({
      agentId: agentId.value,
      sessionId: recordId,
      text,
      images,
    });
    const streamResult = await streamRequest;
    if (!assistantMessage.text) assistantMessage.text = streamResult.text;
    assistantMessage.streaming = false;

    await new Promise((resolve) => setTimeout(resolve, 150));
    await syncMessagesAfterReply();
    if (!currentRecordId.value)
      await refreshSessions(false, currentRuntimeId.value);
  } catch (error) {
    streamRequest?.abort();
    assistantMessage.streaming = false;
    if (interruptRequested) {
      if (!assistantMessage.text) assistantMessage.text = "已停止生成";
      await new Promise((resolve) => setTimeout(resolve, 150));
      await syncMessagesAfterReply();
    } else {
      assistantMessage.failed = true;
      assistantMessage.text =
        error instanceof Error ? error.message : "助手暂时无法响应，请稍后重试";
    }
  } finally {
    sending.value = false;
    streamReady.value = false;
    if (activeStreamRequest === streamRequest) activeStreamRequest = undefined;
    if (currentSessionItem.value) {
      currentSessionItem.value.is_running = false;
    }
    await scrollToBottom();
  }
}

async function interruptReply() {
  if (!canInterrupt.value) return;
  const recordId = currentRecordId.value;
  const hasLocalStream = Boolean(activeStreamRequest);
  interrupting.value = true;
  interruptRequested = true;

  try {
    await interruptAssistantSessionApi(agentId.value, recordId);
    if (currentSessionItem.value) {
      currentSessionItem.value.is_running = false;
    }
    streamReady.value = false;
    activeStreamRequest?.abort();

    if (!hasLocalStream) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      await refreshSessions(false);
      const item = currentSessionItem.value;
      if (item) await loadMessages(item);
    }
    uni.showToast({ title: "已停止生成", icon: "none" });
  } catch (error) {
    interruptRequested = false;
    uni.showToast({
      title: error instanceof Error ? error.message : "停止生成失败",
      icon: "none",
    });
  } finally {
    interrupting.value = false;
  }
}

function mediaTypeFromPath(path: string) {
  const clean = path.split("?")[0].toLowerCase();
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".gif")) return "image/gif";
  if (clean.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function fileNameFromPath(path: string, index: number) {
  const name = path.split("?")[0].split("/").pop();
  return name || `现场图片-${Date.now()}-${index + 1}.jpg`;
}

function chooseImages() {
  const count = 4 - draftImages.value.length;
  if (count <= 0 || busy.value) return;
  uni.chooseImage({
    count,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: async (result) => {
      uploadingImages.value = true;
      try {
        const paths = Array.isArray(result.tempFilePaths)
          ? result.tempFilePaths
          : [result.tempFilePaths];
        const selected = await Promise.all(
          paths.map(async (path, index) => ({
            id: createId("image"),
            path,
            name: fileNameFromPath(path, index),
            mediaType: mediaTypeFromPath(path),
            base64: await imagePathToBase64(path),
          })),
        );
        draftImages.value.push(...selected);
      } catch (error) {
        uni.showToast({
          title: error instanceof Error ? error.message : "图片读取失败",
          icon: "none",
        });
      } finally {
        uploadingImages.value = false;
      }
    },
  });
}

function removeDraftImage(id: string) {
  draftImages.value = draftImages.value.filter((image) => image.id !== id);
}

function previewDraft(index: number) {
  const urls = draftImages.value.map((image) => image.path);
  if (urls[index]) uni.previewImage({ current: urls[index], urls });
}

function previewImages(urls: string[], index: number) {
  if (urls[index]) uni.previewImage({ current: urls[index], urls });
}

function openRename(item: AssistantSessionItem) {
  renameTarget.value = item;
  renameValue.value = item.session.config.name || "";
}

function closeRename() {
  renameTarget.value = undefined;
  renameValue.value = "";
}

async function submitRename() {
  const target = renameTarget.value;
  const name = renameValue.value.trim();
  if (!target || !name) return;
  try {
    await updateAssistantSessionApi(agentId.value, target.session.id, { name });
    target.session.config.name = name;
    closeRename();
    uni.showToast({ title: "已重命名", icon: "success" });
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "重命名失败",
      icon: "none",
    });
  }
}

function confirmDelete(item: AssistantSessionItem) {
  uni.showModal({
    title: "删除会话",
    content: `确定删除“${item.session.config.name || "未命名会话"}”吗？`,
    confirmColor: "#e5484d",
    success: async (result) => {
      if (!result.confirm) return;
      try {
        await deleteAssistantSessionApi(agentId.value, item.session.id);
        sessions.value = sessions.value.filter(
          (session) => session.session.id !== item.session.id,
        );
        if (currentRecordId.value === item.session.id) startNewSession();
        uni.showToast({ title: "已删除", icon: "success" });
      } catch (error) {
        uni.showToast({
          title: error instanceof Error ? error.message : "删除失败",
          icon: "none",
        });
      }
    },
  });
}

function copyMessage(content: string) {
  uni.setClipboardData({
    data: content,
    success: () => uni.showToast({ title: "已复制", icon: "success" }),
  });
}

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getMonth() + 1}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

async function scrollToBottom() {
  scrollIntoView.value = "";
  await nextTick();
  scrollIntoView.value = "message-bottom";
}

onMounted(initialize);
</script>

<style lang="scss" scoped>
.assistant-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f4f7fb;
  color: #182230;
}

button {
  margin: 0;
  padding: 0;
  line-height: normal;
  background: transparent;

  &::after {
    border: 0;
  }
}

.session-bar {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 18rpx 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #e7edf5;
}

.session-summary {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.session-label {
  flex: none;
  padding: 6rpx 12rpx;
  border-radius: 10rpx;
  background: #eaf3ff;
  color: #1677ff;
  font-size: 22rpx;
}

.session-name {
  overflow: hidden;
  color: #344054;
  font-size: 26rpx;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.new-session-btn {
  flex: none;
  color: #1677ff;
  font-size: 25rpx;
  font-weight: 600;
}

.message-scroll {
  min-height: 0;
  flex: 1;
}

.message-list {
  padding: 28rpx 24rpx 44rpx;
}

.state-card,
.welcome-card {
  margin: 60rpx 24rpx;
  padding: 48rpx 36rpx;
  border: 1rpx solid #e2eaf4;
  border-radius: 28rpx;
  background: #fff;
  box-shadow: 0 12rpx 36rpx rgba(30, 60, 100, 0.06);
  text-align: center;
}

.state-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  color: #667085;
  font-size: 27rpx;
}

.error-state {
  flex-direction: column;
}

.state-title,
.welcome-title {
  color: #1d2939;
  font-size: 32rpx;
  font-weight: 700;
}

.state-desc,
.welcome-desc {
  margin-top: 14rpx;
  color: #667085;
  font-size: 25rpx;
  line-height: 1.7;
}

.loading-dot {
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  background: #1677ff;
  animation: pulse 1s infinite;
}

.retry-btn {
  margin-top: 24rpx;
  padding: 16rpx 32rpx;
  border-radius: 16rpx;
  background: #1677ff;
  color: #fff;
  font-size: 25rpx;
}

.welcome-card {
  margin: 18rpx 0 36rpx;
}

.welcome-icon {
  width: 84rpx;
  height: 84rpx;
  margin: 0 auto 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 26rpx;
  background: linear-gradient(135deg, #1677ff, #65a9ff);
  color: #fff;
  font-size: 30rpx;
  font-weight: 800;
  box-shadow: 0 12rpx 28rpx rgba(22, 119, 255, 0.25);
}

.quick-grid {
  margin-top: 28rpx;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.quick-item {
  padding: 18rpx 12rpx;
  border: 1rpx solid #dce9f8;
  border-radius: 16rpx;
  background: #f7faff;
  color: #315b87;
  font-size: 23rpx;
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  margin-bottom: 30rpx;

  &.user {
    flex-direction: row-reverse;
  }
}

.avatar {
  width: 64rpx;
  height: 64rpx;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20rpx;
  background: linear-gradient(135deg, #1677ff, #58a1ff);
  color: #fff;
  font-size: 23rpx;
  font-weight: 800;
}

.user .avatar {
  background: #253b56;
}

.message-main {
  max-width: calc(100% - 96rpx);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.user .message-main {
  align-items: flex-end;
}

.role-name {
  margin: 0 8rpx 8rpx;
  color: #8993a4;
  font-size: 21rpx;
}

.bubble {
  min-width: 50rpx;
  padding: 20rpx 22rpx;
  border: 1rpx solid #e1e8f1;
  border-radius: 8rpx 24rpx 24rpx 24rpx;
  background: #fff;
  box-shadow: 0 6rpx 18rpx rgba(30, 60, 90, 0.05);

  &.failed {
    border-color: #ffc7c9;
    background: #fff8f8;
  }
}

.user .bubble {
  border-color: #1677ff;
  border-radius: 24rpx 8rpx 24rpx 24rpx;
  background: #1677ff;
  color: #fff;
}

.message-text {
  font-size: 28rpx;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 14rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.message-image {
  width: 180rpx;
  height: 180rpx;
  border-radius: 14rpx;
  background: #eef2f7;
}

.copy-btn {
  margin-top: 8rpx;
  padding: 8rpx;
  color: #8a94a5;
  font-size: 21rpx;
}

.thinking {
  display: flex;
  align-items: center;
  gap: 16rpx;
  color: #667085;
  font-size: 25rpx;
}

.typing-dots {
  display: flex;
  gap: 7rpx;

  text {
    width: 8rpx;
    height: 8rpx;
    border-radius: 50%;
    background: #1677ff;
    animation: typing 1.1s infinite;

    &:nth-child(2) {
      animation-delay: 0.15s;
    }

    &:nth-child(3) {
      animation-delay: 0.3s;
    }
  }
}

.bottom-anchor {
  height: 1rpx;
}

.composer {
  flex: none;
  padding: 16rpx 20rpx calc(16rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #e2e9f2;
  background: #fff;
  box-shadow: 0 -8rpx 24rpx rgba(31, 50, 75, 0.05);
}

.draft-scroll {
  width: 100%;
  margin-bottom: 14rpx;
  white-space: nowrap;
}

.draft-list {
  display: inline-flex;
  gap: 14rpx;
  padding: 4rpx;
}

.draft-image-wrap {
  position: relative;
  width: 132rpx;
  height: 132rpx;
}

.draft-image {
  width: 100%;
  height: 100%;
  border-radius: 16rpx;
  background: #eef2f7;
}

.remove-image {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  width: 38rpx;
  height: 38rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3rpx solid #fff;
  border-radius: 50%;
  background: #344054;
  color: #fff;
  font-size: 28rpx;
}

.composer-row {
  display: flex;
  align-items: flex-end;
  gap: 12rpx;
}

.image-btn {
  width: 80rpx;
  height: 74rpx;
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 18rpx;
  background: #eef5ff;
  color: #1677ff;
  font-size: 20rpx;
}

.image-icon {
  font-size: 30rpx;
  line-height: 24rpx;
}

.question-input {
  min-height: 42rpx;
  max-height: 180rpx;
  flex: 1;
  padding: 16rpx 20rpx;
  border: 1rpx solid #dce4ee;
  border-radius: 20rpx;
  background: #f8fafc;
  color: #1d2939;
  font-size: 27rpx;
  line-height: 42rpx;
}

.send-btn {
  height: 74rpx;
  padding: 0 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18rpx;
  background: #1677ff;
  color: #fff;
  font-size: 25rpx;
  font-weight: 700;

  &.stop-btn {
    background: #e5484d;
  }

  &.disabled {
    background: #b8c5d5;
  }
}

.composer-tip {
  display: block;
  margin: 10rpx 0 0 94rpx;
  color: #a0a8b5;
  font-size: 19rpx;
}

.drawer-mask,
.dialog-mask {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: flex;
  justify-content: flex-end;
  background: rgba(20, 30, 45, 0.42);
}

.history-drawer {
  width: 82%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: calc(28rpx + env(safe-area-inset-top)) 24rpx
    calc(24rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  background: #fff;
  box-shadow: -16rpx 0 40rpx rgba(20, 35, 55, 0.16);
}

.drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.drawer-title {
  color: #182230;
  font-size: 34rpx;
  font-weight: 750;
}

.drawer-count {
  margin-left: 12rpx;
  color: #98a2b3;
  font-size: 22rpx;
}

.close-btn {
  width: 64rpx;
  height: 64rpx;
  color: #667085;
  font-size: 44rpx;
}

.drawer-new-btn {
  margin: 28rpx 0 20rpx;
  padding: 20rpx;
  border-radius: 18rpx;
  background: #1677ff;
  color: #fff;
  font-size: 27rpx;
  font-weight: 650;
}

.session-list {
  min-height: 0;
  flex: 1;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
  padding: 20rpx 16rpx;
  border: 1rpx solid transparent;
  border-radius: 18rpx;
  background: #f6f8fb;

  &.active {
    border-color: #b8d7ff;
    background: #edf5ff;
  }
}

.session-copy {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.session-item-name {
  overflow: hidden;
  color: #344054;
  font-size: 26rpx;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-time {
  color: #98a2b3;
  font-size: 21rpx;
}

.session-actions {
  display: flex;
  gap: 4rpx;
}

.action-btn {
  width: 58rpx;
  height: 58rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 12rpx;
  color: #667085;
  font-size: 21rpx;

  &.danger {
    color: #d92d20;
  }

  &:active {
    background: #e8edf5;
  }

  &.danger:active {
    background: #feeceb;
  }
}

.drawer-empty {
  padding: 80rpx 0;
  color: #98a2b3;
  font-size: 25rpx;
  text-align: center;
}

.dialog-mask {
  align-items: center;
  justify-content: center;
}

.rename-dialog {
  width: 590rpx;
  padding: 34rpx;
  border-radius: 26rpx;
  background: #fff;
  box-sizing: border-box;
}

.dialog-title {
  color: #1d2939;
  font-size: 31rpx;
  font-weight: 700;
}

.rename-input {
  height: 84rpx;
  margin-top: 26rpx;
  padding: 0 22rpx;
  border: 1rpx solid #d6dee9;
  border-radius: 16rpx;
  background: #f8fafc;
  font-size: 27rpx;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 18rpx;
  margin-top: 28rpx;
}

.dialog-btn {
  min-width: 130rpx;
  padding: 18rpx 28rpx;
  border-radius: 14rpx;
  background: #eef1f5;
  color: #475467;
  font-size: 25rpx;

  &.primary {
    background: #1677ff;
    color: #fff;
  }
}

@keyframes typing {
  0%,
  70%,
  100% {
    opacity: 0.25;
    transform: translateY(0);
  }
  35% {
    opacity: 1;
    transform: translateY(-5rpx);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}
</style>
