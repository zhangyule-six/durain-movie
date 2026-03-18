import { useRequest } from "./http"

export const toggleLikeComment = (commentId: string) => {
  return useRequest<{
    likeCount: number
    liked: boolean
  }>({
    url: `/api/comments/${commentId}/like`,
    method: 'POST',
  })
}