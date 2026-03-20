<script setup lang="ts">
import FlameIcon from '@/assets/svg/flame.svg?component'
import { StarIcon } from 'lucide-vue-next'
import { useMessage } from 'naive-ui'

const message = useMessage()

const props = withDefaults(
  defineProps<{
    movieTitle?: string
    score?: number
    summary?: string
    movieId?: string
    loading?: boolean
    image?: string
  }>(),
  {
    movieTitle: 'LaLaLand',
    score: 9.5,
    summary: '',
    movieId: '',
    loading: false,
    image: '@/assets/images/background.png',
  },
)

const emit = defineEmits<{
  (e: 'gotoDetail', movieId: string | undefined): void
  (e: 'toggleFavorite', movieId: string | undefined): void
}>()

const handleGotoDetail = () => {
  if (props.loading) return
  emit('gotoDetail', props.movieId || undefined)
}

const handleToggleFavorite = () => {
  if (props.loading) return
  emit('toggleFavorite', props.movieId || undefined)
  message.success('收藏成功')
}

</script>

<template>
  <div
    class="rounded-[32px] overflow-hidden w-full h-[420px] relative border-4 border-[#0a0a0a]"
    style="font-family: 'din-round', sans-serif"
  >
    <img :src="props.image" alt="notice-board" class="w-full h-full object-cover"/>
    <div class="w-full h-full">
      <div
        class="rounded-[12px] bg-[#f9da4d] border-2 border-[#000000] 
                p-2 flex items-center justify-center absolute top-20 left-20 gap-1"
        style="
          rotate: -4deg;
          box-shadow: 3px 3px 0 0 rgba(10, 10, 10, 1);
        "
      >
        <FlameIcon class="w-4 h-4 text-[#e95111]" />
        <span style="font-size: 14px; font-weight: 600; color: #000000;">
          {{ props.movieTitle }}&nbsp;|
        </span>
        <StarIcon class="w-4 h-4 text-[#030303] fill-[#030303]" />
        <span style="font-size: 14px; font-weight: 600; color: #000000;">
          {{ props.score?.toFixed(1) ?? '—' }}
        </span>
      </div>

      <div class="absolute top-40 left-20">
        <div
          class="font-semibold text-6xl text-[#ffffff]"
          style="
            text-shadow: 3px 3px 0 rgba(10, 10, 10, 1),
              6px 6px 0 rgba(10, 10, 10, 0.5);
          "
        >
          {{ props.movieTitle }}
        </div>
        <div
          class="text-white text-sm mt-2 max-w-md"
          style="text-shadow: 1px 1px 2px rgba(10, 10, 10, 0.8)"
        >
          <span v-if="props.loading"> 为你挑选今日推荐中... </span>
          <span v-else> {{ props.summary }} </span>
        </div>
      </div>

      <div class="absolute bottom-10 left-20 flex gap-4">
        <button
          class="w-[140px] h-[60px] rounded-[32px] bg-[#f6836c] border-4 border-[#000000] text-center flex items-center justify-center font-semibold disabled:opacity-60 cursor-pointer"
          style="font-size: 18px; font-weight: 600; color: #000000"
          :disabled="props.loading"
          @click="handleGotoDetail"
        >
          去了解
        </button>
        <button
          class="w-[140px] h-[60px] rounded-[32px] bg-[#ffffff] border-4 border-[#000000] text-center flex items-center justify-center font-semibold disabled:opacity-60 cursor-pointer"
          style="font-size: 18px; font-weight: 600; color: #000000"
          :disabled="props.loading"
          @click="handleToggleFavorite"
        >
          收藏
        </button>
      </div>
    </div>
  </div>
</template>