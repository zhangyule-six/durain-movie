<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { MovieRef } from '@/api/ai'

const props = defineProps<{ movie: MovieRef }>()
const router = useRouter()

function goDetail() {
  if (props.movie.title) {
    router.push(`/filmDetail/${encodeURIComponent(props.movie.title)}`)
  }
}
</script>

<template>
  <div
    class="flex items-center gap-2.5 rounded-xl border-2 border-[#0a0a0a] bg-white p-2 cursor-pointer transition hover:bg-yellow-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
    style="box-shadow: 2px 2px 0 0 rgba(10,10,10,1); font-family: 'Rounded', sans-serif;"
    @click="goDetail"
  >
    <img
      v-if="movie.poster"
      :src="movie.poster"
      :alt="movie.title"
      class="h-14 w-10 rounded-lg border border-[#0a0a0a] object-cover flex-shrink-0"
    />
    <div
      v-else
      class="h-14 w-10 rounded-lg border border-[#0a0a0a] bg-[#ece9dc] flex items-center justify-center text-[10px] text-[#63686b] flex-shrink-0 font-bold"
    >
      暂无
    </div>
    <div class="min-w-0 flex-1">
      <p class="text-sm font-bold text-[#0a0a0a] truncate">{{ movie.title }}</p>
      <p class="text-xs text-[#f06050] mt-0.5 font-semibold">查看详情 →</p>
    </div>
  </div>
</template>
