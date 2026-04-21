<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import NoticeBoard from './componets/NoticeBoard.vue'
import NewFilm from './componets/NewFilm.vue'
import FilmRank from './componets/FIlmRank.vue'
import ComingFilm from './componets/ComingFilm.vue'
import { useNoticeBoardRecommend } from './useNoticeBoardRecommend'
import { useAddFavorite } from '@/api/user'
import { useUserStore } from '@/stores/useUser'

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()
const { loading, recommendedMovie, reload } = useNoticeBoardRecommend()

onMounted(() => {
  void reload()
})

const handleGotoDetail = () => {
  const title = recommendedMovie.value?.title
  if (!title) return
  router.push({ name: 'filmDetail', params: { name: title } })
}

const handleToggleFavorite = async () => {
  if (!userStore.requireLogin()) return
  const movieId = recommendedMovie.value?.movieId
  if (!movieId) return

  try {
    const { execute } = useAddFavorite(movieId)
    await execute()
    message.success('收藏成功')
  } catch {
    message.error('收藏失败，请稍后重试')
  }
}
</script>

<template>
  <div class="h-full p-8 flex flex-col gap-8">
    <NoticeBoard
      :movie-title="recommendedMovie?.title"
      :score="recommendedMovie?.rating"
      :summary="recommendedMovie?.intro"
      :movie-id="recommendedMovie?.movieId"
      :loading="loading"
      :image="recommendedMovie?.poster"
      @gotoDetail="handleGotoDetail"
      @toggleFavorite="handleToggleFavorite"
    />
    <NewFilm />
    <FilmRank />
    <ComingFilm />
  </div>
</template>
