<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import type { ChatMessage } from '@/composables/useAiChat'
import MovieRefCard from './MovieRefCard.vue'
import { User, Bot } from 'lucide-vue-next'

const props = defineProps<{ message: ChatMessage }>()

const isUser = computed(() => props.message.role === 'user')

const renderedContent = computed(() => {
  if (!props.message.content) return ''
  const cleaned = props.message.content.replace(/\[movie:(.+?)\]/g, '**$1**')
  return marked.parse(cleaned, { async: false }) as string
})
</script>

<template>
  <div class="flex gap-2.5" :class="isUser ? 'flex-row-reverse' : 'flex-row'">
    <div
      class="flex-shrink-0 h-8 w-8 rounded-lg border-2 border-[#0a0a0a] flex items-center justify-center"
      :class="isUser ? 'bg-yellow-400' : 'bg-[#f06050]'"
    >
      <User v-if="isUser" class="h-4 w-4 text-[#0a0a0a]" />
      <Bot v-else class="h-4 w-4 text-white" />
    </div>

    <div class="max-w-[82%] space-y-2">
      <div
        class="rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed border-2 border-[#0a0a0a]"
        :class="isUser
          ? 'bg-[#0a0a0a] text-white rounded-tr-md'
          : 'bg-white text-[#0a0a0a] rounded-tl-md'"
        :style="isUser ? '' : 'box-shadow: 2px 2px 0 0 rgba(10,10,10,0.15);'"
        style="font-family: 'Rounded', sans-serif;"
      >
        <div
          v-if="renderedContent"
          class="prose prose-sm max-w-none font-medium"
          :class="isUser ? 'prose-invert' : ''"
          v-html="renderedContent"
        />
        <span
          v-if="message.isStreaming && !message.content"
          class="inline-flex gap-1"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style="animation-delay: 0s;" />
          <span class="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style="animation-delay: 0.15s;" />
          <span class="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style="animation-delay: 0.3s;" />
        </span>
      </div>

      <div v-if="message.movieRefs?.length" class="grid gap-2 max-w-xs">
        <MovieRefCard
          v-for="(movie, idx) in message.movieRefs"
          :key="idx"
          :movie="movie"
        />
      </div>
    </div>
  </div>
</template>
