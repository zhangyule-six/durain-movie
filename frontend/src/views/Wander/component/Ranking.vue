<script setup lang="ts">
import { computed } from 'vue'
import { NRate } from 'naive-ui'
import type { ReviewData } from '../config'

interface Props {
  data: ReviewData[]
}

const props = withDefaults(defineProps<Props>(), {
  data: () => []
})

const topData = computed(() => props.data.slice(0, 10))

const rankBadgeClass = (rank: number) => {
  if (rank === 1) return 'bg-yellow-300'
  if (rank === 2) return 'bg-gray-200'
  if (rank === 3) return 'bg-orange-200'
  return 'bg-white'
}
</script>

<template>
  <div class="h-[600px] flex flex-col rounded-xl border-2 border-black bg-white/80">
    <div class="p-4 border-b-2 border-black">
      <div class="text-lg font-extrabold">高分电影榜单</div>
      <div class="text-xs text-gray-500 mt-1">根据用户评分从高到低排序</div>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <div
        v-for="(item, index) in topData"
        :key="item.id"
        class="flex items-center gap-3"
      >
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center font-extrabold border-2 border-black shrink-0"
          :class="rankBadgeClass(index + 1)"
        >
          {{ index + 1 }}
        </div>

        <img
          :src="item.movieImage || 'https://picsum.photos/80/120?blur=2'"
          alt="poster"
          class="w-10 h-14 object-cover rounded-md border border-black shrink-0"
        />

        <div class="min-w-0 flex-1">
          <div class="text-sm font-bold truncate">
            {{ item.movieName }}
          </div>
          <div class="mt-1 flex items-center gap-2 min-w-0">
            <NRate readonly :max="5" :default-value="item.rating" :size="16" />
            <span class="text-xs text-gray-600 font-semibold shrink-0">
              {{ item.rating.toFixed(1) }} 分
            </span>
          </div>
        </div>
      </div>

      <div v-if="topData.length === 0" class="text-sm text-gray-500">
        暂无数据
      </div>
    </div>
  </div>
</template>

