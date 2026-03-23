import { useRequest } from './http'
import type { MaoyanSearchPageResponse } from './types'

export interface MaoyanSearchParams {
  keyword: string
  ci?: number
  offset?: number
  limit?: number
}

export type MaoyanSearchResponse = MaoyanSearchPageResponse

export function useMaoyanSearchMovies(params: MaoyanSearchParams) {
  return useRequest<MaoyanSearchResponse, MaoyanSearchParams>({
    url: '/api/movie/maoyan/search',
    method: 'GET',
    body: params,
  })
}

