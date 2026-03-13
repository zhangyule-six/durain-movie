<script setup lang="ts">
import { NTabs, NTabPane, NRate } from 'naive-ui'

interface MyReviewItem {
  id: number
  movieName: string
  rating: number
  reviewText: string
  time: string
}

interface MyFavoriteItem {
  id: number
  movieName: string
  poster: string
  info: string
}

const myReviews: MyReviewItem[] = [
  {
    id: 1,
    movieName: '星际穿越',
    rating: 5,
    reviewText:
      '情感与科学并重，后半段的叙事爆发力很强，配乐也把氛围推到极致。',
    time: '2025-03-01'
  },
  {
    id: 2,
    movieName: '盗梦空间',
    rating: 4,
    reviewText:
      '结构精巧，节奏紧凑，多线叙事不乱。二刷三刷依然能发现新细节。',
    time: '2025-02-18'
  }
]

const myFavorites: MyFavoriteItem[] = [
  {
    id: 1,
    movieName: '怦然心动',
    poster: 'https://picsum.photos/80/120?random=10',
    info: '2010 · 爱情 / 剧情'
  },
  {
    id: 2,
    movieName: '疯狂动物城',
    poster: 'https://picsum.photos/80/120?random=11',
    info: '2016 · 动画 / 冒险'
  }
]
</script>

<template>
  <div class="p-8">
    <div class="mb-6">
      <div class="text-2xl font-extrabold">个人中心</div>
      <div class="text-sm text-gray-500 mt-1">查看我的评价与收藏</div>
    </div>

    <NTabs type="segment" animated default-value="reviews">
      <NTabPane name="reviews" tab="我的评价">
        <div class="flex flex-col gap-4 mt-4">
          <div
            v-for="item in myReviews"
            :key="item.id"
            class="border-2 border-black rounded-xl p-4 bg-white/80"
          >
            <div class="flex items-center justify-between mb-2 gap-3">
              <div class="text-base font-bold truncate">
                {{ item.movieName }}
              </div>
              <div class="text-xs text-gray-500 shrink-0">{{ item.time }}</div>
            </div>

            <div class="flex items-center gap-2 mb-2">
              <NRate readonly :max="5" :default-value="item.rating" :size="18" />
              <span class="text-xs text-gray-600 font-semibold">
                {{ item.rating.toFixed(1) }} 分
              </span>
            </div>

            <div class="text-sm text-gray-800 leading-relaxed">
              {{ item.reviewText }}
            </div>
          </div>

          <div v-if="!myReviews.length" class="text-sm text-gray-500">
            你还没有发表过评价。
          </div>
        </div>
      </NTabPane>

      <NTabPane name="favorites" tab="我的收藏">
        <div class="flex flex-col gap-4 mt-4">
          <div
            v-for="item in myFavorites"
            :key="item.id"
            class="flex items-center gap-4 border-2 border-black rounded-xl p-4 bg-white/80"
          >
            <img
              :src="item.poster"
              alt="poster"
              class="w-16 h-24 object-cover rounded-md border border-black shrink-0"
            />
            <div class="flex-1 min-w-0">
              <div class="text-base font-bold truncate">
                {{ item.movieName }}
              </div>
              <div class="text-xs text-gray-500 mt-1">{{ item.info }}</div>
            </div>
          </div>

          <div v-if="!myFavorites.length" class="text-sm text-gray-500">
            你还没有收藏任何电影。
          </div>
        </div>
      </NTabPane>
    </NTabs>
  </div>
</template>

