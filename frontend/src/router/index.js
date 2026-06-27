import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useGuestStore } from '@/stores/guest'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/upload',
    name: 'Upload',
    component: () => import('@/views/Upload.vue')
  },
  {
    path: '/practice/:bankId',
    name: 'Practice',
    component: () => import('@/views/Practice.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/views/ResetPassword.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const guestStore = useGuestStore()
  
  guestStore.init()
  
  if (to.meta.requiresAuth && !userStore.token) {
    next({ name: 'Home', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
