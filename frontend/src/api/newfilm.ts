import { useRequest } from './http'
import type { MovieOnInfoListResponse } from './types'

export function useMovieOnInfoList() {
  return useRequest<MovieOnInfoListResponse, undefined>({
    url: '/api/movie/maoyan/onInfoList',
    method: 'GET',
  })
}

