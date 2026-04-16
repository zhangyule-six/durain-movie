<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCheckAuth } from '@/api/auth'
import { useUserStore } from '@/stores/useUser'
import SideBar from './SideBar.vue'
import Navigator from './Navigator.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const showSidebar = computed(() => route.meta.showSidebar !== false)

onMounted(() => {
  useCheckAuth()
    .execute()
    .then((user) => {
      userStore.setUser(user)
      if (user.role === 'admin') {
        router.push('/admin/dashboard')
      }
    })
    .catch(() => userStore.setUser(null))
})
</script>

<template>
  <div class="min-h-screen bg-[#e8eaef]">
    <!-- 固定的顶部导航栏 -->
    <Navigator />
    
    <!-- 固定的侧边栏 -->
    <SideBar v-if="showSidebar" />
    
    <!-- 内容区域 -->
    <main
      :class="showSidebar ? 'ml-[260px] w-[calc(100%-260px)]' : 'w-full'" 
      class="min-h-[calc(100vh-4rem)] pt-16"
    >
      <slot />
    </main>
  </div>
</template>
