import { useRequest } from './http'
import type { AuthUser } from './types'

export interface UpdateProfilePayload {
  username?: string
  bio?: string
  avatar?: string
}

export function useUpdateProfile(payload: UpdateProfilePayload) {
  return useRequest<AuthUser, UpdateProfilePayload>({
    url: '/api/auth/update',
    method: 'PUT',
    body: payload,
  })
}

export interface MyReviewItem {
  _id: string
  movieId: string
  movieName: string
  score: number
  content: string
  likeCount: number
  commentCount: number
  createdAt: string
  poster?: string
  genres?: string[]
  releaseDate?: string
}

export interface MyFavoriteItem {
  _id: string
  movieId: string
  movieName: string
  poster: string
  info: string
  genres?: string[]
  releaseDate?: string
}

export interface MyReviewsResponse {
  items: MyReviewItem[]
  pagination: { page: number; limit: number; total: number }
}

export interface MyFavoritesResponse {
  items: MyFavoriteItem[]
}

export interface UserProfileInfo {
  _id: string
  username: string
  avatar?: string
  bio?: string
}

export interface UserReviewsResponse {
  items: MyReviewItem[]
  pagination?: { page: number; limit: number; total: number }
}

export interface UserFavoritesResponse {
  items: MyFavoriteItem[]
}

export function useMyReviews(params?: { page?: number; limit?: number }) {
  return useRequest<MyReviewsResponse, { page?: number; limit?: number }>({
    url: '/api/auth/reviews',
    method: 'GET',
    body: params ?? { page: 1, limit: 20 },
  })
}

export function useMyFavorites() {
  return useRequest<MyFavoritesResponse, undefined>({
    url: '/api/auth/favorites',
    method: 'GET',
  })
}

export function useAddFavorite(movieId: string) {
  return useRequest<MyFavoriteItem | { message: string; _id?: string }, { movieId: string }>({
    url: '/api/auth/favorites',
    method: 'POST',
    body: { movieId },
  })
}

export function useRemoveFavorite(movieId: string) {
  return useRequest<{ message: string }, undefined>({
    url: `/api/auth/favorites/${movieId}`,
    method: 'DELETE',
  })
}

export function useUserProfile(userId: string) {
  return useRequest<UserProfileInfo, undefined>({
    url: `/api/users/${userId}/profile`,
    method: 'GET',
  })
}

export function useUserReviews(userId: string, params?: { page?: number; limit?: number }) {
  return useRequest<UserReviewsResponse, { page?: number; limit?: number }>({
    url: `/api/users/${userId}/reviews`,
    method: 'GET',
    body: params ?? { page: 1, limit: 20 },
  })
}

export function useUserFavorites(userId: string) {
  return useRequest<UserFavoritesResponse, undefined>({
    url: `/api/users/${userId}/favorites`,
    method: 'GET',
  })
}


