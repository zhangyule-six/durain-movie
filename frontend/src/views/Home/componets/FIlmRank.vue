<script setup lang="ts">
import { ref } from 'vue'
import { StarIcon } from 'lucide-vue-next'
import FlameIcon from '@/assets/svg/flame.svg?component'
import RankIcon from '@/assets/svg/rank.svg?component'

const data = [
  {
    title: '电影1',
    image: 'https://via.placeholder.com/150',
    rating: 4.5,
    description: '这是一部非常好看的电影',
  },
  {
    title: '电影1',
    image: 'https://via.placeholder.com/150',
    rating: 4.5,
    description: '这是一部非常好看的电影',
  },
  {
    title: '电影1',
    image: 'https://via.placeholder.com/150',
    rating: 4.5,
    description: '这是一部非常好看的电影',
  },
    {
    title: '电影1',
    image: 'https://via.placeholder.com/150',
    rating: 4.5,
    description: '这是一部非常好看的电影',
  },
  
]
</script>

<template>
  <div class="w-full p-4">
    <div
      class="text-2xl font-bold w-full"
      style="font-family: 'din-round', sans-serif"
    >
      <div class="flex items-center justify-between">
        <div class="flex gap-2">
          <RankIcon class="w-8 h-8 text-[#e95111]" />
          <div>今日排行</div>
        </div>
        <div class="text-[#ecad25] text-sm">更多</div>
        
      </div>
    </div>

    <div class="grid grid-cols-5 flex-1 gap-4 w-full p-4 ">
      <div v-for="item in data" :key="item.title" class="inline-block shrink-0">
        <img
          src="@/assets/images/background.png"
          alt="item.title"
          class=" object-cover rounded-[12px] border-2 border-[#0a0a0a] "
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
          {{ item.rating }}
        </div>
        <div
          class="text-sm font-bold"
          style="font-family: 'din-round', sans-serif"
        >
          {{ item.description }}
        </div>
      </div>
    </div>
  </div>
</template>
