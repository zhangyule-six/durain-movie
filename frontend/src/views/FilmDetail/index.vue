<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NRate,
  NAvatar,
  NTag,
  NButton,
  useMessage,
} from 'naive-ui'
import type {
  FilmDetailFull,
  RecommendByGenresItem,
  CastMember,
} from '@/api/types'
import { useSearch } from '@/api/search'
import { useRequest } from '@/api/http'
import { useAddFavorite } from '@/api/user'
import type { MovieItem } from '@/api/types'
import { useRecommendByGenres } from '@/api/newfilm'
import { useUserStore } from '@/stores/useUser'
import RecommendationsSection from './components/RecommendationsSection.vue'
import FilmReviewSection from './components/FilmReviewSection.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const userStore = useUserStore()

const currentName = computed(() =>
  String(route.params.name || ''),
)

const loading = ref(false)
const loadError = ref<string | null>(null)
const currentFilm = ref<FilmDetailFull | undefined>(
  undefined,
)

const movieId = ref<string | null>(null)
const addingFavorite = ref(false)

const filmReviewSectionRef = ref<InstanceType<
  typeof FilmReviewSection
> | null>(null)

const PLACEHOLDER_ACTOR_AVATAR =
  'https://github.com/shadcn.png'

function buildCastFromMovie(item: MovieItem): CastMember[] {
  const wrappers = Array.isArray(item.actor)
    ? item.actor
    : []
  const persons = wrappers.flatMap((w) =>
    Array.isArray(w?.data) ? w.data : [],
  )
  const topFive = persons.slice(0, 5)
  return topFive.map((p, index) => ({
    id: index,
    name: p.name || '未知演员',
    role: '演员',
    avatar: PLACEHOLDER_ACTOR_AVATAR,
  }))
}

function buildFilmDetailFromWmdb(
  name: string,
  item: MovieItem,
): FilmDetailFull {
  const detail = Array.isArray(item?.data)
    ? item.data[0]
    : undefined
  const displayName = String(
    detail?.name || item.originalName || name,
  )
  const poster = String(detail?.poster || '')
  const rating =
    Number(item.doubanRating || item.imdbRating || 0) || 0
  const ratingCount =
    Number(item.doubanVotes || item.imdbVotes || 0) || 0
  const year =
    Number.parseInt(String(item.year || ''), 10) || 0
  const durationMin = Number(item.duration || 0) || 0
  const duration = durationMin
    ? `${durationMin / 60} 分钟`
    : '—'
  const region = String(detail?.country || '—')
  const genresRaw = String(detail?.genre || '').trim()
  const genres = genresRaw
    ? genresRaw
        .split('/')
        .map((g) => g.trim())
        .filter(Boolean)
    : []
  const summary = String(detail?.description || '暂无简介')

  return {
    base: {
      name,
      displayName,
      poster,
      rating,
      ratingCount,
      year,
      duration,
      region,
      genres,
      summary,
    },
    cast: buildCastFromMovie(item),
    buzz: [],
    recommendations: [],
  }
}

async function fetchFilm() {
  const name = currentName.value.trim()
  if (!name) {
    currentFilm.value = undefined
    return
  }

  loading.value = true
  loadError.value = null
  currentFilm.value = undefined

  try {
    const req = useSearch({ q: name, limit: 1, lang: 'Cn' })
    const res = await req.execute()
    const first = res?.data?.[0]
    if (!first) {
      currentFilm.value = undefined
      return
    }
    currentFilm.value = buildFilmDetailFromWmdb(name, first)

    // 确保后端有对应 Movie 记录
    try {
      const base = currentFilm.value.base
      const { execute } = useRequest<{ _id: string }>({
        url: '/api/movie/ensure',
        method: 'POST',
        body: {
          title: base.displayName,
          year: base.year,
          poster: base.poster,
          summary: base.summary,
          genres: base.genres,
        },
      })
      const ensured = await execute()
      movieId.value = ensured._id
      await loadRecommendations()
    } catch (e: any) {
      console.error('ensure movie failed', e)
    }
  } catch (e: any) {
    loadError.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.name,
  () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    fetchFilm()
  },
)

watch(
  () => currentName.value,
  () => {
    fetchFilm()
  },
  { immediate: true },
)

const handleAddToLibrary = async () => {
  if (!userStore.requireLogin()) return
  if (!movieId.value) {
    message.warning('电影信息尚未加载完成，请稍后重试')
    return
  }
  if (addingFavorite.value) return

  addingFavorite.value = true
  try {
    const { execute } = useAddFavorite(movieId.value)
    const res = await execute()
    const msg = (res as any)?.message
    if (msg === '已在收藏中') {
      message.info('该影片已在你的收藏中')
    } else {
      message.success('已加入收藏')
    }
  } catch (e: any) {
    message.error(
      e?.message || '加入收藏失败，请确认已登录',
    )
  } finally {
    addingFavorite.value = false
  }
}

const loadRecommendations = async () => {
  if (
    !movieId.value ||
    !currentFilm.value?.base.genres.length
  )
    return
  try {
    const { execute } = useRecommendByGenres(
      movieId.value,
      currentFilm.value.base.genres,
    )
    const res = await execute()
    if (currentFilm.value) {
      currentFilm.value.recommendations = res || []
    }
  } catch (e) {
    // 推荐失败不影响主流程
    console.error('load recommendations failed', e)
  }
}

const handleWriteReview = () => {
  filmReviewSectionRef.value?.focusComposer()
}

const gotoRecommendation = (rec: RecommendByGenresItem) => {
  router.push({
    name: 'filmDetail',
    params: { name: rec.title },
  })
}

const gotoHome = () => {
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="p-8 flex flex-col gap-10">
    <div
      v-if="loading"
      class="flex flex-col items-center justify-center py-24"
    >
      <div class="text-sm text-gray-500">
        正在加载影片信息…
      </div>
    </div>

    <div
      v-else-if="loadError"
      class="flex flex-col items-center justify-center py-24"
    >
      <div class="text-sm text-red-600 mb-6">
        {{ loadError }}
      </div>
      <NButton
        type="primary"
        round
        size="large"
        @click="gotoHome"
      >
        返回首页
      </NButton>
    </div>

    <div
      v-else-if="!currentFilm"
      class="flex flex-col items-center justify-center py-24"
    >
      <div class="text-2xl font-extrabold mb-4">
        未找到该影片
      </div>
      <div class="text-sm text-gray-500 mb-6">
        路由参数：<span class="font-mono">{{
          currentName
        }}</span>
      </div>
      <NButton
        type="primary"
        round
        size="large"
        @click="gotoHome"
      >
        返回首页
      </NButton>
    </div>

    <template v-else>
      <!-- 顶部 Hero 区 -->
      <section
        class="flex flex-col lg:flex-row gap-8 items-start"
      >
        <!-- 左侧海报卡片 -->
        <div
          class="w-full max-w-xs lg:w-[260px] shrink-0 mx-auto lg:mx-0"
        >
          <div
            class="relative border-[6px] border-black rounded-3xl overflow-hidden shadow-xl bg-white -rotate-2"
          >
            <img
              :src="currentFilm.base.poster"
              :alt="currentFilm.base.displayName"
              class="w-full h-[360px] object-cover"
            />
            <div
              class="absolute right-4 top-4 w-14 h-14 rounded-full bg-yellow-300 border-4 border-black flex flex-col items-center justify-center text-xs font-extrabold shadow-md"
            >
              <span class="text-base">
                {{ currentFilm.base.rating.toFixed(1) }}
              </span>
              <span>score</span>
            </div>
          </div>
        </div>

        <!-- 右侧主信息 -->
        <div class="flex-1 flex flex-col gap-4 min-w-0">
          <div class="flex flex-wrap gap-2">
            <NTag
              v-for="tag in currentFilm.base.genres"
              :key="tag"
              size="small"
              type="info"
              round
            >
              {{ tag }}
            </NTag>
          </div>

          <h1
            class="text-3xl md:text-4xl font-extrabold leading-tight"
          >
            {{ currentFilm.base.displayName }}
          </h1>

          <div
            class="flex flex-wrap items-center gap-3 text-sm text-gray-600"
          >
            <span>{{ currentFilm.base.year }}</span>
            <span>·</span>
            <span>{{ currentFilm.base.region }}</span>
            <span>·</span>
            <span>{{ currentFilm.base.duration }}</span>
          </div>

          <div class="flex flex-wrap items-center gap-4">
            <div class="flex items-center gap-2">
              <NRate
                allow-half
                readonly
                :max="5"
                :default-value="currentFilm.base.rating / 2"
                :size="24"
              />
              <span class="text-lg font-bold">
                {{ currentFilm.base.rating.toFixed(1) }}
              </span>
            </div>
            <div
              class="px-3 py-1 rounded-full border-2 border-black bg-white/80 text-xs font-semibold"
            >
              {{
                currentFilm.base.ratingCount.toLocaleString()
              }}
              reviews
            </div>
          </div>

          <p
            class="text-sm md:text-base text-gray-800 leading-relaxed max-w-2xl"
          >
            {{ currentFilm.base.summary }}
          </p>

          <div
            class="flex flex-wrap items-center gap-4 mt-2"
          >
            <NButton
              type="primary"
              size="large"
              strong
              round
              class="bg-emerald-500 hover:bg-emerald-600 border-black border-2"
              :loading="addingFavorite"
              :disabled="!movieId || addingFavorite"
              @click="handleAddToLibrary"
            >
              加入收藏
            </NButton>
            <NButton
              size="large"
              strong
              round
              class="bg-orange-500 hover:bg-orange-600 text-white border-black border-2"
              @click="handleWriteReview"
            >
              评论
            </NButton>
          </div>
        </div>
      </section>

      <!-- 中间：演职员 + 口碑 -->
      <section
        class="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <!-- 演职员表 -->
        <div
          class="border-2 border-black rounded-3xl bg-white/80 p-5 flex flex-col gap-4"
        >
          <div class="flex items-center justify-between">
            <div class="text-lg font-extrabold">
              演职员表
            </div>
            <div class="text-xs text-gray-500">
              共 {{ currentFilm.cast.length }} 人
            </div>
          </div>

          <div
            v-if="currentFilm.cast.length"
            class="flex gap-4 overflow-x-auto pb-1"
          >
            <div
              v-for="member in currentFilm.cast"
              :key="member.id"
              class="flex flex-col items-center min-w-[90px]"
            >
              <NAvatar
                :src="member.avatar"
                :size="64"
                round
                class="border-2 border-black"
              />
              <div
                class="mt-2 text-xs font-bold text-center truncate w-full"
              >
                {{ member.name }}
              </div>
              <div
                class="text-[11px] text-gray-500 text-center truncate w-full"
              >
                {{ member.role }}
              </div>
            </div>
          </div>
          <div v-else class="text-xs text-gray-500">
            暂无演职员信息。
          </div>
        </div>
      </section>

      <FilmReviewSection
        ref="filmReviewSectionRef"
        :movie-id="movieId"
      />
      <!-- 底部：相关推荐 -->
      <RecommendationsSection
        v-if="currentFilm"
        :items="currentFilm.recommendations"
        @select="gotoRecommendation"
      />
    </template>
  </div>
</template>
