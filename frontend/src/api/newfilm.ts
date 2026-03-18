import { useRequest } from './http'
import type {
  MovieOnInfoListResponse,
  TopRankMovie,
  Recommendation,
} from './types'

export function useMovieOnInfoList() {
  return useRequest<MovieOnInfoListResponse, undefined>({
    url: '/api/movie/maoyan/onInfoList',
    method: 'GET',
  })
}

export function useTopRatedMovies(limit = 10) {
  return useRequest<TopRankMovie[], undefined>({
    url: `/api/movie/top-rated?limit=${encodeURIComponent(String(limit))}`,
    method: 'GET',
  })
}

export function useRecommendByGenres(movieId: string, genres: string[]) {
  return useRequest<Recommendation[], { genres: string[] }>({
    url: `/api/movie/${encodeURIComponent(movieId)}/recommend-by-genres`,
    method: 'POST',
    body: { genres },
  })
}

