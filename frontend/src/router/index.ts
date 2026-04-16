import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/useUser'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Home/index.vue'),
      meta: { showSidebar: true },
    },
    {
      path: '/wander',
      name: 'wander',
      component: () => import('@/views/Wander/index.vue'),
      meta: { showSidebar: true },
    },
    {
      path: '/filmDetail/:name',
      name: 'filmDetail',
      component: () => import('@/views/FilmDetail/index.vue'),
      meta: { showSidebar: true },
    },
    {
      path: '/newFilms',
      name: 'newFilmMore',
      component: () => import('@/views/NewFilmMore/index.vue'),
      meta: { showSidebar: true },
    },
    {
      path: '/rank',
      name: 'rankMore',
      component: () => import('@/views/RankMore/index.vue'),
      meta: { showSidebar: true },
    },
    {
      path: '/coming',
      name: 'comingMore',
      component: () => import('@/views/ComingMore/index.vue'),
      meta: { showSidebar: true },
    },
    {
      path: '/search',
      name: 'searchResult',
      component: () => import('@/views/SearchResult/index.vue'),
      meta: { showSidebar: true },
    },
    {
      path: '/userCenter',
      name: 'userCenter',
      component: () =>
        import('@/views/UserCenter/index.vue'),
      meta: { showSidebar: true },
    },
    {
      path: '/user/:userId',
      name: 'userProfile',
      component: () => import('@/views/UserProfile/index.vue'),
      meta: { showSidebar: true },
    },
    {
      path: '/community',
      name: 'community',
      component: () => import('@/views/Community/index.vue'),
      meta: { showSidebar: true },
    },
    {
      path: '/community/:groupId',
      name: 'communityChat',
      component: () => import('@/views/Community/Chat.vue'),
      meta: { showSidebar: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsPage.vue'),
      meta: { showSidebar: true },
    },
    {
      path: '/admin',
      component: () => import('@/layout/AdminLayout.vue'),
      meta: { showSidebar: false, requiresAdmin: true },
      children: [
        { path: '', redirect: '/admin/dashboard' },
        {
          path: 'dashboard',
          name: 'adminDashboard',
          component: () => import('@/views/Admin/Dashboard.vue'),
        },
        {
          path: 'users',
          name: 'adminUsers',
          component: () => import('@/views/Admin/UserManage.vue'),
        },
        {
          path: 'movies',
          name: 'adminMovies',
          component: () => import('@/views/Admin/MovieManage.vue'),
        },
        {
          path: 'reviews',
          name: 'adminReviews',
          component: () => import('@/views/Admin/ReviewManage.vue'),
        },
      ],
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  const isAdmin = userStore.user?.role === 'admin'
  const isAdminRoute = to.path.startsWith('/admin')

  if (isAdminRoute && !isAdmin) {
    return next('/')
  }
  if (!isAdminRoute && isAdmin) {
    return next('/admin/dashboard')
  }
  next()
})

export default router
