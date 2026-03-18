import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/useUser'
import { useMyFavorites, useMyReviews } from '@/api/user'
import { useTopRatedMovies as useServerTopRatedMovies } from '@/api/newfilm'

interface NoticeMovieCandidate {
  movieId: string
  title: string
  poster: string
  genres: string[]
  rating?: number
  intro?: string
  summary?: string
}

export function useNoticeBoardRecommend(
  limitTopRated = 50,
) {
  const userStore = useUserStore()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const recommendedMovie = ref<NoticeMovieCandidate | null>(
    null,
  )
  const favoriteIds = ref<string[]>([])

  const { data: favoritesData, execute: executeFavorites } =
    useMyFavorites()
  const { data: reviewsData, execute: executeReviews } =
    useMyReviews({
      page: 1,
      limit: 50,
    })
  const { data: topRatedData, execute: executeTopRated } =
    useServerTopRatedMovies(limitTopRated)

  const isFavorite = computed(() => {
    const movieId = recommendedMovie.value?.movieId
    if (!movieId) return false
    return favoriteIds.value.includes(movieId)
  })

  const buildTagScoreMap = () => {
    const map = new Map<string, number>()

    const favorites = favoritesData.value?.items ?? []
    const reviews = reviewsData.value?.items ?? []

    for (const fav of favorites) {
      if (!fav.genres?.length) continue
      for (const raw of fav.genres) {
        const g = raw?.trim().toLowerCase()
        if (!g) continue
        map.set(g, (map.get(g) ?? 0) + 2)
      }
    }

    for (const review of reviews) {
      if (!review.genres?.length) continue
      for (const raw of review.genres) {
        const g = raw?.trim().toLowerCase()
        if (!g) continue
        map.set(g, (map.get(g) ?? 0) + 1)
      }
    }

    return map
  }

  const buildCandidates = (): NoticeMovieCandidate[] => {
    const candidatesMap = new Map<
      string,
      NoticeMovieCandidate
    >()

    const favorites = favoritesData.value?.items ?? []
    const reviews = reviewsData.value?.items ?? []
    const topRated = topRatedData.value ?? []

    for (const fav of favorites) {
      const id = fav.movieId
      if (!id) continue

      const existing = candidatesMap.get(id)
      const genres = fav.genres ?? existing?.genres ?? []
      // 收藏接口中的 info 字段可作为一段简短的电影介绍
      const intro = existing?.intro ?? fav.info

      candidatesMap.set(id, {
        movieId: id,
        title: fav.movieName,
        poster: fav.poster,
        genres,
        rating: existing?.rating,
        intro,
        summary: existing?.summary,
      })
    }

    for (const review of reviews) {
      const id = review.movieId
      if (!id) continue

      const existing = candidatesMap.get(id)
      const genres = review.genres ?? existing?.genres ?? []
      // 影评暂时没有独立简介字段，可从已有 intro 或影评内容截取一小段作为简介
      const intro =
        existing?.intro ??
        (review.content ? review.content.slice(0, 60) : undefined)

      candidatesMap.set(id, {
        movieId: id,
        title: review.movieName,
        poster: review.poster ?? existing?.poster ?? '',
        genres,
        rating: existing?.rating,
        intro,
        summary: existing?.summary,
      })
    }

    for (const movie of topRated) {
      const id = movie.id
      if (!id) continue

      const existing = candidatesMap.get(id)
      candidatesMap.set(id, {
        movieId: id,
        title: movie.title,
        poster: movie.poster,
        genres: existing?.genres ?? [],
        rating: movie.rating,
        // 来自本地 Movie.summary，通过后端 topRatedMovies 暴露为 description
        intro: movie.description ?? existing?.intro,
        summary: existing?.summary,
      })
    }

    return Array.from(candidatesMap.values())
  }

  const pickByPreference = () => {
    const tagScoreMap = buildTagScoreMap()

    const hasTagPreference = tagScoreMap.size > 0
    const candidates = buildCandidates()

    const scored = candidates
      .map((movie) => {
        let tagScoreSum = 0
        for (const raw of movie.genres ?? []) {
          const g = raw?.trim().toLowerCase()
          if (!g) continue
          tagScoreSum += tagScoreMap.get(g) ?? 0
        }

        const rating = movie.rating ?? 0
        const alpha = 1
        const beta = 0.5
        const score = tagScoreSum * alpha + rating * beta

        return { movie, score }
      })
      .filter((item) => item.movie.movieId)

    if (!scored.length || !hasTagPreference) {
      return null
    }

    scored.sort((a, b) => b.score - a.score)

    const topN = scored.slice(0, Math.min(5, scored.length))
    const idx = Math.floor(Math.random() * topN.length)
    return topN[idx]?.movie ?? null
  }

  const pickFromTopRatedOnly = () => {
    const topRated = topRatedData.value ?? []
    if (!topRated.length) return null

    const pool = topRated.slice(
      0,
      Math.min(10, topRated.length),
    )
    const idx = Math.floor(Math.random() * pool.length)
    const movie = pool[idx]

    if (!movie) {
      return null
    }

    const result: NoticeMovieCandidate = {
      movieId: String(movie.id),
      title: movie.title,
      poster: movie.poster,
      genres: [],
      rating: movie.rating,
      intro: movie.description ?? '',
      summary: '',
    }

    return result
  }

  const reload = async () => {
    loading.value = true
    error.value = null
    recommendedMovie.value = null
    favoriteIds.value = []

    try {
      if (!userStore.isLoggedIn) {
        await executeTopRated()
        recommendedMovie.value = pickFromTopRatedOnly()
        return
      }

      await Promise.all([
        executeFavorites(),
        executeReviews(),
        executeTopRated(),
      ])

      favoriteIds.value = (
        favoritesData.value?.items ?? []
      ).map((item) => item.movieId)

      const picked = pickByPreference()
      if (picked) {
        recommendedMovie.value = picked
      } else {
        recommendedMovie.value = pickFromTopRatedOnly()
      }
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : '获取推荐失败'
      try {
        await executeTopRated()
        recommendedMovie.value = pickFromTopRatedOnly()
      } catch {
        recommendedMovie.value = null
      }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    recommendedMovie,
    isFavorite,
    reload,
  }
}
