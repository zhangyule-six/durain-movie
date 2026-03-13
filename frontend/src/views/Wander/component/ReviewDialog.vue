<script setup lang="ts">
import { ref } from 'vue'
import { NModal, NButton, NInput, NDivider, NAvatar } from 'naive-ui'
import type { ReviewData } from '../config'

interface Props {
  movieName: string
}

const props = defineProps<Props>()

const show = ref(false)
const reviewText = ref('')
const expanded = ref(false)

const mockOtherReviews = ref<ReviewData[]>([
  {
    id: 100,
    username: '评论用户1',
    avatar: 'https://github.com/shadcn.png',
    timeAgo: '1d ago',
    movieName: 'Movie',
    movieImage: 'https://picsum.photos/200/300',
    rating: 4,
    reviewText: '"This movie is incredible! A masterpiece."'
  },
  {
    id: 101,
    username: '评论用户2',
    avatar: 'https://github.com/shadcn.png',
    timeAgo: '2d ago',
    movieName: 'Movie',
    movieImage: 'https://picsum.photos/200/300',
    rating: 5,
    reviewText: '"Best movie I\'ve ever seen!"'
  },
  {
    id: 102,
    username: '评论用户3',
    avatar: 'https://github.com/shadcn.png',
    timeAgo: '3d ago',
    movieName: 'Movie',
    movieImage: 'https://picsum.photos/200/300',
    rating: 4,
    reviewText: '"Great cinematography and storytelling!"'
  },
  {
    id: 103,
    username: '评论用户4',
    avatar: 'https://github.com/shadcn.png',
    timeAgo: '4d ago',
    movieName: 'Movie',
    movieImage: 'https://picsum.photos/200/300',
    rating: 5,
    reviewText: '"One of my favorite films of all time."'
  }
])

const displayedReviews = () => {
  return expanded.value ? mockOtherReviews.value : mockOtherReviews.value.slice(0, 3)
}

const handleSubmit = () => {
  if (reviewText.value.trim()) {
    const newReview: ReviewData = {
      id: Math.random(),
      username: '当前用户',
      avatar: 'https://github.com/shadcn.png',
      timeAgo: 'now',
      movieName: props.movieName,
      movieImage: 'https://picsum.photos/200/300',
      rating: 5,
      reviewText: reviewText.value
    }
    // 添加到其他评论列表的最前面
    mockOtherReviews.value.unshift(newReview)
    reviewText.value = ''
  }
}

const openDialog = () => {
  show.value = true
}

const closeDialog = () => {
  show.value = false
}

const handleSubmitWithoutClose = () => {
  handleSubmit()
  return false
}

defineExpose({
  openDialog,
  closeDialog
})
</script>


<template>
  <NModal
    v-model:show="show"
    :mask-closable="true"
    preset="dialog"
    positive-text="发送"
    negative-text="关闭"
    @positive-click="handleSubmitWithoutClose"
    @negative-click="closeDialog"
    class="dialog-wrapper"
  >
    <div class="flex flex-col gap-4 border-4 border-black rounded-lg p-4 bg-white">
      <!-- 其他评论 -->
      <div class="flex flex-col gap-3">
        <div
          v-for="review in displayedReviews()"
          :key="review.id"
          class="border rounded-md p-3 bg-gray-50"
        >
          <div class="flex items-start gap-2 mb-2">
            <NAvatar
              round
              :size="32"
              :src="review.avatar"
            />
            <div class="flex-1 flex flex-col">
              <div class="text-sm font-bold">{{ review.username }}</div>
              <div class="text-xs text-gray-500">2h ago</div>
            </div>
          </div>
          <div class="text-sm">{{ review.reviewText }}</div>
        </div>
        <!-- 展开按钮 -->
        <div v-if="mockOtherReviews.length > 3" class="flex justify-center pt-2">
          <button
            @click="expanded = !expanded"
            class="expand-button"
          >
            {{ expanded ? '...收起' : '...展开' }}
          </button>
        </div>
      </div>
      <NDivider />
      <!-- 输入框 -->
      <div>
        <label class="text-sm font-bold mb-2 block text-yellow-600">写下你的回复吧~</label>
        <NInput
          v-model:value="reviewText"
          type="textarea"
          placeholder="分享你对这部电影的看法..."
          :rows="4"
        />
      </div>
    </div>
  </NModal>
</template>

<style scoped>
/* 黑框样式 */
:deep(.n-dialog__content) {
  border: 4px solid black;
}

/* 黄色主题按钮 */
:deep(.n-button--primary) {
  background-color: #fbbf24 !important;
  border-color: #fbbf24 !important;
  color: black !important;
}

:deep(.n-button--primary:hover) {
  background-color: #f59e0b !important;
  border-color: #f59e0b !important;
}

/* 展开按钮黄色主题 */
.expand-button {
  color: #666;
  background: none;
  border: none;
  font-size: 0.875rem;
  cursor: pointer;
  transition: color 0.2s ease;
}

.expand-button:hover {
  color: #fbbf24 !important;
}
</style>
