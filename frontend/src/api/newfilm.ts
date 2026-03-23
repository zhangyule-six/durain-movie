import { useRequest } from './http'
import type {
  MovieOnInfoListResponse,
  ComingListResponse,
  TopRankMovie,
  RecommendByGenresItem,
} from './types'

export function useMovieOnInfoList() {
  return useRequest<MovieOnInfoListResponse, undefined>({
    url: '/api/movie/maoyan/onInfoList',
    method: 'GET',
  })
}

export function useComingList(limit = 10, ci = 1) {
  return useRequest<ComingListResponse, undefined>({
    url: `/api/movie/maoyan/comingList?ci=${encodeURIComponent(String(ci))}&limit=${encodeURIComponent(String(limit))}`,
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
  return useRequest<RecommendByGenresItem[], { genres: string[] }>({
    url: `/api/movie/${encodeURIComponent(movieId)}/recommend-by-genres`,
    method: 'POST',
    body: { genres },
  })
}

