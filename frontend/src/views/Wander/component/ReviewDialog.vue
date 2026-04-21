<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NInput, NButton, NIcon } from 'naive-ui'
import { Send } from 'lucide-vue-next'
import { useRequest } from '@/api/http'
import CommentTreeItem, {
  type CommentNode,
} from '@/components/CommentTreeItem.vue'
import { useUserStore } from '@/stores/useUser'
import { useMessage } from 'naive-ui'

interface Props {
  reviewId: string
  expanded: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:expanded', value: boolean): void
  (e: 'comment-added'): void
}>()

const userStore = useUserStore()
const message = useMessage()
const reviewText = ref('')
const showAll = ref(false)
const loaded = ref(false)

const replyTarget = ref<CommentNode | null>(null)
const comments = ref<CommentNode[]>([])

const displayedComments = computed(() => {
  return showAll.value ? comments.value : comments.value.slice(0, 3)
})

const createListRequest = (reviewId: string) =>
  useRequest<CommentNode[], unknown>({
    url: `/api/comments/review/${reviewId}`,
    method: 'GET',
  })

const loadComments = async () => {
  if (!props.reviewId) return
  const { execute } = createListRequest(props.reviewId)
  try {
    const list = await execute()
    comments.value = Array.isArray(list) ? list : []
  } catch {
    comments.value = []
  }
}

watch(
  () => props.expanded,
  (open) => {
    if (open && !loaded.value) {
      loaded.value = true
      loadComments()
    }
  },
)

const handleReply = (node: CommentNode) => {
  replyTarget.value = node
}

const clearReplyTarget = () => {
  replyTarget.value = null
}

const handleSubmit = async () => {
  if (!userStore.requireLogin()) return
  if (!reviewText.value.trim() || !props.reviewId) return

  const payload: {
    reviewId: string
    content: string
    parentCommentId?: string
  } = {
    reviewId: props.reviewId,
    content: reviewText.value.trim(),
  }

  if (replyTarget.value) {
    payload.parentCommentId = replyTarget.value._id
  }

  try {
    const { execute } = useRequest<CommentNode, typeof payload>({
      url: '/api/comments',
      method: 'POST',
      body: payload,
    })
    await execute()
    await loadComments()
    reviewText.value = ''
    replyTarget.value = null
    emit('comment-added')
  } catch (e: any) {
    message.error(e?.message || '发送失败，请稍后重试')
  }
}
</script>

<template>
  <div class="comment-collapse" :class="{ 'is-open': expanded }">
    <div class="overflow-hidden">
      <div
        v-if="loaded"
        class="mt-3 flex flex-col gap-3 rounded-lg border-2 border-dashed border-black/20 bg-[#faf9f6] p-3"
      >
        <!-- 评论列表 -->
        <div class="flex flex-col gap-2">
          <template v-if="comments.length">
            <CommentTreeItem
              v-for="item in displayedComments"
              :key="item._id"
              :node="item"
              @reply="handleReply"
            />
          </template>
          <div v-else class="py-2 text-center text-xs text-gray-400">
            还没有回复，快来抢沙发吧～
          </div>

          <button
            v-if="comments.length > 3"
            class="self-center text-xs text-gray-500 transition-colors hover:text-yellow-600"
            @click="showAll = !showAll"
          >
            {{ showAll ? '收起' : `查看全部 ${comments.length} 条回复` }}
          </button>
        </div>

        <!-- 回复输入 -->
        <div class="flex flex-col gap-1.5 border-t border-black/10 pt-3">
          <div
            v-if="replyTarget"
            class="flex items-center gap-1 text-xs text-yellow-700"
          >
            <span>回复 @{{ replyTarget.author.username }}</span>
            <button class="ml-1 text-gray-400 hover:text-gray-600" @click="clearReplyTarget">✕</button>
          </div>
          <div class="flex items-end gap-2">
            <NInput
              v-model:value="reviewText"
              type="textarea"
              :autosize="{ minRows: 1, maxRows: 3 }"
              placeholder="写下你的回复..."
              size="small"
              @keydown.enter.exact.prevent="handleSubmit"
            />
            <NButton
              type="primary"
              size="small"
              :disabled="!reviewText.trim()"
              @click="handleSubmit"
            >
              <template #icon>
                <NIcon><Send :size="14" /></NIcon>
              </template>
            </NButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comment-collapse {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s ease-out;
}

.comment-collapse.is-open {
  grid-template-rows: 1fr;
}
</style>
