<script setup lang="ts">
import { ref } from 'vue'
import { Send, Square } from 'lucide-vue-next'

const props = defineProps<{
  isGenerating: boolean
}>()

const emit = defineEmits<{
  send: [text: string]
  stop: []
}>()

const inputText = ref('')

function handleSend() {
  const text = inputText.value.trim()
  if (!text || props.isGenerating) return
  emit('send', text)
  inputText.value = ''
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <div class="border-t-3 border-[#0a0a0a] bg-white p-3" style="font-family: 'Rounded', sans-serif;">
    <div class="flex items-end gap-2">
      <div class="flex-1 flex items-center bg-[#ece9dc] rounded-xl border-2 border-[#0a0a0a] px-3 py-2">
        <textarea
          v-model="inputText"
          :disabled="isGenerating"
          :placeholder="isGenerating ? 'AI 正在思考中...' : '描述你想看的电影...'"
          class="flex-1 resize-none bg-transparent text-sm outline-none text-[#0a0a0a] placeholder-[#63686b] disabled:opacity-50 font-medium"
          rows="1"
          @keydown="handleKeydown"
          @input="
            ($event.target as HTMLTextAreaElement).style.height = 'auto';
            ($event.target as HTMLTextAreaElement).style.height =
              Math.min(($event.target as HTMLTextAreaElement).scrollHeight, 120) + 'px'
          "
        />
      </div>
      <button
        v-if="isGenerating"
        class="flex-shrink-0 h-10 w-10 rounded-xl border-2 border-[#0a0a0a] bg-[#f06050] text-white flex items-center justify-center transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-[#e04e3f]"
        style="box-shadow: 2px 2px 0 0 rgba(10,10,10,1);"
        title="停止生成"
        @click="emit('stop')"
      >
        <Square class="h-4 w-4" />
      </button>
      <button
        v-else
        :disabled="!inputText.trim()"
        class="flex-shrink-0 h-10 w-10 rounded-xl border-2 border-[#0a0a0a] bg-[#0a0a0a] text-white flex items-center justify-center transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-30 disabled:cursor-not-allowed"
        style="box-shadow: 2px 2px 0 0 rgba(10,10,10,0.3);"
        title="发送"
        @click="handleSend"
      >
        <Send class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>
