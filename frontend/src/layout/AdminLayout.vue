<script setup lang="ts">
import { computed, onMounted, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Clapperboard,
  LayoutDashboard,
  Users,
  Film,
  MessageSquareText,
  LogOut,
} from 'lucide-vue-next'
import { useUserStore } from '@/stores/useUser'
import { useCheckAuth } from '@/api/auth'
import { useLogout } from '@/api/auth'
import { removeAccount, getAccounts, setActiveAccount } from '@/lib/accountStorage'
import Navigator from './Navigator.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

onMounted(() => {
  if (!userStore.user) {
    useCheckAuth()
      .execute()
      .then((user) => {
        userStore.setUser(user)
        if (user.role !== 'admin') {
          router.push('/')
        }
      })
      .catch(() => {
        userStore.setUser(null)
        router.push('/')
      })
  }
})

interface MenuItem {
  key: string
  label: string
  icon: Component
  route: string
}

const menuItems: MenuItem[] = [
  { key: 'adminDashboard', label: '仪表盘', icon: LayoutDashboard, route: '/admin/dashboard' },
  { key: 'adminUsers', label: '用户管理', icon: Users, route: '/admin/users' },
  { key: 'adminMovies', label: '电影管理', icon: Film, route: '/admin/movies' },
  { key: 'adminReviews', label: '评论管理', icon: MessageSquareText, route: '/admin/reviews' },
]

const activeKey = computed(() => route.name as string || 'adminDashboard')

function navigateTo(item: MenuItem) {
  router.push(item.route)
}

async function handleLogout() {
  const { execute } = useLogout()
  try {
    await execute()
    if (userStore.user?._id) {
      removeAccount(userStore.user._id)
    }
    const remaining = getAccounts()
    setActiveAccount(remaining[0]?.token ?? null)
    userStore.setUser(null)
    router.push('/')
  } catch {
    userStore.setUser(null)
    router.push('/')
  }
}
</script>

<template>
  <div class="min-h-screen flex bg-[#e8eaef]">
    <!-- Sidebar -->
    <aside
      class="fixed left-0 top-0 bottom-0 w-[220px] bg-[#f5f3eb] flex flex-col py-6 px-4 z-50 border-r-[3px] border-[#0a0a0a]"
      style="font-family: 'Rounded', sans-serif"
    >
      <!-- Logo -->
      <div
        class="flex items-center bg-white rounded-xl px-3 py-2.5 border-[3px] border-[#0a0a0a]"
        style="transform: rotate(-2deg); box-shadow: 4px 4px 0 0 rgba(10, 10, 10, 1)"
      >
        <div class="w-8 h-8 bg-[#8ebbfd] rounded-lg flex items-center justify-center shrink-0">
          <Clapperboard class="w-4 h-4 text-white" />
        </div>
        <span
          class="ml-2 text-sm text-[#0a0a0a] uppercase tracking-wider font-extrabold"
          style="font-family: 'Rounded', sans-serif"
        >
          Durian Admin
        </span>
      </div>

      <!-- Nav -->
      <nav class="flex flex-col gap-2 pt-8">
        <div
          v-for="item in menuItems"
          :key="item.key"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150"
          :class="
            activeKey === item.key
              ? 'bg-[#f07050] text-white border-2 border-[#0a0a0a]'
              : 'text-[#63686b] hover:bg-[#ece9dc]'
          "
          :style="{
            boxShadow: activeKey === item.key ? '3px 3px 0 0 rgba(10,10,10,1)' : 'none',
          }"
          @click="navigateTo(item)"
        >
          <component
            :is="item.icon"
            class="w-5 h-5"
            :class="activeKey === item.key ? 'text-black' : 'text-gray-500'"
          />
          <span class="text-[14px] font-bold" style="font-family: 'Rounded', sans-serif">
            {{ item.label }}
          </span>
        </div>
      </nav>

      <div class="flex-1" />

      <!-- Logout -->
      <div
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-[#63686b] hover:bg-red-50 hover:text-red-500 transition-colors"
        @click="handleLogout"
      >
        <LogOut class="w-5 h-5" />
        <span class="text-[14px] font-bold" style="font-family: 'Rounded', sans-serif">
          退出登录
        </span>
      </div>
    </aside>

    <!-- Main Area -->
    <div class="ml-[220px] flex-1 flex flex-col min-h-screen">
      <!-- 复用 Navigator（自动隐藏搜索和通知） -->
      <Navigator />

      <!-- Content -->
      <main class="flex-1 p-6  overflow-hidden">
        <router-view />
      </main>
    </div>
  </div>
</template>
