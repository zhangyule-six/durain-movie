<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PopularReview, { type HotReviewItem } from './component/PopularReview.vue'
import Ranking from './component/Ranking.vue'
import type { ReviewData } from './config'
import { useRequest } from '@/api/http'
import { useTopRatedMovies } from '@/api/newfilm'

const {
  data: topMovies,
  loading: topLoading,
  error: topError,
  execute: loadTop,
} = useTopRatedMovies(10)

const rankingData = computed<ReviewData[]>(() => {
  const list = topMovies?.value || []
  return list.map((m) => ({
    id: m.id,
    movieName: m.title,
    movieImage: m.poster,
    rating: m.rating,
  }))
})

// 热评列表懒加载
const {
  data: hotReviews,
  loading: hotLoading,
  error: hotError,
  execute: loadHot,
} = useRequest<HotReviewItem[]>({
  url: '/api/reviews/hot',
  method: 'GET',
  body: { limit: 10 },
})

const listContainerRef = ref<HTMLElement | null>(null)
const hasLoaded = ref(false)

onMounted(() => {
  const el = listContainerRef.value
  if (!el || typeof IntersectionObserver === 'undefined') {
    // 无法监听时直接加载一次
    loadHot()
    loadTop()
    hasLoaded.value = true
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasLoaded.value) {
          hasLoaded.value = true
          loadHot()
          loadTop()
          observer.disconnect()
        }
      })
    },
    {
      root: null,
      threshold: 0.1,
    },
  )

  observer.observe(el)
})
</script>

<template>
  <div class="p-8 pt-2">
    <div class="flex gap-6 w-full">
      <!-- 左侧：热门影评列表 -->
      <div class="flex-1 min-w-0 scrollbar-hidden overflow-y-auto h-screen pb-4">
        <div
          ref="listContainerRef"
          class=""
        >
          <div class="flex flex-col gap-6">
            <template v-if="(hotReviews || []).length">
              <PopularReview
                v-for="(item, index) in hotReviews"
                :key="item._id"
                :data="item"
                :index="index"
              />
            </template>
            <div
              v-else-if="!hotLoading && !hotError"
              class="text-xs text-gray-500 px-10 py-4"
            >
              暂无热门评论
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：高分电影榜单 -->
      <div class="w-[340px] shrink-0 h-screen fixed right-4 top-18">
        <Ranking :data="rankingData" />
        <div
          v-if="topLoading"
          class="mt-2 text-xs text-gray-500 text-center"
        >
          高分电影加载中…
        </div>
        <div
          v-else-if="topError"
          class="mt-2 text-xs text-red-500 text-center"
        >
          高分电影加载失败，请稍后重试
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hidden {
  scrollbar-width: none;
}

.scrollbar-hidden::-webkit-scrollbar {
  display: none;
}
</style>
