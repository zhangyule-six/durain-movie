<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { StarIcon, ArrowLeft } from 'lucide-vue-next'
import { useTopRatedMovies } from '@/api/rank'

const router = useRouter()
const { data, error, loading, execute } = useTopRatedMovies()

const list = computed(() => {
  const items = data.value?.movieList ?? []
  return items.map((m) => ({
    movieId: m.movieId,
    title: m.name,
    image: m.poster,
    ratingText: m.score?.trim() ? m.score : '--',
  }))
})

const goBack = () => router.back()
const gotoDetail = (title: string) =>
  router.push({ name: 'filmDetail', params: { name: title } })

onMounted(() => {
  execute().catch(() => undefined)
})
</script>

<template>
  <div class="p-8 flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          class="w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center"
          @click="goBack"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div class="text-2xl font-extrabold">今日排行</div>
      </div>
    </div>

    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <div v-for="i in 10" :key="i" class="border-2 border-black rounded-2xl overflow-hidden bg-white">
        <div class="h-[220px] bg-gray-200 animate-pulse" />
        <div class="p-3">
          <div class="h-4 w-28 bg-gray-200 rounded animate-pulse" />
          <div class="mt-2 h-4 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>

    <div v-else-if="error" class="text-sm text-red-600">
      {{ error }}
    </div>

    <div v-else-if="list.length === 0" class="text-sm text-gray-500">
      暂无数据
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <div
        v-for="item in list"
        :key="item.movieId"
        class="cursor-pointer border-2 border-black rounded-2xl overflow-hidden bg-white hover:-translate-y-0.5 hover:shadow-lg transition"
        @click="gotoDetail(item.title)"
      >
        <img :src="item.image" :alt="item.title" class="w-full h-[220px] object-cover" />
        <div class="p-3">
          <div class="text-sm font-extrabold truncate">{{ item.title }}</div>
          <div class="mt-1 flex items-center gap-1 text-xs font-bold">
            <StarIcon class="w-4 h-4 text-black fill-[#ecad25]" />
            {{ item.ratingText }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

