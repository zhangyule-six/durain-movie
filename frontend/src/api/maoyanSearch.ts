import { useRequest } from './http'
import type { MaoyanSearchMovieItem } from './types'

export interface MaoyanSearchParams {
  keyword: string
  ci?: number
}

export type MaoyanSearchResponse = MaoyanSearchMovieItem[]

export function useMaoyanSearchMovies(params: MaoyanSearchParams) {
  return useRequest<MaoyanSearchResponse, MaoyanSearchParams>({
    url: '/api/movie/maoyan/search',
    method: 'GET',
    body: params,
  })
}

