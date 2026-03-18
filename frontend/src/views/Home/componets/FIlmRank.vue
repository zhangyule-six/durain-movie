<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { StarIcon } from 'lucide-vue-next'
import RankIcon from '@/assets/svg/rank.svg?component'
import { useTopRatedMovies } from '@/api/rank'

const router = useRouter()
const { data, error, loading, execute } = useTopRatedMovies()

const rankList = computed(() => {
  const list = data.value?.movieList ?? []
  return list.slice(0, 5).map((m) => ({
    movieId: m.movieId,
    title: m.name,
    image: m.poster,
    ratingText: m.score?.trim() ? m.score : '--',
  }))
})

const gotoDetail = (title: string) => {
  router.push({ name: 'filmDetail', params: { name: title } })
}

const gotoMore = () => {
  router.push({ name: 'rankMore' })
}

onMounted(() => {
  execute().catch(() => undefined)
})
</script>

<template>
  <div class="w-full p-4">
    <div class="text-2xl font-bold w-full" style="font-family: 'din-round', sans-serif">
      <div class="flex items-center justify-between">
        <div class="flex gap-2">
          <RankIcon class="w-8 h-8 text-[#e95111]" />
          <div>今日排行</div>
        </div>
        <button class="text-[#ecad25] text-sm" @click="gotoMore">更多</button>
      </div>
    </div>

    <div v-if="loading" class="grid grid-cols-5 flex-1 gap-4 w-full p-4">
      <div v-for="i in 5" :key="i" class="inline-block shrink-0">
        <div class="w-full h-[180px] rounded-[12px] border-2 border-[#0a0a0a] bg-gray-200 animate-pulse" />
        <div class="mt-2 h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div class="mt-2 h-4 w-16 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>

    <div v-else-if="error" class="w-full p-4 text-sm text-red-600">
      {{ error }}
    </div>

    <div v-else class="grid grid-cols-5 flex-1 gap-4 w-full p-4">
      <div
        v-for="item in rankList"
        :key="item.movieId"
        class="inline-block shrink-0 cursor-pointer hover:-translate-y-0.5 transition-transform"
        @click="gotoDetail(item.title)"
      >
        <img
          :src="item.image"
          :alt="item.title"
          class="w-full h-[180px] object-cover rounded-[12px] border-2 border-[#0a0a0a]"
        />
        <div class="text-sm font-bold" style="font-family: 'din-round', sans-serif">
          {{ item.title }}
        </div>
        <div class="text-sm font-bold flex items-center gap-1" style="font-family: 'din-round', sans-serif">
          <StarIcon class="w-4 h-4 text-[#030303] fill-[#ecad25]" />
          {{ item.ratingText }}
        </div>
      </div>
    </div>
  </div>
</template>
