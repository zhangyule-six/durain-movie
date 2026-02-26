<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Search, Bell } from 'lucide-vue-next'
import { NAvatar } from 'naive-ui'
import Login from '../components/common/login.vue'

const route = useRoute()
const searchQuery = ref('')
const notificationCount = ref() // 示例：3条未读通知
const showSidebar = computed(() => route.meta.showSidebar !== false)

const showLogin = ref(false)
const isLogin = ref(false)
const userName = ref('Guest')
const avatarUrl = ref('https://github.com/shadcn.png')

const openLogin = () => {
  showLogin.value = true
}

const handleLoginSuccess = (payload: { userName: string; avatarUrl?: string }) => {
  if (payload.userName) {
      userName.value = payload.userName
      isLogin.value = true
  }
  if (payload.avatarUrl) {
    avatarUrl.value = payload.avatarUrl
  }
  showLogin.value = false
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

    <Login v-model:visible="showLogin" @login-success="handleLoginSuccess" />
  </nav>
</template>
