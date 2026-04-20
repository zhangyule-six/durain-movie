<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { X, History, ArrowLeft, Clapperboard } from 'lucide-vue-next'
import { useAiChat } from '@/composables/useAiChat'
import ChatMessage from './ChatMessage.vue'
import ChatInput from './ChatInput.vue'
import ToolCallStatus from './ToolCallStatus.vue'
import ConversationList from './ConversationList.vue'

const emit = defineEmits<{ close: [] }>()

const {
  messages,
  conversations,
  currentConversationId,
  isGenerating,
  toolCallStatus,
  loadConversations,
  loadConversation,
  sendMessage,
  stopGeneration,
  startNewConversation,
  deleteConversation,
} = useAiChat()

const showHistory = ref(false)
const messageListRef = ref<HTMLElement>()

function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

watch(
  () => messages.value[messages.value.length - 1]?.content,
  () => scrollToBottom(),
)

watch(
  () => messages.value.length,
  () => scrollToBottom(),
)

onMounted(() => {
  loadConversations()
})

function handleSelectConversation(id: string) {
  loadConversation(id)
  showHistory.value = false
}

function handleNewConversation() {
  startNewConversation()
  showHistory.value = false
}
</script>

<template>
  <div
    class="flex flex-col w-[380px] h-[560px] rounded-2xl border-3 border-[#0a0a0a] overflow-hidden bg-[#ece9dc]"
    style="box-shadow: 5px 5px 0 0 rgba(10,10,10,1); font-family: 'Rounded', sans-serif;"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 bg-[#f06050] border-b-3 border-[#0a0a0a]">
      <div class="flex items-center gap-2.5">
        <button
          v-if="showHistory"
          class="p-1 rounded-lg hover:bg-black/10 transition"
          @click="showHistory = false"
        >
          <ArrowLeft class="h-5 w-5 text-[#0a0a0a]" />
        </button>
        <div class="w-8 h-8 bg-white rounded-lg border-2 border-[#0a0a0a] flex items-center justify-center">
          <Clapperboard class="h-4 w-4 text-[#f06050]" />
        </div>
        <span class="font-extrabold text-sm text-[#0a0a0a]">
          {{ showHistory ? '对话记录' : 'Durian Movie' }}
        </span>
      </div>
      <div class="flex items-center gap-1">
        <button
          v-if="!showHistory"
          class="w-8 h-8 rounded-lg border-2 border-[#0a0a0a] bg-white/90 flex items-center justify-center hover:bg-white transition"
          title="对话记录"
          @click="showHistory = true"
        >
          <History class="h-4 w-4 text-[#0a0a0a]" />
        </button>
        <button
          class="w-8 h-8 rounded-lg border-2 border-[#0a0a0a] bg-white/90 flex items-center justify-center hover:bg-white transition"
          @click="emit('close')"
        >
          <X class="h-4 w-4 text-[#0a0a0a]" />
        </button>
      </div>
    </div>

    <!-- History Panel -->
    <template v-if="showHistory">
      <ConversationList
        :conversations="conversations"
        :current-id="currentConversationId"
        @select="handleSelectConversation"
        @delete="deleteConversation"
        @new="handleNewConversation"
      />
    </template>

    <!-- Chat Panel -->
    <template v-else>
      <div
        ref="messageListRef"
        class="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        <!-- Welcome -->
        <div v-if="!messages.length" class="flex flex-col items-center justify-center h-full text-center">
          <div
            class="w-16 h-16 rounded-2xl bg-[#f06050] border-3 border-[#0a0a0a] flex items-center justify-center mb-4"
            style="box-shadow: 3px 3px 0 0 rgba(10,10,10,1); transform: rotate(-4deg);"
          >
            <Clapperboard class="h-8 w-8 text-white" />
          </div>
          <h3 class="text-base font-extrabold text-[#0a0a0a] mb-1">你好！我是Durian Movie</h3>
          <p class="text-xs text-[#63686b] max-w-[260px] leading-relaxed font-medium">
            告诉我你的心情或偏好，我帮你找到最合适的电影
          </p>
          <div class="mt-4 space-y-2 w-full max-w-[280px]">
            <button
              v-for="hint in [
                '推荐一部适合周末看的治愈电影',
                '最近有什么高分新片？',
                '类似《盗梦空间》的烧脑电影',
              ]"
              :key="hint"
              class="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-[#0a0a0a] bg-white border-2 border-[#0a0a0a] transition hover:bg-[#f06050] hover:text-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              style="box-shadow: 2px 2px 0 0 rgba(10,10,10,1);"
              @click="sendMessage(hint)"
            >
              {{ hint }}
            </button>
          </div>
        </div>

        <ChatMessage
          v-for="(msg, idx) in messages"
          :key="idx"
          :message="msg"
        />

        <div v-if="toolCallStatus" class="flex justify-start">
          <ToolCallStatus :status="toolCallStatus" />
        </div>
      </div>

      <ChatInput
        :is-generating="isGenerating"
        @send="sendMessage"
        @stop="stopGeneration"
      />
    </template>
  </div>
</template>
