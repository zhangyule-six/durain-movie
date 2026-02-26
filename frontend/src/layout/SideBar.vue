<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Clapperboard,
  Home,
  Compass,
  CirclePlay,
  Users,
  Heart,
  Clock,
  Settings,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

interface MenuItem {
  name: string
  label: string
  icon: any
  iconColor?: string
}

const myWorldItems: MenuItem[] = [
  { name: 'home', label: '主页', icon: Home },
  { name: 'wander', label: '发现', icon: Compass },
  { name: 'collection', label: '个人收藏', icon: CirclePlay },
  { name: 'later', label: '稍后再看', icon: Clock },
]

const activeItem = computed(() => route.name as string || 'home')

function navigateTo(name: string) {
  router.push({ name })
}
</script>

<template>
  <aside class="fixed left-0 top-0 bottom-0 w-[260px] bg-[#ece9dc] flex flex-col py-6 px-5 z-50 border-r-[3px] border-[#0a0a0a]" 
  style="font-family: 'Rounded', sans-serif;">
    <!-- Logo -->
    <div
      class="flex items-center bg-white rounded-xl px-4 py-3 border-4 border-[#0a0a0a]"
      style="transform: rotate(-3deg); box-shadow: 4px 4px 0 0 rgba(10, 10, 10, 1);">
      <div class="w-10 h-10 bg-[#f06050] rounded-lg flex items-center justify-center">
        <Clapperboard class="w-5 h-5 text-white" />
      </div>
      <span
        class="text-xl text-[#0a0a0a] uppercase tracking-wider text-center" style="font-family: 'Rounded', sans-serif; font-weight: 800;" >
        Durian Movie
      </span>
    </div>

    <div class="pt-10">
      <nav class="flex flex-col gap-4">
        <div v-for="item in myWorldItems" :key="item.name"
          class="flex items-center gap-3 px-4 py-2.5 rounded-2xl" :class="activeItem === item.name
            ? 'bg-[#f07050] text-white border-2 border-[#0a0a0a]'
            : 'text-[#63686b] '
            " @click="navigateTo(item.name)"
          :style="{
            boxShadow: activeItem === item.name ? '4px 4px 0 0 rgba(10, 10, 10, 1)' : 'none'
          }">
          <component :is="item.icon" class="w-5 h-5"
            :class="activeItem === item.name ? 'text-black' : 'text-gray-500'" />
          <span class="text-[16px] font-bold " style="font-family: 'Rounded', sans-serif; font-weight: 600;">{{ item.label }}</span>
        </div>
      </nav>
    </div>


    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Gears Button (Bottom) -->
    <div class="flex items-center gap-3 px-4 py-3 bg-[#8ebbfd] rounded-2xl border-2 border-[#0a0a0a]"
      @click="navigateTo('settings')"
      style="box-shadow: 3px 3px 0 0 rgba(10, 10, 10, 1);">
      <Settings class="w-5 h-5" />
      <span class="text-sm font-semibold">设置</span>
    </div>
  </aside>
</template>
