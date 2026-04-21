import { defineStore } from 'pinia'
import type { AuthUser } from '@/api/types'

interface UserState {
  user: AuthUser | null
  loading: boolean
  showLoginModal: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    loading: false,
    showLoginModal: false,
  }),
  getters: {
    isLoggedIn: (state) => !!state.user,
    isAdmin: (state) => state.user?.role === 'admin',
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
    openLoginModal() {
      this.showLoginModal = true
    },
    closeLoginModal() {
      this.showLoginModal = false
    },
    requireLogin(): boolean {
      if (this.isLoggedIn) return true
      this.showLoginModal = true
      return false
    },
    reset() {
      this.user = null
      this.loading = false
      this.showLoginModal = false
    },
  },
})

