import { defineStore } from 'pinia'
import type { AuthUser } from '@/api/types'

interface UserState {
  user: AuthUser | null
  loading: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    loading: false,
  }),
  getters: {
    isLoggedIn: (state) => !!state.user,
    username: (state) => state.user?.username ?? '',
    avatar: (state) => state.user?.avatar ?? '',
  },
  actions: {
    setUser(user: AuthUser | null) {
      this.user = user
    },
    setLoading(value: boolean) {
      this.loading = value
    },
    reset() {
      this.user = null
      this.loading = false
    },
  },
})

