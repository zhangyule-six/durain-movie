<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { StarIcon, ArrowLeft } from 'lucide-vue-next'
import { useMaoyanSearchMovies } from '@/api/maoyanSearch'

const route = useRoute()
const router = useRouter()

const getKeyword = () => String(route.query.keyword || '').trim()

const { data, error, loading, execute } = useMaoyanSearchMovies({
  keyword: getKeyword(),
  ci: 1,
})

const list = computed(() =>
  (data.value || []).map((m) => ({
    id: m.id,
    title: m.name,
    image: m.poster,
    ratingText: m.score?.trim() ? m.score : '--',
    subtitle: m.catogary || m.release || '',
  })),
)

const goBack = () => router.back()

const gotoDetail = (title: string) => {
  router.push({ name: 'filmDetail', params: { name: title } })
}

const runSearch = () => {
  const keyword = getKeyword()
  if (!keyword) return
  // 更新 body 中 keyword 再执行
  ;(execute as any).call(null)
}

onMounted(() => {
  runSearch()
})

watch(
  () => route.query.keyword,
  () => {
    runSearch()
  },
)
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
        <div class="text-2xl font-extrabold">
          搜索结果：<span class="text-emerald-600">{{ route.query.keyword }}</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <div
        v-for="i in 10"
        :key="i"
        class="border-2 border-black rounded-2xl overflow-hidden bg-white"
      >
        <div class="h-[220px] bg-gray-200 animate-pulse" />
        <div class="p-3 space-y-2">
          <div class="h-4 w-28 bg-gray-200 rounded animate-pulse" />
          <div class="h-4 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>

    <div v-else-if="error" class="text-sm text-red-600">
      {{ error }}
    </div>

    <div v-else-if="!list.length" class="text-sm text-gray-500">
      暂无搜索结果。
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <div
        v-for="item in list"
        :key="item.id"
        class="cursor-pointer border-2 border-black rounded-2xl overflow-hidden bg-white hover:-translate-y-0.5 hover:shadow-lg transition"
        @click="gotoDetail(item.title)"
      >
        <img :src="item.image" :alt="item.title" class="w-full h-[220px] object-cover" />
        <div class="p-3 space-y-1">
          <div class="text-sm font-extrabold truncate">{{ item.title }}</div>
          <div class="flex items-center gap-1 text-xs font-bold">
            <StarIcon class="w-4 h-4 text-black fill-[#ecad25]" />
            {{ item.ratingText }}
          </div>
          <div v-if="item.subtitle" class="text-xs text-gray-600 truncate">
            {{ item.subtitle }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

