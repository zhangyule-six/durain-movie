<script setup lang="ts">
import { computed } from 'vue'
import PopularReview from './component/PopularReview.vue'
import Ranking from './component/Ranking.vue'
import { reviewMockData } from './config'

const rankingData = computed(() => {
  return [...reviewMockData].sort((a, b) => b.rating - a.rating)
})
</script>

<template>
  <div class="p-8">
    <div class="flex gap-6 w-full">
      <!-- 左侧：热门影评列表 -->
      <div class="flex-1 min-w-0">
        <div class="scrollbar-hidden overflow-y-auto h-screen pb-4">
          <div class="flex flex-col gap-6">
            <PopularReview
              v-for="(review, index) in reviewMockData"
              :key="review.id"
              :data="review"
              :index="index"
            />
          </div>
        </div>
      </div>

      <!-- 右侧：高分电影榜单 -->
      <div class="w-[340px] shrink-0 h-screen">
        <Ranking :data="rankingData" />
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
