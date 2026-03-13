import { useRequest } from './http'
import type { TopRatedMoviesResponse } from './types'

export function useTopRatedMovies() {
  return useRequest<TopRatedMoviesResponse, undefined>({
    url: '/api/movie/maoyan/topRated',
    method: 'GET',
  })
}

