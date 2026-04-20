<script setup lang="ts">
import { computed } from 'vue'
import type { ToolCallStatus } from '@/composables/useAiChat'
import { getToolLabel } from '@/composables/useAiChat'
import { Loader2, Check, AlertCircle } from 'lucide-vue-next'

const props = defineProps<{ status: ToolCallStatus }>()

const label = computed(() => getToolLabel(props.status.tool))

const statusText = computed(() => {
  switch (props.status.status) {
    case 'calling':
      return `正在搜索${label.value}...`
    case 'done':
      return `${label.value}搜索完成${props.status.resultCount ? `，找到 ${props.status.resultCount} 条结果` : ''}`
    case 'error':
      return `${label.value}搜索失败`
    default:
      return ''
  }
})
</script>

<template>
  <div
    class="inline-flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg border-2 border-[#0a0a0a] font-semibold"
    :class="status.status === 'error' ? 'bg-[#f06050]/10 text-[#f06050]' : 'bg-[#8ebbfd]/20 text-[#0a0a0a]'"
    style="font-family: 'Rounded', sans-serif;"
  >
    <Loader2
      v-if="status.status === 'calling'"
      class="h-3 w-3 animate-spin"
    />
    <Check
      v-else-if="status.status === 'done'"
      class="h-3 w-3 text-green-600"
    />
    <AlertCircle
      v-else
      class="h-3 w-3 text-[#f06050]"
    />
    <span>{{ statusText }}</span>
  </div>
</template>
