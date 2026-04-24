<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { NAvatar, NRate, NButton, NIcon, useDialog } from 'naive-ui'
import { HeartIcon, MessageCircleCodeIcon, PlusCircle, CheckCircle2 } from 'lucide-vue-next'
import ReviewDialog from './ReviewDialog.vue'
import { toggleLikeReview } from '@/api/reviews'
import router from '@/router'
import { useUserStore } from '@/stores/useUser'
import { useFollow } from '@/composables/useFollow'

export interface HotReviewItem {
  _id: string
  author: { _id?: string; username: string; avatar?: string }
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
const userStore = useUserStore()
const dialog = useDialog()

const isOwnReview = computed(() => {
  return userStore.user?._id === props.data.author?._id
})

const authorId = computed(() => props.data.author?._id || '')

const {
  isFollowing,
  loading: followLoading,
  checkStatus: checkFollowStatus,
} = useFollow(authorId.value)

onMounted(() => {
  if (userStore.isLoggedIn && authorId.value && !isOwnReview.value) {
    checkFollowStatus()
  }
})

const handleFollow = () => {
  if (!userStore.requireLogin()) return
  if (!authorId.value) return

  if (isFollowing.value) {
    dialog.warning({
      title: '取消关注',
      content: `确定取消关注 ${props.data.author.username} 吗？`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        const { unfollow } = useFollow(authorId.value)
        await unfollow()
        isFollowing.value = false
      },
    })
  } else {
    const { follow } = useFollow(authorId.value)
    follow().then(() => {
      isFollowing.value = true
    })
  }
}

const commentExpanded = ref(false)

const displayUsername = computed(() => props.data.author.username || '匿名用户')
const displayTimeAgo = computed(() => {
  const t = new Date(props.data.createdAt).toLocaleString()
  return t
})

const movieName = computed(() => props.data.movie?.name || '未知影片')
const movieImage = computed(() => props.data.movie?.image || '')

const handleToggleComments = () => {
  if (!userStore.requireLogin()) return
  commentExpanded.value = !commentExpanded.value
}

const handleCommentAdded = () => {
  if (typeof props.data.commentCount === 'number') {
    props.data.commentCount += 1
  } else {
    props.data.commentCount = 1
  }
}

const handleLike = async () => {
  if (!userStore.requireLogin()) return
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

const handleClickAuthor = () => {
  const authorId = props.data.author?._id
  if (!authorId) return
  router.push({ name: 'userProfile', params: { userId: authorId } })
}
</script>

<template>
  <div class="flex w-full flex-col self-start">
    <!-- 用户信息 -->
    <div class="mb-2 flex items-center gap-2 px-1">
      <NAvatar
        :class="data.author?._id ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'"
        round
        bordered
        :size="38"
        :src="data.author.avatar || 'https://github.com/shadcn.png'"
        style="border-color: black; border-width: 2px"
        @click="handleClickAuthor"
      />
      <div class="flex flex-col">
        <div class="text-sm font-bold leading-tight">{{ displayUsername }}</div>
        <div class="text-xs text-gray-500">{{ displayTimeAgo }}</div>
      </div>
    </div>

    <!-- 主内容：海报 + 评论 -->
    <div class="flex gap-3">
      <!-- 电影海报 -->
      <div
        :class="index % 2 === 0 ? '-rotate-2' : 'rotate-2'"
        class="flex w-[35%] max-w-[160px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-md border-[3px] border-black"
        @click="handleClickMovie"
      >
        <img
          v-if="movieImage"
          :src="movieImage"
          alt="海报"
          class="aspect-2/3 w-full object-cover"
        />
        <div class="border-t-2 border-black bg-yellow-400 px-1 py-1.5 text-center text-xs font-bold leading-tight">
          {{ movieName.length > 8 ? movieName.slice(0, 8) + '…' : movieName }}
        </div>
      </div>

      <!-- 评论区域 -->
      <div class="flex min-w-0 flex-1 flex-col">
        <div class="flex flex-1 flex-col gap-2 rounded-lg border-[3px] border-black bg-white p-4">
          <NRate
            readonly
            allow-half
            :max="5"
            :default-value="data.score / 2"
            :size="22"
          />
          <div class="mt-1 text-sm font-bold leading-relaxed line-clamp-6">
            {{ data.content }}
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="mt-2 flex items-center gap-3">
          <NButton
            v-if="data.likeCount !== undefined"
            bordered
            round
            size="small"
            color="#FF8AAE"
            @click="handleLike"
          >
            <template #icon>
              <NIcon><HeartIcon :size="14" /></NIcon>
            </template>
            {{ data.likeCount || '点赞' }}
          </NButton>
          <NButton
            bordered
            round
            size="small"
            color="#8a2be2"
            @click="handleToggleComments"
          >
            <template #icon>
              <NIcon><MessageCircleCodeIcon :size="14" /></NIcon>
            </template>
            {{ data.commentCount || '回复' }}
          </NButton>
          <NButton
            v-if="!isOwnReview && authorId"
            tertiary
            circle
            size="small"
            :color="isFollowing ? '#22c55e' : '#8a2be2'"
            :disabled="followLoading"
            @click="handleFollow"
          >
            <template #icon>
              <NIcon>
                <CheckCircle2 v-if="isFollowing" :size="20" />
                <PlusCircle v-else :size="20" />
              </NIcon>
            </template>
          </NButton>
        </div>
      </div>
    </div>

    <!-- 内联评论区 -->
    <ReviewDialog
      v-model:expanded="commentExpanded"
      :review-id="data._id"
      @comment-added="handleCommentAdded"
    />
  </div>
</template>
