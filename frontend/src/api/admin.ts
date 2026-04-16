import { useRequest } from './http'

export interface AdminStats {
  userCount: number
  movieCount: number
  reviewCount: number
  recentUsers: { _id: string; count: number }[]
  recentReviews: { _id: string; count: number }[]
}

export interface AdminUser {
  _id: string
  username: string
  email: string
  avatar?: string
  bio?: string
  role: 'user' | 'admin'
  stats?: { following: number; followers: number; reviews: number }
  createdAt: string
}

export interface AdminMovie {
  _id: string
  title: string
  originalTitle?: string
  poster?: string
  genres?: string[]
  rating?: { average: number; count: number }
  summary?: string
  duration?: number
  country?: string
  cast?: string[]
  releaseDate?: string
  createdAt: string
}

export interface AdminReview {
  _id: string
  author: { _id: string; username: string; avatar?: string }
  movie: { _id: string; title: string; poster?: string }
  score: number
  content: string
  likeCount: number
  commentCount: number
  isPublic: boolean
  createdAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: Pagination
}

export function useAdminStats() {
  return useRequest<AdminStats>({ url: '/api/admin/stats' })
}

export function useAdminUsers(params: { page?: number; limit?: number; q?: string }) {
  return useRequest<PaginatedResponse<AdminUser>, typeof params>({
    url: '/api/admin/users',
    method: 'GET',
    body: params,
  })
}

export function useAdminUpdateRole(userId: string, role: 'admin' | 'user') {
  return useRequest<AdminUser, { role: string }>({
    url: `/api/admin/users/${userId}`,
    method: 'PUT',
    body: { role },
  })
}

export function useAdminMovies(params: { page?: number; limit?: number; q?: string }) {
  return useRequest<PaginatedResponse<AdminMovie>, typeof params>({
    url: '/api/admin/movies',
    method: 'GET',
    body: params,
  })
}

export function useAdminUpdateMovie(movieId: string, data: Partial<AdminMovie>) {
  return useRequest<AdminMovie, Partial<AdminMovie>>({
    url: `/api/admin/movies/${movieId}`,
    method: 'PUT',
    body: data,
  })
}

export function useAdminDeleteMovie(movieId: string) {
  return useRequest<{ message: string }>({
    url: `/api/admin/movies/${movieId}`,
    method: 'DELETE',
  })
}

export function useAdminReviews(params: { page?: number; limit?: number }) {
  return useRequest<PaginatedResponse<AdminReview>, typeof params>({
    url: '/api/admin/reviews',
    method: 'GET',
    body: params,
  })
}

export function useAdminDeleteReview(reviewId: string) {
  return useRequest<{ message: string }>({
    url: `/api/admin/reviews/${reviewId}`,
    method: 'DELETE',
  })
}
