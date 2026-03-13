<script setup lang="ts">
import { ref } from 'vue'
import { NAvatar, NRate,NButton, NIcon } from 'naive-ui'
import { HeartIcon, MessageCircleCodeIcon, PlusCircle } from 'lucide-vue-next';
import ReviewDialog from './ReviewDialog.vue'
import type { ReviewData } from '../config'

interface Props {
  data: ReviewData
  index: number
}

const props = withDefaults(defineProps<Props>(), {})

const reviewDialogRef = ref<InstanceType<typeof ReviewDialog>>()

const handleAddReview = () => {
  reviewDialogRef.value?.openDialog()
}
</script>
<template>
  <div class=" flex flex-col items-start px-10 py-4 ">
    <!-- 用户信息 -->
    <div class="flex items-start gap-2 ml-9">
      <NAvatar
        round
        bordered
        :size="46"
        :src="data.avatar"
        style="border-color: black; border-width: 3px"
      />

      <div class="flex flex-col items-start">
        <div class="text-sm font-bold">{{ data.username }}</div>
        <div class="text-xs text-gray-500">{{ data.timeAgo }}</div>
      </div>
    </div>

    <!-- 评论信息 -->
    <div class="flex items-center gap-3">
      <!-- 电影展示 -->
      <div
        :class="index % 2 === 0 ? '-rotate-3' : 'rotate-3'"
        class="flex flex-col flex-1 border-black rounded-md border-4 w-[200px] h-[300px]"
      >
        <img
          :src="data.movieImage"
          alt="图片"
          class="w-full h-[85%] object-cover bg-center"
        />
        <div class="border-black w-full border-2"></div>
        <div class="flex-1 font-bold bg-yellow-400 flex items-center text-[16px] justify-center">{{ data.movieName }}</div>
      </div>
      <!-- 评论区域 -->
      <div class="flex flex-col items-start -mt-6">
        <div class="relative">
        <img
          src="@/assets/images/reviewBorder.png"
          alt="图片"
          class="w-[480px] h-[400px] flex-shrink-0 "
        />
        <div
          class="w-[480px]  flex flex-col items-start gap-2 p-6 absolute top-16 left-6"
        >
          <NRate
            readonly
            :max="5"
            :default-value="data.rating"
            :size="28"
          />
          <div
            class="text-[22px] font-bold w-[90%] mt-2 "
          >
            {{ data.reviewText }}
          </div>
        </div>
      </div>
      <!-- 按钮列 -->
      <div class="flex items-baseline gap-4 pl-10 -mt-8">
        <NButton bordered round size="large" color='#FF8AAE' >
          <template #icon>
          <Nicon><HeartIcon :size="18" /></Nicon>
        </template>
         
          点赞</NButton>
        <NButton bordered round size="large" color='#8a2be2' @click="handleAddReview">
          <template #icon>
          <Nicon><MessageCircleCodeIcon :size="18" /></Nicon>
        </template>
          回复
        </NButton>
        <NButton tertiary circle size="large" color='#8a2be2' ">
          <template #icon>
          <Nicon><PlusCircle :size="32" /></Nicon>
        </template>
        </NButton>
      </div>
      </div>
      
    </div>

    <!-- 评论对话框 -->
    <ReviewDialog
      ref="reviewDialogRef"
      :movie-name="data.movieName"
    />
  </div>
</template>

<style scoped></style>
