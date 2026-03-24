<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  NRate,
  NAvatar,
  NButton,
  NInput,
  NDivider,
  useMessage,
} from 'naive-ui'
import { useRequest } from '@/api/http'
import CommentTreeItem, {
  type CommentNode,
} from '@/components/CommentTreeItem.vue'

interface FilmReviewItem {
  _id: string
  author: { username: string; avatar?: string }
  score: number
  content: string
  likeCount: number
  commentCount: number
  createdAt: string
}

const props = defineProps<{
  movieId: string | null
}>()

const message = useMessage()

const reviews = ref<FilmReviewItem[]>([])
const reviewsLoading = ref(false)
const reviewsError = ref<string | null>(null)

const newReviewScore = ref<number | undefined>(undefined)
const newReviewContent = ref('')

const reviewInputRef = ref<InstanceType<typeof NInput> | null>(null)
const reviewSectionRef = ref<HTMLElement | null>(null)

const expandedThreads = ref<Record<string, boolean>>({})
const threadTrees = ref<Record<string, CommentNode[]>>({})
const threadLoading = ref<Record<string, boolean>>({})
const threadError = ref<Record<string, string | undefined>>({})

const activeReply = ref<{
  reviewId: string
  parent: CommentNode | null
} | null>(null)
const replyDraft = ref('')

async function loadReviewsForMovie() {
  const id = props.movieId
  if (!id) return
  reviewsLoading.value = true
  reviewsError.value = null
  try {
    const { execute } = useRequest<{
      items: FilmReviewItem[]
    }>({
      url: `/api/reviews/movie/${id}`,
      method: 'GET',
      body: { limit: 20, page: 1 },
    })
    const res = await execute()
    const items = Array.isArray(res?.items) ? res.items : []
    items.sort((a, b) => {
      if (b.likeCount !== a.likeCount)
        return b.likeCount - a.likeCount
      if (b.commentCount !== a.commentCount)
        return b.commentCount - a.commentCount
      return (
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
      )
    })
    reviews.value = items
  } catch (e: any) {
    reviewsError.value = e?.message || '加载评论失败'
  } finally {
    reviewsLoading.value = false
  }
}

async function loadCommentsForReview(reviewId: string) {
  threadLoading.value = {
    ...threadLoading.value,
    [reviewId]: true,
  }
  threadError.value = { ...threadError.value, [reviewId]: undefined }
  try {
    const { execute } = useRequest<CommentNode[]>({
      url: `/api/comments/review/${reviewId}`,
      method: 'GET',
    })
    const list = await execute()
    threadTrees.value = {
      ...threadTrees.value,
      [reviewId]: Array.isArray(list) ? list : [],
    }
  } catch (e: any) {
    threadError.value = {
      ...threadError.value,
      [reviewId]: e?.message || '加载回复失败',
    }
    threadTrees.value = { ...threadTrees.value, [reviewId]: [] }
  } finally {
    threadLoading.value = {
      ...threadLoading.value,
      [reviewId]: false,
    }
  }
}

async function toggleThread(review: FilmReviewItem) {
  const id = review._id
  const next = !expandedThreads.value[id]
  expandedThreads.value = { ...expandedThreads.value, [id]: next }
  if (next && threadTrees.value[id] === undefined) {
    await loadCommentsForReview(id)
  }
}

function openReplyToReview(reviewId: string) {
  activeReply.value = { reviewId, parent: null }
}

function openReplyToComment(reviewId: string, node: CommentNode) {
  activeReply.value = { reviewId, parent: node }
}

function cancelReply() {
  activeReply.value = null
  replyDraft.value = ''
}

async function submitReply() {
  if (!activeReply.value || !replyDraft.value.trim()) {
    message.warning('请填写回复内容')
    return
  }
  const { reviewId, parent } = activeReply.value
  const payload: {
    reviewId: string
    content: string
    parentCommentId?: string
    replyToUserId?: string
  } = {
    reviewId,
    content: replyDraft.value.trim(),
  }
  if (parent) {
    payload.parentCommentId = parent._id
    const uid = parent.author?._id
    if (uid) payload.replyToUserId = uid
  }
  try {
    const { execute } = useRequest<CommentNode, typeof payload>({
      url: '/api/comments',
      method: 'POST',
      body: payload,
    })
    await execute()
    replyDraft.value = ''
    activeReply.value = null
    await loadCommentsForReview(reviewId)
    await loadReviewsForMovie()
    message.success('回复已发送')
  } catch (e: any) {
    message.error(e?.message || '发送失败，请确认已登录')
  }
}

async function handleSubmitReview() {
  if (!props.movieId) return
  if (
    newReviewScore.value === undefined ||
    !newReviewContent.value.trim()
  ) {
    message.warning('请先选择评分并填写评论内容')
    return
  }
  const score = Math.min(
    Math.max(newReviewScore.value * 2, 1),
    10,
  )
  try {
    const { execute } = useRequest<
      FilmReviewItem,
      {
        movieId: string
        score: number
        content: string
      }
    >({
      url: '/api/reviews',
      method: 'POST',
      body: {
        movieId: props.movieId,
        score,
        content: newReviewContent.value.trim(),
      },
    })
    await execute()
    newReviewContent.value = ''
    newReviewScore.value = undefined
    await loadReviewsForMovie()
    message.success('评论已发布')
  } catch (e: any) {
    message.error(
      e?.message || '发布评论失败，请确认已登录',
    )
  }
}

function focusComposer() {
  if (reviewSectionRef.value) {
    reviewSectionRef.value.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }
  setTimeout(() => {
    reviewInputRef.value?.focus()
  }, 400)
}

watch(
  () => props.movieId,
  (id) => {
    reviews.value = []
    reviewsError.value = null
    expandedThreads.value = {}
    threadTrees.value = {}
    threadLoading.value = {}
    threadError.value = {}
    activeReply.value = null
    replyDraft.value = ''
    if (id) loadReviewsForMovie()
  },
  { immediate: true },
)

defineExpose({ focusComposer })
</script>

<template>
  <section
    ref="reviewSectionRef"
    class="border-2 border-black rounded-3xl bg-white/80 p-5 flex flex-col gap-4"
  >
    <div class="flex items-center justify-between">
      <div class="text-lg font-extrabold">观众评论</div>
    </div>
    <div class="flex flex-col gap-3">
      <div class="flex items-center gap-3">
        <span class="text-xs text-gray-600">你的评分：</span>
        <NRate
          allow-half
          v-model:value="newReviewScore"
          :max="5"
          :size="20"
        />
      </div>
      <NInput
        ref="reviewInputRef"
        v-model:value="newReviewContent"
        type="textarea"
        placeholder="写下你对这部电影的看法…"
        :rows="4"
      />
      <div class="flex justify-end">
        <NButton
          type="primary"
          size="small"
          strong
          round
          @click="handleSubmitReview"
        >
          发表评价
        </NButton>
      </div>
    </div>
    <NDivider />
    <div class="flex flex-col gap-3">
      <div
        v-if="reviewsLoading"
        class="text-xs text-gray-500"
      >
        正在加载评论…
      </div>
      <div
        v-else-if="reviewsError"
        class="text-xs text-red-500"
      >
        {{ reviewsError }}
      </div>
      <template v-else>
        <div
          v-if="reviews.length"
          class="flex flex-col gap-4"
        >
          <div
            v-for="item in reviews"
            :key="item._id"
            class="flex flex-col gap-2 border-b border-black/10 pb-4 last:border-0 last:pb-0"
          >
            <div class="flex items-start gap-3">
              <NAvatar
                :src="item.author.avatar"
                :size="40"
                round
                class="border border-black shrink-0"
              />
              <div class="flex-1 min-w-0">
                <div
                  class="flex items-center justify-between text-xs mb-1"
                >
                  <span
                    class="font-bold truncate max-w-[120px]"
                  >
                    {{ item.author.username }}
                  </span>
                  <span
                    class="text-emerald-600 font-semibold"
                  >
                    {{ item.score.toFixed(1) }}
                  </span>
                </div>
                <div
                  class="text-[11px] text-gray-500 mb-1"
                >
                  {{
                    new Date(item.createdAt).toLocaleString()
                  }}
                  · 点赞 {{ item.likeCount }} · 回复
                  {{ item.commentCount }}
                </div>
                <div
                  class="text-xs text-gray-700 leading-snug"
                >
                  {{ item.content }}
                </div>
                <div class="flex flex-wrap gap-2 mt-2">
                  <NButton
                    size="tiny"
                    quaternary
                    @click="toggleThread(item)"
                  >
                    {{
                      expandedThreads[item._id]
                        ? '收起回复'
                        : item.commentCount > 0
                          ? `展开 ${item.commentCount} 条回复`
                          : '查看回复'
                    }}
                  </NButton>
                  <NButton
                    size="tiny"
                    quaternary
                    @click="openReplyToReview(item._id)"
                  >
                    回复影评
                  </NButton>
                </div>
              </div>
            </div>

            <div
              v-if="expandedThreads[item._id]"
              class="pl-4 md:pl-8 border-l-2 border-black/20 flex flex-col gap-2"
            >
              <div
                v-if="threadLoading[item._id]"
                class="text-[11px] text-gray-500"
              >
                正在加载回复…
              </div>
              <div
                v-else-if="threadError[item._id]"
                class="text-[11px] text-red-500"
              >
                {{ threadError[item._id] }}
              </div>
              <template v-else>
                <div
                  v-if="(threadTrees[item._id] || []).length"
                  class="flex flex-col gap-2"
                >
                  <CommentTreeItem
                    v-for="root in threadTrees[item._id] || []"
                    :key="root._id"
                    :node="root"
                    @reply="
                      (node) => openReplyToComment(item._id, node)
                    "
                  />
                </div>
                <div
                  v-else
                  class="text-[11px] text-gray-500"
                >
                  暂无回复，来写第一条吧～
                </div>
              </template>
            </div>

            <div
              v-if="
                activeReply && activeReply.reviewId === item._id
              "
              class="flex flex-col gap-2 rounded-xl border border-black/20 bg-white/60 p-3"
            >
              <div class="text-[11px] font-semibold text-gray-700">
                {{
                  activeReply.parent
                    ? `回复 @${activeReply.parent.author.username}`
                    : '回复该影评'
                }}
              </div>
              <NInput
                v-model:value="replyDraft"
                type="textarea"
                placeholder="输入回复内容…"
                :rows="3"
              />
              <div class="flex justify-end gap-2">
                <NButton size="tiny" @click="cancelReply">
                  取消
                </NButton>
                <NButton
                  type="primary"
                  size="tiny"
                  strong
                  round
                  @click="submitReply"
                >
                  发送
                </NButton>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-xs text-gray-500">
          暂无评论，快来写下你的第一条评价吧～
        </div>
      </template>
    </div>
  </section>
</template>
