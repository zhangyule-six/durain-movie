<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { NTabs, NTabPane, NRate, NAvatar, NButton, NInput, useMessage } from 'naive-ui'
import { useUserStore } from '@/stores/useUser'
import { useUpdateProfile, useMyReviews, useMyFavorites } from '@/api/user'
import type { MyReviewItem, MyFavoriteItem } from '@/api/user'

const userStore = useUserStore()
const router = useRouter()
const message = useMessage()

const user = computed(() => userStore.user)

// 我的评价
const {
  data: reviewsData,
  loading: reviewsLoading,
  error: reviewsError,
  execute: loadReviews,
} = useMyReviews({ page: 1, limit: 20 })

const myReviews = computed<MyReviewItem[]>(
  () => reviewsData.value?.items ?? [],
)

// 我的收藏
const {
  data: favoritesData,
  loading: favoritesLoading,
  error: favoritesError,
  execute: loadFavorites,
} = useMyFavorites()

const myFavorites = computed<MyFavoriteItem[]>(
  () => favoritesData.value?.items ?? [],
)

const fetchUserData = () => {
  if (user.value) {
    loadReviews().catch(() => {})
    loadFavorites().catch(() => {})
  }
}

onMounted(() => {
  fetchUserData()
})

watch(() => user.value?._id, (id) => {
  if (id) fetchUserData()
})

const formatTime = (str: string) => {
  if (!str) return '—'
  const d = new Date(str)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const gotoFilmDetail = (name: string) => {
  if (name) router.push({ name: 'filmDetail', params: { name } })
}
const editing = ref(false)
const formUsername = ref('')
const formBio = ref('')
const defaultAvatar = 'https://github.com/shadcn.png'
const avatarPreview = ref<string | null>(null)
const avatarDataUrl = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const displayAvatar = computed(() => {
  return avatarPreview.value || user.value?.avatar || defaultAvatar
})

const startEdit = () => {
  if (!user.value) {
    message.warning('请先登录')
    return
  }
  editing.value = true
  formUsername.value = user.value.username
  formBio.value = user.value.bio || ''
}

const cancelEdit = () => {
  editing.value = false
}

const saveEdit = () => {
  if (!user.value) return
  const username = formUsername.value.trim() || user.value.username
  const bio = formBio.value.trim()
  const payload: { username?: string; bio?: string; avatar?: string } = {}
  if (username !== user.value.username) payload.username = username
  if (bio !== (user.value.bio || '')) payload.bio = bio
  if (avatarDataUrl.value) payload.avatar = avatarDataUrl.value

  if (!payload.username && !payload.bio && !payload.avatar) {
    message.info('没有任何更改')
    editing.value = false
    return
  }

  const { execute } = useUpdateProfile(payload)
  execute()
    .then((updated) => {
      userStore.setUser(updated)
      editing.value = false
      avatarDataUrl.value = null
      message.success('已更新个人信息')
    })
    .catch((err: any) => {
      message.error(err?.message || '更新失败，请稍后重试')
    })
}

const triggerAvatarSelect = () => {
  fileInputRef.value?.click()
}

const handleAvatarChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    message.warning('请选择图片文件')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const result = reader.result
    if (typeof result === 'string') {
      avatarPreview.value = result
      avatarDataUrl.value = result
    }
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <div class="p-8">
    <div class="mb-6 flex items-center gap-6">
      <div class="flex flex-col items-center gap-2">
        <NAvatar
          round
          :size="72"
          class="border-2 border-black cursor-pointer"
          :src="displayAvatar"
          @click="editing && triggerAvatarSelect()"
        />
        <NButton
          v-if="editing"
          text
          size="tiny"
          class="text-xs underline"
          @click="triggerAvatarSelect"
        >
          更换头像
        </NButton>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleAvatarChange"
        />
      </div>

      <div class="flex-1 min-w-0">
        <template v-if="!editing">
          <div class="text-2xl font-extrabold truncate">
            {{ user?.username || '未登录用户' }}
          </div>
          <div class="text-sm text-gray-500 mt-1 truncate">
            {{ user?.bio || '查看我的评价与收藏' }}
          </div>
        </template>

        <div v-else class="flex flex-col gap-3 max-w-md">
          <NInput v-model:value="formUsername" placeholder="请输入昵称" />
          <NInput
            v-model:value="formBio"
            type="textarea"
            :rows="3"
            placeholder="一句话介绍一下自己吧～"
          />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <NButton v-if="!editing" strong secondary round size="small" @click="startEdit">
          编辑资料
        </NButton>
        <div v-else class="flex gap-2">
          <NButton type="primary" round size="small" @click="saveEdit">
            保存
          </NButton>
          <NButton round size="small" @click="cancelEdit">
            取消
          </NButton>
        </div>
      </div>
    </div>

    <NTabs type="segment" animated default-value="reviews">
      <NTabPane name="reviews" tab="我的评价">
        <div class="flex flex-col gap-4 mt-4">
          <div v-if="!user" class="text-sm text-gray-500">
            请先登录查看我的评价。
          </div>
          <div v-else-if="reviewsLoading" class="text-sm text-gray-500">
            加载中…
          </div>
          <div v-else-if="reviewsError" class="text-sm text-red-500">
            {{ reviewsError }}
          </div>
          <template v-else>
            <div
              v-for="item in myReviews"
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
                  readonly
                  :max="5"
                  :default-value="item.score / 2"
                  :size="18"
                />
                <span class="text-xs text-gray-600 font-semibold">
                  {{ (item.score / 2).toFixed(1) }} 分
                </span>
              </div>

              <div class="text-sm text-gray-800 leading-relaxed">
                {{ item.content }}
              </div>
            </div>

            <div v-if="!myReviews.length" class="text-sm text-gray-500">
              你还没有发表过评价。
            </div>
          </template>
        </div>
      </NTabPane>

      <NTabPane name="favorites" tab="我的收藏">
        <div class="flex flex-col gap-4 mt-4">
          <div v-if="!user" class="text-sm text-gray-500">
            请先登录查看我的收藏。
          </div>
          <div v-else-if="favoritesLoading" class="text-sm text-gray-500">
            加载中…
          </div>
          <div v-else-if="favoritesError" class="text-sm text-red-500">
            {{ favoritesError }}
          </div>
          <template v-else>
            <div
              v-for="item in myFavorites"
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

            <div v-if="!myFavorites.length" class="text-sm text-gray-500">
              你还没有收藏任何电影。
            </div>
          </template>
        </div>
      </NTabPane>
    </NTabs>
  </div>
</template>

