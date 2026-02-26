import { createRouter, createWebHistory } from 'vue-router'

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
      component: () =>
        import('@/views/Wander/index.vue'),
      meta: { showSidebar: true },
    },
    {
      path: '/collection',
      name: 'collection',
      component: () => import('@/views/CollectionPage.vue'),
      meta: { showSidebar: true },
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('@/views/FavoritesPage.vue'),
      meta: { showSidebar: true },
    },
    {
      path: '/userCenter',
      name: 'userCenter',
      component: () => import('@/views/UserCenter/index.vue'),
      meta: { showSidebar: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsPage.vue'),
      meta: { showSidebar: true },
    },
  ],
})

export default router
