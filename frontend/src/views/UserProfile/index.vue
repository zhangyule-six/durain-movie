<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NTabs, NTabPane, NRate, NAvatar } from 'naive-ui'
import {
  useUserProfile,
  useUserReviews,
  useUserFavorites,
  type MyReviewItem,
  type MyFavoriteItem,
  type UserProfileInfo,
} from '@/api/user'
import { useUserGroups, type GroupItem } from '@/api/community'

const route = useRoute()
const router = useRouter()
const defaultAvatar = 'https://github.com/shadcn.png'

const userId = computed(() => String(route.params.userId || '').trim())

const profile = ref<UserProfileInfo | null>(null)
const reviews = ref<MyReviewItem[]>([])
const favorites = ref<MyFavoriteItem[]>([])
const groups = ref<GroupItem[]>([])

const profileLoading = ref(false)
const reviewsLoading = ref(false)
const favoritesLoading = ref(false)
const groupsLoading = ref(false)

const profileError = ref<string | null>(null)
const reviewsError = ref<string | null>(null)
const favoritesError = ref<string | null>(null)
const groupsError = ref<string | null>(null)

const displayAvatar = computed(() => profile.value?.avatar || defaultAvatar)

const formatTime = (str: string) => {
  if (!str) return '—'
  const d = new Date(str)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const gotoFilmDetail = (name: string) => {
  if (name) router.push({ name: 'filmDetail', params: { name } })
}

const gotoCommunityChat = (groupId: string) => {
  if (!groupId) return
  router.push({ name: 'communityChat', params: { groupId } })
}

const loadProfile = async (id: string) => {
  profileLoading.value = true
  profileError.value = null
  try {
    const { execute } = useUserProfile(id)
    profile.value = await execute()
  } catch (err: any) {
    profileError.value = err?.message || '加载用户信息失败'
    profile.value = null
  } finally {
    profileLoading.value = false
  }
}

const loadReviews = async (id: string) => {
  reviewsLoading.value = true
  reviewsError.value = null
  try {
    const { execute } = useUserReviews(id, { page: 1, limit: 20 })
    const data = await execute()
    reviews.value = data?.items ?? []
  } catch (err: any) {
    reviewsError.value = err?.message || '加载评价失败'
    reviews.value = []
  } finally {
    reviewsLoading.value = false
  }
}

const loadFavorites = async (id: string) => {
  favoritesLoading.value = true
  favoritesError.value = null
  try {
    const { execute } = useUserFavorites(id)
    const data = await execute()
    favorites.value = data?.items ?? []
  } catch (err: any) {
    favoritesError.value = err?.message || '加载收藏失败'
    favorites.value = []
  } finally {
    favoritesLoading.value = false
  }
}

const loadGroups = async (id: string) => {
  groupsLoading.value = true
  groupsError.value = null
  try {
    const { execute } = useUserGroups(id)
    const data = await execute()
    groups.value = data?.items ?? []
  } catch (err: any) {
    groupsError.value = err?.message || '加载小组失败'
    groups.value = []
  } finally {
    groupsLoading.value = false
  }
}

const loadAllData = (id: string) => {
  if (!id) return
  void loadProfile(id)
  void loadReviews(id)
  void loadFavorites(id)
  void loadGroups(id)
}

onMounted(() => {
  loadAllData(userId.value)
})

watch(userId, (id) => {
  loadAllData(id)
})
</script>

<template>
  <div class="box-border min-h-[calc(100vh-4rem)] p-8">
    <div class="mb-6 flex items-center gap-6">
      <div class="flex flex-col items-center gap-2">
        <NAvatar
          round
          :size="72"
          class="border-2 border-black"
          :src="displayAvatar"
        />
      </div>

      <div class="flex-1 min-w-0">
        <div v-if="profileLoading" class="text-sm text-gray-500">用户信息加载中…</div>
        <div v-else-if="profileError" class="text-sm text-red-500">{{ profileError }}</div>
        <template v-else>
          <div class="text-2xl font-extrabold truncate">
            {{ profile?.username || '未知用户' }}
          </div>
          <div class="text-sm text-gray-500 mt-1 truncate">
            {{ profile?.bio || '这个用户还没有填写简介。' }}
          </div>
        </template>
      </div>
    </div>

    <NTabs type="segment" animated default-value="reviews">
      <NTabPane name="reviews" tab="评价">
        <div class="flex flex-col gap-4 mt-4">
          <div v-if="reviewsLoading" class="text-sm text-gray-500">加载中…</div>
          <div v-else-if="reviewsError" class="text-sm text-red-500">{{ reviewsError }}</div>
          <template v-else>
            <div
              v-for="item in reviews"
              :key="item._id"
              class="border-2 border-black rounded-xl p-4 bg-white/80 cursor-pointer hover:bg-gray-50 transition-colors"
              @click="gotoFilmDetail(item.movieName)"
            >
              <div class="flex items-center justify-between mb-2 gap-3">
                <div class="text-base font-bold truncate">
                  {{ item.movieName }}
                </div>
                <div class="text-xs text-gray-500 shrink-0">
                  {{ formatTime(item.createdAt) }}
                </div>
              </div>

              <div class="flex items-center gap-2 mb-2">
                <NRate
                  allow-half
                  readonly
                  :max="5"
                  :default-value="item.score / 2"
                  :size="18"
                />
                <span class="text-xs text-gray-600 font-semibold">
                  {{ (item.score).toFixed(1) }} 分
                </span>
              </div>

              <div class="text-sm text-gray-800 leading-relaxed">
                {{ item.content }}
              </div>
            </div>

            <div v-if="!reviews.length" class="text-sm text-gray-500">
              暂无评价内容。
            </div>
          </template>
        </div>
      </NTabPane>

      <NTabPane name="favorites" tab="收藏">
        <div class="flex flex-col gap-4 mt-4">
          <div v-if="favoritesLoading" class="text-sm text-gray-500">加载中…</div>
          <div v-else-if="favoritesError" class="text-sm text-red-500">{{ favoritesError }}</div>
          <template v-else>
            <div
              v-for="item in favorites"
              :key="item._id"
              class="flex items-center gap-4 border-2 border-black rounded-xl p-4 bg-white/80 cursor-pointer hover:bg-gray-50 transition-colors"
              @click="gotoFilmDetail(item.movieName)"
            >
              <img
                :src="item.poster || 'https://via.placeholder.com/80x120?text=暂无'"
                alt="poster"
                class="w-16 h-24 object-cover rounded-md border border-black shrink-0"
              />
              <div class="flex-1 min-w-0">
                <div class="text-base font-bold truncate">
                  {{ item.movieName }}
                </div>
                <div class="text-xs text-gray-500 mt-1">{{ item.info }}</div>
              </div>
            </div>

            <div v-if="!favorites.length" class="text-sm text-gray-500">
              暂无收藏内容。
            </div>
          </template>
        </div>
      </NTabPane>

      <NTabPane name="groups" tab="已加入小组">
        <div class="flex flex-col gap-4 mt-4">
          <div v-if="groupsLoading" class="text-sm text-gray-500">加载中…</div>
          <div v-else-if="groupsError" class="text-sm text-red-500">{{ groupsError }}</div>
          <template v-else>
            <div
              v-for="group in groups"
              :key="group._id"
              class="border-2 border-black rounded-xl p-4 bg-white/80 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-start justify-between gap-3 mb-2">
                <div class="min-w-0">
                  <div class="text-base font-bold truncate">{{ group.name }}</div>
                  <div class="text-sm text-gray-600 mt-1 line-clamp-2">
                    {{ group.description || '这个小组暂时没有简介。' }}
                  </div>
                </div>
                <div class="text-xs text-gray-500 shrink-0">
                  {{ group.memberCount }}/99
                </div>
              </div>

              <div class="flex flex-wrap gap-2 mb-3">
                <span
                  v-for="tag in group.tags || []"
                  :key="tag"
                  class="rounded-full bg-[#eef2ff] px-2 py-1 text-xs text-[#4338ca]"
                >
                  {{ tag }}
                </span>
              </div>

              <div class="flex justify-end">
                <button
                  class="text-sm underline text-[#4f46e5]"
                  @click="gotoCommunityChat(group._id)"
                >
                  进入聊天
                </button>
              </div>
            </div>

            <div v-if="!groups.length" class="text-sm text-gray-500">
              暂无已加入小组。
            </div>
          </template>
        </div>
      </NTabPane>
    </NTabs>
  </div>
</template>
