<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NoticeBoard from './componets/NoticeBoard.vue'
import NewFilm from './componets/NewFilm.vue'
import FilmRank from './componets/FilmRank.vue'
import { useNoticeBoardRecommend } from './useNoticeBoardRecommend'
import { useAddFavorite } from '@/api/user'

const router = useRouter()
const { loading, recommendedMovie, reload } = useNoticeBoardRecommend()
const recommended = computed(() => recommendedMovie.value)

onMounted(() => {
  void reload()
})

const handleGotoDetail = () => {
  const title = recommendedMovie.value?.title
  if (!title) return
  router.push({
    name: 'filmDetail',
    params: { name: title },
  })
}

const handleToggleFavorite = async () => {
  const movieId = recommendedMovie.value?.movieId
  if (!movieId) return

  try {
    const { execute } = useAddFavorite(movieId)
    await execute()
  } catch {
    // 忽略收藏错误，保持首页体验流畅
  }
}
</script>

<template>
  <div class="h-full p-8 flex flex-col gap-8">
    <NoticeBoard
      :movie-title="recommended?.title"
      :score="recommended?.rating"
      :summary="recommended?.intro"
      :movie-id="recommended?.movieId"
      :loading="loading.value"
      :image="recommended?.poster"
      @goto-detail="handleGotoDetail"
      @toggle-favorite="handleToggleFavorite"
    />
    <NewFilm />
    <FilmRank />
  </div>
</template>
