<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { NDrawer, NDrawerContent, NAvatar, NButton, useDialog, useMessage } from 'naive-ui'
import { useFollowingList, useFollowersList, type FollowUserInfo } from '@/api/follow'
import { useFollow } from '@/composables/useFollow'
import { useUserStore } from '@/stores/useUser'

const props = defineProps<{
  visible: boolean
  type: 'following' | 'followers'
  userId: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'stats-changed': []
}>()

const router = useRouter()
const dialog = useDialog()
const message = useMessage()
const userStore = useUserStore()

const items = ref<FollowUserInfo[]>([])
const loading = ref(false)
const total = ref(0)

const title = computed(() => props.type === 'following' ? '我的关注' : '我的粉丝')

const loadList = async () => {
  if (!props.userId) return
  loading.value = true
  try {
    const fetcher = props.type === 'following'
      ? useFollowingList(props.userId, { page: 1, limit: 50 })
      : useFollowersList(props.userId, { page: 1, limit: 50 })
    const data = await fetcher.execute()
    items.value = data.items
    total.value = data.total
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => props.visible,
  (val) => { if (val) loadList() },
)

const handleClose = () => {
  emit('update:visible', false)
}

const goToProfile = (userId: string) => {
  handleClose()
  router.push({ name: 'userProfile', params: { userId } })
}

const handleUnfollow = (user: FollowUserInfo) => {
  dialog.warning({
    title: '取消关注',
    content: `确定取消关注 ${user.username} 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      const { unfollow } = useFollow(user._id)
      await unfollow()
      items.value = items.value.filter((i) => i._id !== user._id)
      total.value = Math.max(0, total.value - 1)
      emit('stats-changed')
      message.success('已取消关注')
    },
  })
}

const handleFollow = async (user: FollowUserInfo) => {
  const { follow } = useFollow(user._id)
  await follow()
  emit('stats-changed')
  message.success('已关注')
  await loadList()
}

const isCurrentUser = (userId: string) => userStore.user?._id === userId
</script>

<template>
  <NDrawer :show="visible" :width="360" placement="right" @update:show="handleClose">
    <NDrawerContent :title="title" closable>
      <div v-if="loading" class="text-sm text-gray-500 py-4 text-center">加载中…</div>
      <div v-else-if="!items.length" class="text-sm text-gray-500 py-8 text-center">
        {{ type === 'following' ? '还没有关注任何人' : '还没有粉丝' }}
      </div>
      <div v-else class="flex flex-col gap-3">
        <div
          v-for="user in items"
          :key="user._id"
          class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <NAvatar
            round
            :size="40"
            :src="user.avatar || 'https://github.com/shadcn.png'"
            class="cursor-pointer shrink-0 border border-black"
            @click="goToProfile(user._id)"
          />
          <div
            class="flex-1 min-w-0 cursor-pointer"
            @click="goToProfile(user._id)"
          >
            <div class="text-sm font-bold truncate">{{ user.username }}</div>
            <div class="text-xs text-gray-500 truncate">{{ user.bio || '这个人很懒' }}</div>
          </div>
          <NButton
            v-if="!isCurrentUser(user._id)"
            size="tiny"
            :type="type === 'following' ? 'default' : 'primary'"
            secondary
            round
            @click.stop="type === 'following' ? handleUnfollow(user) : handleFollow(user)"
          >
            {{ type === 'following' ? '已关注' : '关注' }}
          </NButton>
        </div>
      </div>
    </NDrawerContent>
  </NDrawer>
</template>
