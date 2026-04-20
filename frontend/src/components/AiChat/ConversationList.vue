<script setup lang="ts">
import type { ConversationItem } from '@/api/ai'
import { MessageSquare, Trash2, Plus } from 'lucide-vue-next'

defineProps<{
  conversations: ConversationItem[]
  currentId: string | null
}>()

const emit = defineEmits<{
  select: [id: string]
  delete: [id: string]
  new: []
}>()

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>

<template>
  <div class="flex flex-col h-full bg-[#ece9dc]" style="font-family: 'Rounded', sans-serif;">
    <div class="p-3 border-b-2 border-[#0a0a0a]/10">
      <button
        class="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#0a0a0a]/40 py-2.5 text-sm text-[#63686b] font-bold transition hover:border-[#0a0a0a] hover:text-[#0a0a0a] hover:bg-white"
        @click="emit('new')"
      >
        <Plus class="h-4 w-4" />
        新对话
      </button>
    </div>
    <div class="flex-1 overflow-y-auto">
      <div
        v-for="conv in conversations"
        :key="conv._id"
        class="group flex items-center gap-2.5 px-3 py-3 cursor-pointer transition"
        :class="conv._id === currentId
          ? 'bg-[#f06050] text-white'
          : 'hover:bg-white/60 text-[#0a0a0a]'"
        @click="emit('select', conv._id)"
      >
        <MessageSquare class="h-4 w-4 flex-shrink-0" :class="conv._id === currentId ? 'text-white' : 'text-[#63686b]'" />
        <div class="flex-1 min-w-0">
          <p class="text-sm truncate font-bold">
            {{ conv.title }}
          </p>
          <p class="text-xs mt-0.5 font-medium" :class="conv._id === currentId ? 'text-white/70' : 'text-[#63686b]'">
            {{ formatTime(conv.updatedAt) }}
          </p>
        </div>
        <button
          class="opacity-0 group-hover:opacity-100 p-1 rounded transition"
          :class="conv._id === currentId ? 'text-white/80 hover:text-white' : 'text-[#63686b] hover:text-[#f06050]'"
          @click.stop="emit('delete', conv._id)"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </button>
      </div>
      <div
        v-if="!conversations.length"
        class="p-6 text-center text-xs text-[#63686b] font-semibold"
      >
        暂无对话记录
      </div>
    </div>
  </div>
</template>
