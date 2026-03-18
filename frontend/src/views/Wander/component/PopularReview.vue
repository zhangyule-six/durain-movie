<script setup lang="ts">
import { computed, ref } from 'vue'
import { NAvatar, NRate, NButton, NIcon } from 'naive-ui'
import { HeartIcon, MessageCircleCodeIcon, PlusCircle } from 'lucide-vue-next'
import ReviewDialog from './ReviewDialog.vue'
import { toggleLikeReview } from '@/api/reviews'
import router from '@/router'

export interface HotReviewItem {
  _id: string
  author: { username: string; avatar?: string }
  movie: { id: string; name: string; image?: string } | null
  score: number
  content: string
  likeCount?: number
  commentCount?: number
  createdAt: string
}

interface Props {
  data: HotReviewItem
  index: number
}

const props = withDefaults(defineProps<Props>(), {})

const reviewDialogRef = ref<InstanceType<typeof ReviewDialog>>()

const displayUsername = computed(() => props.data.author.username || '匿名用户')
const displayTimeAgo = computed(() => {
  const t = new Date(props.data.createdAt).toLocaleString()
  return t
})

const movieName = computed(() => props.data.movie?.name || '未知影片')
const movieImage = computed(() => props.data.movie?.image || '')

const handleAddReview = () => {
  reviewDialogRef.value?.openDialog(props.data._id)
}

const handleCommentAdded = () => {
  if (typeof props.data.commentCount === 'number') {
    props.data.commentCount += 1
  } else {
    props.data.commentCount = 1
  }
}

const handleLike = async () => {
  const { execute } = toggleLikeReview(props.data._id)
  const result = await execute()
  if (result) {
    props.data.likeCount = result.likeCount
  }
}

const handleClickMovie = () => {
  const name = props.data.movie?.name
  if (!name) return
  router.push({ name: 'filmDetail', params: { name } })
}
</script>
<template>
  <div class=" flex flex-col items-start px-10 py-4 ">
    <!-- 用户信息 -->
    <div class="flex items-start gap-2 ml-9">
      <NAvatar
        v-if="data.author.avatar"
        round
        bordered
        :size="46"
        :src="data.author.avatar || 'https://github.com/shadcn.png'"
        style="border-color: black; border-width: 3px"
      />

      <div class="flex flex-col items-start">
        <div class="text-sm font-bold">{{ displayUsername }}</div>
        <div class="text-xs text-gray-500">{{ displayTimeAgo }}</div>
      </div>
    </div>

    <!-- 评论信息 -->
    <div class="flex items-center gap-3">
      <!-- 电影展示 -->
      <div
        :class="index % 2 === 0 ? '-rotate-3' : 'rotate-3'"
        class="flex flex-col flex-1 border-black rounded-md border-4 w-[200px] h-[300px] cursor-pointer" 
        @click="handleClickMovie"
      >
        <img
          v-if="movieImage"
          :src="movieImage"
          alt="图片"
          class="w-full h-[85%] object-cover bg-center"
        />
        <div class="border-black w-full border-2"></div>
        <div class="flex-1 font-bold bg-yellow-400 flex items-center text-[16px] justify-center">
          {{ movieName }}
        </div>
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
            :default-value="data.score / 2"
            :size="28"
          />
          <div
            class="text-[22px] font-bold w-[90%] mt-2 "
          >
            {{ data.content }}
          </div>
        </div>
      </div>
      <!-- 按钮列 -->
      <div class="flex items-baseline gap-4 pl-10 -mt-8">
        <NButton
          v-if="data.likeCount !== undefined"
          bordered
          round
          size="large"
          color="#FF8AAE"
          @click="handleLike"
        >
          <template #icon>
            <Nicon><HeartIcon :size="18" /></Nicon>
          </template>
           {{ data.likeCount || '点赞'}}
        </NButton>
        <NButton bordered round size="large" color="#8a2be2" @click="handleAddReview">
          <template #icon>
          <Nicon><MessageCircleCodeIcon :size="18" /></Nicon>
        </template>
          {{data.commentCount || '回复'}}
        </NButton>
        <NButton tertiary circle size="large" color="#8a2be2">
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
      :movie-name="movieName"
      @comment-added="handleCommentAdded"
    />
  </div>
</template>


