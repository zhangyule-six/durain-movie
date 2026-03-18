<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, Bell } from 'lucide-vue-next'
import { NAvatar } from 'naive-ui'
import Login from '../components/common/login.vue'
import NotificationDrawer from './NotificationDrawer.vue'
import {
  type NotificationItem,
  mapApiToNotificationItem,
  useListNotifications,
  useMarkNotificationRead,
  useMarkNotificationUnread,
} from '@/api/notifications'
import { useUserStore } from '@/stores/useUser'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const searchQuery = ref('')
const drawerVisible = ref(false)
const notificationItems = ref<NotificationItem[]>([])
const notificationCount = computed(
  () => notificationItems.value.filter((i) => !i.isRead).length
)
const showSidebar = computed(() => route.meta.showSidebar !== false)

const showLogin = ref(false)
const isLogin = computed(() => !!userStore.user)
const userName = computed(() => userStore.user?.username ?? 'Guest')
const avatarUrl = computed(() => userStore.user?.avatar ?? 'https://github.com/shadcn.png')

const { execute: loadNotifications } = useListNotifications(false)

const fetchNotifications = () => {
  if (!userStore.user) {
    notificationItems.value = []
    return
  }
  loadNotifications()
    .then((list) => {
      notificationItems.value = (list ?? []).map(mapApiToNotificationItem)
    })
    .catch(() => {
      notificationItems.value = []
    })
}

const handleOnline = () => {
  if (userStore.user) fetchNotifications()
}

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible' && userStore.user) fetchNotifications()
}

onMounted(() => {
  fetchNotifications()
  window.addEventListener('online', handleOnline)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

watch(
  () => userStore.user?._id,
  (id) => {
    if (id) fetchNotifications()
    else notificationItems.value = []
  }
)

watch(drawerVisible, (open) => {
  if (open && userStore.user) fetchNotifications()
})

const handleSearch = () => {
  const q = searchQuery.value.trim()
  if (!q) return
  router.push({ name: 'searchResult', query: { keyword: q } })
}

const toggleDrawer = () => {
  drawerVisible.value = !drawerVisible.value
}

const markRead = (id: string) => {
  const { execute } = useMarkNotificationRead(id)
  execute()
    .then(() => {
      const item = notificationItems.value.find((i) => i.id === id)
      if (item) item.isRead = true
    })
    .catch(() => {})
}

const markUnread = (id: string) => {
  const { execute } = useMarkNotificationUnread(id)
  execute()
    .then(() => {
      const item = notificationItems.value.find((i) => i.id === id)
      if (item) item.isRead = false
    })
    .catch(() => {})
}

const openLogin = () => {
  showLogin.value = true
}

const handleLoginSuccess = (payload: { userName: string; avatarUrl?: string } | null) => {
  if (!payload) {
    showLogin.value = false
    return
  }
  showLogin.value = false
  fetchNotifications()
}
</script>

<template>
  <nav
    class="fixed top-0 right-0 left-0 h-16 bg-[#e8eaef] border-b-[3px] border-[#0a0a0a] z-40 flex items-center px-6"
    :class="showSidebar ? 'left-[260px]' : 'left-0'"
  >
    <!-- 搜索栏 -->
    <div class="flex-1 flex ">
      <div class="relative flex items-center bg-white rounded-xl border-2 border-[#0a0a0a] px-4 py-2.5">
        <Search class="w-5 h-5 text-gray-500 mr-3 shrink-0" />
        <input
          v-model="searchQuery"
          @keyup.enter="handleSearch"
          type="text"
          placeholder="Find something cool to watch..."
          class="flex-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent"
        />
      </div>
    </div>

    <!-- 通知图标 -->
    <div class="pr-6 relative">
      <button
        class="relative w-12 h-12 bg-yellow-400 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center hover:bg-yellow-500 transition-colors"
        style="box-shadow: 3px 3px 0 0 rgba(10, 10, 10, 1);"
        @click="toggleDrawer"
      >
        <Bell class="w-6 h-6 text-black" />
        <!-- 通知徽章 -->
        <span
          v-if="notificationCount > 0"
          class="absolute -top-1 -right-1 w-5 h-5 bg-[#f06050] rounded-full border-2 border-[#0a0a0a] flex items-center justify-center text-xs font-bold text-white"
        >
          {{ notificationCount > 99 ? '99+' : notificationCount }}
        </span>
      </button>
    </div>

    <NotificationDrawer
      v-model:show="drawerVisible"
      :items="notificationItems"
      @mark-read="markRead"
      @mark-unread="markUnread"
    />


    <div
      class="rounded-4xl border-3 border-[#0a0a0a] px-2 py-1 bg-white ml-4 flex items-center gap-2 cursor-pointer"
      @click="openLogin"
    >
      <NAvatar
        round
        bordered
        :src="avatarUrl"
        size="large"
        style="border-color: black; border-width: 3px;"
      />
      <div style="font-family: 'Rounded', sans-serif; font-size: 16px; font-weight: bold;">
        {{ isLogin ? `Hello ${userName}!` : 'Login' }}
      </div>
    </div>

    <Login
      :visible="showLogin"
      mode="login"
      @update:visible="(v) => (showLogin = v)"
      @login-success="handleLoginSuccess"
    />
  </nav>
</template>
