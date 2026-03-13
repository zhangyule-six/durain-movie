import { useRequest } from "./http";
import type { MovieSearchParams, MovieSearchResponse } from "./types";

export function useSearch(query: MovieSearchParams) {
  return useRequest<MovieSearchResponse, MovieSearchParams>(
    {
      url: '/api/movie/wmdb/search',
      method: 'GET',
      body: query,
    },
  )
}