<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NRate, NAvatar, NTag, NButton, useMessage } from 'naive-ui'
import {
  type FilmDetailFull,
  type Recommendation
} from './config'
import { useSearch } from '@/api/search'
import type { MovieItem } from '@/api/types'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const currentName = computed(() => String(route.params.name || ''))

const loading = ref(false)
const loadError = ref<string | null>(null)
const currentFilm = ref<FilmDetailFull | undefined>(undefined)

function buildFilmDetailFromWmdb(name: string, item: MovieItem): FilmDetailFull {
  const detail = Array.isArray(item?.data) ? item.data[0] : undefined
  const displayName = String(detail?.name || item.originalName || name)
  const poster = String(detail?.poster || '')
  const rating = Number(item.doubanRating || item.imdbRating || 0) || 0
  const ratingCount = Number(item.doubanVotes || item.imdbVotes || 0) || 0
  const year = Number.parseInt(String(item.year || ''), 10) || 0
  const durationMin = Number(item.duration || 0) || 0
  const duration = durationMin ? `${durationMin} 分钟` : '—'
  const region = String(detail?.country || '—')
  const genresRaw = String(detail?.genre || '').trim()
  const genres = genresRaw
    ? genresRaw.split('/').map((g) => g.trim()).filter(Boolean)
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
    cast: [],
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
  }
)

watch(
  () => currentName.value,
  () => {
    fetchFilm()
  },
  { immediate: true }
)

const handleAddToLibrary = () => {
  if (!currentFilm.value) return
  message.success(`已将《${currentFilm.value.base.displayName}》加入片单（示例）`)
}

const handleWriteReview = () => {
  message.info('评论功能开发中，敬请期待～')
}

const gotoRecommendation = (rec: Recommendation) => {
  router.push({ name: 'filmDetail', params: { name: rec.name } })
}

const gotoHome = () => {
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="p-8 flex flex-col gap-10">
    <div v-if="loading" class="flex flex-col items-center justify-center py-24">
      <div class="text-sm text-gray-500">正在加载影片信息…</div>
    </div>

    <div v-else-if="loadError" class="flex flex-col items-center justify-center py-24">
      <div class="text-sm text-red-600 mb-6">{{ loadError }}</div>
      <NButton type="primary" round size="large" @click="gotoHome">
        返回首页
      </NButton>
    </div>

    <div v-else-if="!currentFilm" class="flex flex-col items-center justify-center py-24">
      <div class="text-2xl font-extrabold mb-4">未找到该影片</div>
      <div class="text-sm text-gray-500 mb-6">
        路由参数：<span class="font-mono">{{ currentName }}</span>
      </div>
      <NButton type="primary" round size="large" @click="gotoHome">
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

          <h1 class="text-3xl md:text-4xl font-extrabold leading-tight">
            {{ currentFilm.base.displayName }}
          </h1>

          <div class="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span>{{ currentFilm.base.year }}</span>
            <span>·</span>
            <span>{{ currentFilm.base.region }}</span>
            <span>·</span>
            <span>{{ currentFilm.base.duration }}</span>
          </div>

          <div class="flex flex-wrap items-center gap-4">
            <div class="flex items-center gap-2">
              <NRate
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
              {{ currentFilm.base.ratingCount.toLocaleString() }} reviews
            </div>
          </div>

          <p class="text-sm md:text-base text-gray-800 leading-relaxed max-w-2xl">
            {{ currentFilm.base.summary }}
          </p>

          <div class="flex flex-wrap items-center gap-4 mt-2">
            <NButton
              type="primary"
              size="large"
              strong
              round
              class="bg-emerald-500 hover:bg-emerald-600 border-black border-2"
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
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 演职员表 -->
        <div
          class="border-2 border-black rounded-3xl bg-white/80 p-5 flex flex-col gap-4"
        >
          <div class="flex items-center justify-between">
            <div class="text-lg font-extrabold">演职员表</div>
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
              <div class="mt-2 text-xs font-bold text-center truncate w-full">
                {{ member.name }}
              </div>
              <div class="text-[11px] text-gray-500 text-center truncate w-full">
                {{ member.role }}
              </div>
            </div>
          </div>
          <div v-else class="text-xs text-gray-500">
            暂无演职员信息。
          </div>
        </div>

        <!-- 口碑短评 -->
        <div
          class="border-2 border-black rounded-3xl bg-white/80 p-5 flex flex-col gap-4"
        >
          <div class="flex items-center justify-between">
            <div class="text-lg font-extrabold">口碑热议</div>
            <NButton size="tiny" tertiary>查看全部</NButton>
          </div>

          <div
            v-if="currentFilm.buzz.length"
            class="flex flex-col gap-3"
          >
            <div
              v-for="item in currentFilm.buzz"
              :key="item.id"
              class="flex items-start gap-3"
            >
              <NAvatar
                :src="item.avatar"
                :size="40"
                round
                class="border border-black shrink-0"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="font-bold truncate max-w-[120px]">
                    {{ item.nickname }}
                  </span>
                  <span class="text-emerald-600 font-semibold">
                    {{ item.score.toFixed(1) }}
                  </span>
                </div>
                <div class="text-xs text-gray-700 leading-snug">
                  {{ item.quote }}
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-xs text-gray-500">
            暂无精选短评，快去写下你的第一条评价吧。
          </div>
        </div>
      </section>

      <!-- 底部：相关推荐 -->
      <section class="flex flex-col gap-4">
        <div
          class="self-start px-5 py-2 rounded-full border-2 border-black bg-pink-500 text-white text-sm font-extrabold"
        >
          YOU MIGHT DIG THESE...
        </div>

        <div
          class="flex gap-4 overflow-x-auto pb-2"
        >
          <div
            v-for="rec in currentFilm.recommendations"
            :key="rec.name"
            class="w-40 shrink-0 cursor-pointer border-2 border-black rounded-3xl overflow-hidden bg-white/80 hover:-translate-y-1 hover:shadow-xl transition-transform"
            @click="gotoRecommendation(rec)"
          >
            <img
              :src="rec.poster"
              :alt="rec.displayName"
              class="w-full h-44 object-cover"
            />
            <div class="p-3 flex flex-col gap-1">
              <div class="text-xs font-extrabold truncate">
                {{ rec.displayName }}
              </div>
              <div class="text-[11px] text-gray-500 truncate">
                {{ rec.subtitle }}
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

