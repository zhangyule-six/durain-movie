<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NSpin, NEmpty } from 'naive-ui'
import { Users, Film, MessageSquareText } from 'lucide-vue-next'
import { useAdminStats, type AdminStats } from '@/api/admin'

const loading = ref(true)
const stats = ref<AdminStats | null>(null)

onMounted(async () => {
  try {
    const { execute } = useAdminStats()
    stats.value = await execute()
  } catch {
    stats.value = null
  } finally {
    loading.value = false
  }
})

const cards = [
  { key: 'userCount', label: '用户总数', icon: Users, bg: 'bg-blue-50', iconBg: 'bg-[#8ebbfd]' },
  { key: 'movieCount', label: '电影总数', icon: Film, bg: 'bg-green-50', iconBg: 'bg-emerald-400' },
  { key: 'reviewCount', label: '评论总数', icon: MessageSquareText, bg: 'bg-orange-50', iconBg: 'bg-[#f07050]' },
] as const
</script>

<template>
  <div style="font-family: 'Rounded', sans-serif">
    <h1 class="text-2xl font-extrabold text-[#0a0a0a] mb-6">仪表盘</h1>

    <NSpin :show="loading">
      <div v-if="stats" class="space-y-8">
        <!-- Stat Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            v-for="card in cards"
            :key="card.key"
            class="rounded-2xl border-[3px] border-[#0a0a0a] px-5 py-5 flex items-center gap-4"
            :class="card.bg"
            style="box-shadow: 4px 4px 0 0 rgba(10, 10, 10, 1)"
          >
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              :class="card.iconBg"
            >
              <component :is="card.icon" class="w-6 h-6 text-white" />
            </div>
            <div>
              <div class="text-sm font-semibold text-gray-500">{{ card.label }}</div>
              <div class="text-3xl font-extrabold text-[#0a0a0a]">
                {{ stats[card.key]?.toLocaleString() ?? 0 }}
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Trends -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Recent Users -->
          <div
            class="rounded-2xl border-[3px] border-[#0a0a0a] bg-white px-5 py-5"
            style="box-shadow: 4px 4px 0 0 rgba(10, 10, 10, 1)"
          >
            <h3 class="text-lg font-bold text-[#0a0a0a] mb-4">近 7 天新增用户</h3>
            <div v-if="stats.recentUsers.length" class="space-y-2">
              <div
                v-for="item in stats.recentUsers"
                :key="item._id"
                class="flex items-center justify-between px-3 py-2 rounded-lg bg-blue-50"
              >
                <span class="text-sm text-gray-600">{{ item._id }}</span>
                <span
                  class="text-sm font-bold bg-[#8ebbfd] text-white px-2 py-0.5 rounded-full border border-[#0a0a0a]"
                >
                  +{{ item.count }}
                </span>
              </div>
            </div>
            <NEmpty v-else description="暂无数据" />
          </div>

          <!-- Recent Reviews -->
          <div
            class="rounded-2xl border-[3px] border-[#0a0a0a] bg-white px-5 py-5"
            style="box-shadow: 4px 4px 0 0 rgba(10, 10, 10, 1)"
          >
            <h3 class="text-lg font-bold text-[#0a0a0a] mb-4">近 7 天新增评论</h3>
            <div v-if="stats.recentReviews.length" class="space-y-2">
              <div
                v-for="item in stats.recentReviews"
                :key="item._id"
                class="flex items-center justify-between px-3 py-2 rounded-lg bg-orange-50"
              >
                <span class="text-sm text-gray-600">{{ item._id }}</span>
                <span
                  class="text-sm font-bold bg-[#f07050] text-white px-2 py-0.5 rounded-full border border-[#0a0a0a]"
                >
                  +{{ item.count }}
                </span>
              </div>
            </div>
            <NEmpty v-else description="暂无数据" />
          </div>
        </div>
      </div>

      <NEmpty v-else-if="!loading" description="加载统计数据失败" />
    </NSpin>
  </div>
</template>
