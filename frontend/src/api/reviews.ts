import { useRequest } from "./http"

export const toggleLikeReview = (reviewId: string) => {
  return useRequest<{
    likeCount: number
    liked: boolean
  }>({
    url: `/api/reviews/${reviewId}/like`,
    method: 'POST',
  })
}

