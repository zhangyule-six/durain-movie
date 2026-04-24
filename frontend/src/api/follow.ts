import { useRequest } from './http'

export interface FollowUserInfo {
  _id: string
  username: string
  avatar?: string
  bio?: string
}

export interface FollowListResponse {
  items: FollowUserInfo[]
  total: number
  page: number
  limit: number
}

export interface CheckFollowingResponse {
  isFollowing: boolean
}

export function useFollowUser(userId: string) {
  return useRequest<{ message: string }>({
    url: `/api/users/${userId}/follow`,
    method: 'POST',
  })
}

export function useUnfollowUser(userId: string) {
  return useRequest<{ message: string }>({
    url: `/api/users/${userId}/follow`,
    method: 'DELETE',
  })
}

export function useCheckFollowing(userId: string) {
  return useRequest<CheckFollowingResponse>({
    url: `/api/users/${userId}/is-following`,
    method: 'GET',
  })
}

export function useFollowingList(userId: string, params?: { page?: number; limit?: number }) {
  return useRequest<FollowListResponse, { page?: number; limit?: number }>({
    url: `/api/users/${userId}/following`,
    method: 'GET',
    body: params ?? { page: 1, limit: 20 },
  })
}

export function useFollowersList(userId: string, params?: { page?: number; limit?: number }) {
  return useRequest<FollowListResponse, { page?: number; limit?: number }>({
    url: `/api/users/${userId}/followers`,
    method: 'GET',
    body: params ?? { page: 1, limit: 20 },
  })
}
