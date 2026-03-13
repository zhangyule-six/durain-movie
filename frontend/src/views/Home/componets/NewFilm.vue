<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { StarIcon } from 'lucide-vue-next'
import NewReleasesIcon from '@/assets/svg/new-releases.svg?component'
import { useMovieOnInfoList } from '@/api/newfilm'

const router = useRouter()
const { data, error, loading, execute } = useMovieOnInfoList()

const list = computed(() => {
  const items = data.value?.movieList ?? []
  return items.slice(0, 5).map((m) => ({
    movieId: m.id,
    title: m.nm,
    image: m.img,
    ratingText: m.sc && m.sc > 0 ? Number(m.sc).toFixed(1) : '--',
    description: m.star || '',
  }))
})

const gotoMore = () => {
  router.push({ name: 'newFilmMore' })
}

const gotoDetail = (title: string) => {
  router.push({ name: 'filmDetail', params: { name: title } })
}

onMounted(() => {
  execute().catch(() => undefined)
})
</script>

<template>
  <div class="w-full p-4">
    <div
      class="text-2xl font-bold w-full"
      style="font-family: 'din-round', sans-serif"
    >
      <div class="flex items-center justify-between">
        <div class="flex gap-2">
          <NewReleasesIcon class="w-6 h-6 text-[#aaeadc]" />
          <div>新鲜发布</div>
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
        v-for="item in list"
        :key="item.movieId"
        class="inline-block shrink-0 cursor-pointer hover:-translate-y-0.5 transition-transform"
        @click="gotoDetail(item.title)"
      >
        <img
          :src="item.image"
          :alt="item.title"
          class="w-full h-[180px] object-cover rounded-[12px] border-2 border-[#0a0a0a]"
        />
        <div
          class="text-sm font-bold"
          style="font-family: 'din-round', sans-serif"
        >
          {{ item.title }}
        </div>
        <div
          class="text-sm font-bold flex items-center gap-1"
          style="font-family: 'din-round', sans-serif"
        >
          <StarIcon
            class="w-4 h-4 text-[#030303] fill-[#ecad25]"
          />
          {{ item.ratingText }}
        </div>
        <div v-if="item.description" class="text-xs text-gray-700 truncate">
          {{ item.description }}
        </div>
      </div>
    </div>
  </div>
</template>
