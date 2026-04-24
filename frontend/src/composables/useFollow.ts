import { ref } from 'vue'
import { useFollowUser, useUnfollowUser, useCheckFollowing } from '@/api/follow'
import { useUserStore } from '@/stores/useUser'

function updateFollowingCount(delta: number) {
  const userStore = useUserStore()
  const user = userStore.user
  if (!user) return
  userStore.setUser({
    ...user,
    stats: {
      following: Math.max(0, (user.stats?.following ?? 0) + delta),
      followers: user.stats?.followers ?? 0,
      reviews: user.stats?.reviews ?? 0,
    },
  })
}

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
      updateFollowingCount(1)
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
      updateFollowingCount(-1)
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
