<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { StarIcon, ArrowLeft } from 'lucide-vue-next'
import { useMaoyanSearchMovies } from '@/api/maoyanSearch'
import type { MaoyanSearchMovieItem } from '@/api/types'

const route = useRoute()
const router = useRouter()
const PAGE_LIMIT = 20

const getKeyword = () => String(route.query.keyword || '').trim()

const items = ref<MaoyanSearchMovieItem[]>([])
const error = ref<string | null>(null)
const loadingInitial = ref(false)
const loadingMore = ref(false)
const hasMore = ref(false)
const offset = ref(0)
const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const list = computed(() =>
  (items.value || []).map((m) => ({
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

const mergeById = (
  current: MaoyanSearchMovieItem[],
  incoming: MaoyanSearchMovieItem[],
) => {
  const seen = new Set(current.map((item) => item.id))
  const merged = [...current]
  for (const item of incoming) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    merged.push(item)
  }
  return merged
}

const fetchPage = async (nextOffset: number, append: boolean) => {
  const keyword = getKeyword()
  if (!keyword) {
    items.value = []
    hasMore.value = false
    return
  }
  if (append && (loadingMore.value || !hasMore.value)) return

  if (append) loadingMore.value = true
  else loadingInitial.value = true
  if (!append) error.value = null

  const { execute } = useMaoyanSearchMovies({
    keyword,
    ci: 1,
    offset: nextOffset,
    limit: PAGE_LIMIT,
  })
  try {
    const res = await execute()
    const pageData = Array.isArray(res?.data) ? res.data : []
    if (append) {
      items.value = mergeById(items.value, pageData)
    } else {
      items.value = pageData
    }
    offset.value = nextOffset
    hasMore.value = Boolean(res?.hasMore)
  } catch (err: any) {
    error.value = err?.message || '搜索失败'
    if (!append) items.value = []
  } finally {
    if (append) loadingMore.value = false
    else loadingInitial.value = false
  }
}

const runSearch = async () => {
  offset.value = 0
  hasMore.value = false
  await fetchPage(0, false)
  await nextTick()
  setupObserver()
}

const loadMore = async () => {
  await fetchPage(offset.value + PAGE_LIMIT, true)
}

const setupObserver = () => {
  if (observer) observer.disconnect()
  if (!sentinelRef.value) return
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry?.isIntersecting) {
        loadMore()
      }
    },
    { root: null, rootMargin: '120px', threshold: 0.1 },
  )
  observer.observe(sentinelRef.value)
}

onMounted(async () => {
  await runSearch()
})

onUnmounted(() => {
  if (observer) observer.disconnect()
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

    <div v-if="loadingInitial" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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

    <div
      ref="sentinelRef"
      class="h-6"
    />
    <div
      v-if="loadingMore"
      class="text-sm text-gray-500 text-center"
    >
      正在加载更多...
    </div>
    <div
      v-else-if="list.length && !hasMore"
      class="text-sm text-gray-500 text-center"
    >
      没有更多了
    </div>
  </div>
</template>

