<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useUserStore } from '@/stores/useUser'
import {
  useGetGroupDetail,
  useListGroupMessages,
  useSendGroupMessage,
  type GroupMessageItem,
} from '@/api/community'
import { getCommunitySocket } from '@/lib/communitySocket'
import { useCheckAuth } from '@/api/auth'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const message = useMessage()

const groupId = computed(() => String(route.params.groupId || ''))
const groupDetail = ref<any>(null)
const messages = ref<GroupMessageItem[]>([])
const onlineCount = ref(0)
const loading = ref(false)
const sending = ref(false)
const input = ref('')
const messagePanel = ref<HTMLElement | null>(null)
const socket = getCommunitySocket()
const authReady = ref(false)

const currentUserId = computed(() => userStore.user?._id || '')

function formatMessageTime(raw: string | Date) {
  const d = new Date(raw)
  const now = new Date()
  const time = d.toLocaleTimeString()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  const sameYear =
    d.getFullYear() === now.getFullYear()
  if (sameDay){
    return time
  } else if (!sameYear) {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${time}`
  }
  return `${d.getMonth() + 1}月${d.getDate()}日 ${time}`
}

function isMine(item: GroupMessageItem) {
  return item.sender?._id === currentUserId.value
}

function scrollToBottom() {
  nextTick(() => {
    if (!messagePanel.value) return
    messagePanel.value.scrollTop = messagePanel.value.scrollHeight
  })
}

async function fetchInitData() {
  if (!groupId.value) return
  loading.value = true
  try {
    const [detailRes, messageRes] = await Promise.all([
      useGetGroupDetail(groupId.value).execute(),
      useListGroupMessages(groupId.value, 1, 50).execute(),
    ])
    groupDetail.value = detailRes
    messages.value = messageRes.items
    scrollToBottom()
  } catch (error: any) {
    message.error(error?.message || '加载群聊失败')
    router.push({ name: 'community' })
  } finally {
    loading.value = false
  }
}

async function sendMessage() {
  const content = input.value.trim()
  if (!content || !groupId.value) return
  sending.value = true
  try {
    socket.emit('message:send', { groupId: groupId.value, content })
    input.value = ''
  } catch (error: any) {
    try {
      await useSendGroupMessage(groupId.value, content).execute()
      input.value = ''
    } catch (inner: any) {
      message.error(inner?.message || error?.message || '发送失败')
    }
  } finally {
    sending.value = false
  }
}

function bindSocket() {
  socket.emit('group:join', { groupId: groupId.value })

  socket.off('message:new')
  socket.on('message:new', (payload: GroupMessageItem) => {
    if (payload.group !== groupId.value) return
    messages.value.push(payload)
    scrollToBottom()
  })

  socket.off('group:presence')
  socket.on('group:presence', (payload: { groupId: string; onlineCount: number }) => {
    if (payload.groupId !== groupId.value) return
    onlineCount.value = payload.onlineCount
  })

  socket.off('group:error')
  socket.on('group:error', (payload: { message: string }) => {
    message.warning(payload?.message || '群聊异常')
  })
}

watch(
  () => groupId.value,
  async (newId, oldId) => {
    if (!newId || !userStore.user) return
    if (oldId) socket.emit('group:leave', { groupId: oldId })
    await fetchInitData()
    bindSocket()
  },
  { immediate: true },
)

onMounted(() => {
  if (userStore.user) {
    authReady.value = true
    return
  }
  useCheckAuth()
    .execute()
    .then((user) => userStore.setUser(user))
    .catch(() => userStore.setUser(null))
    .finally(() => {
      authReady.value = true
    })
})

watch(
  () => userStore.user,
  (user) => {
    if (!authReady.value) return
    if (!user) {
      message.warning('请先登录后再进入社区')
      router.push({ name: 'home' })
      return
    }
    if (groupId.value) {
      fetchInitData().then(bindSocket)
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  if (groupId.value) socket.emit('group:leave', { groupId: groupId.value })
})
</script>

<template>
  <div class="relative box-border h-[calc(100vh-8rem)] overflow-hidden p-4 md:p-6">
    <div
      v-if="loading"
      class="absolute inset-0 z-10 flex items-center justify-center bg-white/60 text-sm text-[#6b7280]"
    >
      加载中...
    </div>
    <div class="grid h-full min-h-0 grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
        <aside class="h-full min-h-0 overflow-y-auto rounded-2xl border border-black/10 bg-white p-4">
          <h2 class="text-xl font-bold text-[#1f2937]">{{ groupDetail?.name || '小组' }}</h2>
          <p class="mt-2 text-sm text-[#6b7280]">
            {{ groupDetail?.description || '欢迎来到同好社区，开始你们的讨论吧。' }}
          </p>
          <div class="mt-4 space-y-1 text-sm text-[#374151]">
            <div>成员：{{ groupDetail?.memberCount || 0 }}/99</div>
            <div>在线：{{ onlineCount }}</div>
          </div>
          <div class="mt-4">
            <div class="mb-2 text-xs text-[#6b7280]">成员预览</div>
            <div class="space-y-2">
              <div
                v-for="m in groupDetail?.membersPreview || []"
                :key="m._id"
                class="flex items-center gap-2"
              >
                <img
                  :src="m.avatar || 'https://cdn.example.com/default.png'"
                  alt="avatar"
                  class="h-[26px] w-[26px] rounded-full object-cover"
                />
                <span class="text-sm text-[#111827]">{{ m.username }}</span>
              </div>
            </div>
          </div>
        </aside>

        <section class="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white">
          <header class="border-b border-black/10 px-4 py-3 text-sm text-[#4b5563]">
            正在群聊：{{ groupDetail?.name || '-' }}
          </header>
          <div ref="messagePanel" class="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <div v-if="messages.length === 0" class="pt-16 text-center text-sm text-[#9ca3af]">
              暂无消息，发送第一条吧
            </div>
            <div
              v-for="item in messages"
              :key="item._id"
              class="mb-3 flex"
              :class="isMine(item) ? 'justify-end' : 'justify-start'"
            >
              <div class="max-w-[75%]">
                <div
                  class="mb-1 text-xs text-[#9ca3af]"
                  :class="isMine(item) ? 'text-right' : 'text-left'"
                >
                  {{ item.sender?.username || '匿名用户' }} ·
                  {{ formatMessageTime(item.createdAt) }}
                </div>
                <div
                  class="rounded-2xl px-3 py-2 text-sm leading-6 wrap-break-word"
                  :class="
                    isMine(item)
                      ? 'rounded-br-md bg-[#f07050] text-white'
                      : 'rounded-bl-md bg-[#f3f4f6] text-[#111827]'
                  "
                >
                  {{ item.content }}
                </div>
              </div>
            </div>
          </div>
          <footer class="border-t border-black/10 p-3">
            <div class="flex items-end gap-2">
              <n-input
                v-model:value="input"
                type="textarea"
                :autosize="{ minRows: 2, maxRows: 5 }"
                placeholder="输入消息，按 Enter 发送（Shift+Enter 换行）"
                @keydown.enter.exact.prevent="sendMessage"
              />
              <n-button type="primary" :loading="sending" @click="sendMessage">发送</n-button>
            </div>
          </footer>
        </section>
    </div>
  </div>
</template>
