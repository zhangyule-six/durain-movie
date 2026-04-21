<script setup lang="ts">
import { computed, ref } from 'vue'
import { NModal, NInput, NDivider } from 'naive-ui'
import { useRequest } from '@/api/http'
import CommentTreeItem, {
  type CommentNode,
} from '@/components/CommentTreeItem.vue'
import { useUserStore } from '@/stores/useUser'
import { useMessage } from 'naive-ui'

interface Props {
  movieName: string
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'comment-added'): void
}>()

const userStore = useUserStore()
const message = useMessage()
const show = ref(false)
const reviewText = ref('')
const expanded = ref(false)

// 当前弹窗对应的影评 ID & 回复目标
const currentReviewId = ref<string | null>(null)
const replyTarget = ref<CommentNode | null>(null)

const comments = ref<CommentNode[]>([])

const displayedComments = computed(() => {
  return expanded.value ? comments.value : comments.value.slice(0, 3)
})

const createListRequest = (reviewId: string) =>
  useRequest<CommentNode[], unknown>({
    url: `/api/comments/review/${reviewId}`,
    method: 'GET'
  })

const loadComments = async (reviewId: string) => {
  const { execute } = createListRequest(reviewId)
  try {
    const list = await execute()
    comments.value = Array.isArray(list) ? list : []
  } catch {
    comments.value = []
  }
}

const handleSubmit = async () => {
  if (!userStore.requireLogin()) return
  if (!reviewText.value.trim() || !currentReviewId.value) return

  const payload: {
    reviewId: string
    content: string
    parentCommentId?: string
    replyToUserId?: string
  } = {
    reviewId: currentReviewId.value,
    content: reviewText.value.trim()
  }

  if (replyTarget.value) {
    payload.parentCommentId = replyTarget.value._id
    // 被回复用户由后端通过 parentComment 推断
  }

  try {
    // 针对本次提交创建请求（useRequest 的 execute 无参数，因此 body 放在 options 里）
    const { execute } = useRequest<CommentNode, typeof payload>({
      url: '/api/comments',
      method: 'POST',
      body: payload
    })
    await execute()
    await loadComments(currentReviewId.value)
    reviewText.value = ''
    emit('comment-added')
  } catch (e: any) {
    message.error(e?.message || '发送失败，请稍后重试')
  }
}

const openDialog = (reviewId: string, target?: CommentNode | null) => {
  currentReviewId.value = reviewId
  replyTarget.value = target || null
  show.value = true
  loadComments(reviewId)
}

const closeDialog = () => {
  show.value = false
  replyTarget.value = null
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
    <div
      class="flex flex-col gap-4 border-4 border-black rounded-lg p-4 bg-white max-h-[70vh] overflow-y-auto"
    >
      <!-- 多层级评论 -->
      <div class="flex flex-col gap-3">
        <template v-if="comments.length">
          <CommentTreeItem
            v-for="item in displayedComments"
            :key="item._id"
            :node="item"
            @reply="(node) => openDialog(currentReviewId!, node)"
          />
        </template>
        <div v-else class="text-xs text-gray-500">还没有回复，快来抢沙发吧～</div>

        <div v-if="comments.length > 3" class="flex justify-center pt-2">
          <button
            @click="expanded = !expanded"
            class="expand-button"
          >
            {{ expanded ? '...收起' : '...展开更多回复' }}
          </button>
        </div>
      </div>

      <NDivider />

      <!-- 输入框 -->
      <div>
        <label class="text-sm font-bold mb-2 block text-yellow-600">
          {{ replyTarget ? `回复 @${replyTarget.author.username}` : '写下你的回复吧~' }}
        </label>
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
/* 黑框样式，与系统统一黑边+黄色主色 */
::deep(.n-dialog__content) {
  border: 4px solid black;
}

::deep(.n-button--primary) {
  background-color: #fbbf24 !important;
  border-color: #fbbf24 !important;
  color: black !important;
}

::deep(.n-button--primary:hover) {
  background-color: #f59e0b !important;
  border-color: #f59e0b !important;
}

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
