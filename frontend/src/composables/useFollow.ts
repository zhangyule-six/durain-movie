import { ref } from 'vue'
import { useFollowUser, useUnfollowUser, useCheckFollowing } from '@/api/follow'

export function useFollow(targetUserId: string) {
  const isFollowing = ref(false)
  const loading = ref(false)

  async function checkStatus() {
    if (!targetUserId) return
    try {
      const { execute } = useCheckFollowing(targetUserId)
      const result = await execute()
      isFollowing.value = result.isFollowing
    } catch {
      /* silent */
    }
  }

  async function follow() {
    if (loading.value) return
    loading.value = true
    try {
      const { execute } = useFollowUser(targetUserId)
      await execute()
      isFollowing.value = true
    } finally {
      loading.value = false
    }
  }

  async function unfollow() {
    if (loading.value) return
    loading.value = true
    try {
      const { execute } = useUnfollowUser(targetUserId)
      await execute()
      isFollowing.value = false
    } finally {
      loading.value = false
    }
  }

  async function toggle() {
    if (isFollowing.value) {
      await unfollow()
    } else {
      await follow()
    }
  }

  return { isFollowing, loading, checkStatus, follow, unfollow, toggle }
}
