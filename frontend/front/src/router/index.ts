import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/crtanje/:id?',
      name: 'crtanje',     
      component:  () => import('../views/Crtanje.vue')
    },
    {
      path: '/galerija',
      name: 'galerija',     
      component: () => import('@/views/Galerija.vue')
    },
    {
      path: '/pojedinacnaSlika',
      name: 'pojedinacnaSlika',     
      component:  () => import('../views/PojedinacnaSlika.vue')
    },
    {
      path: '/register',
      name: 'register',     
      component:  () => import('../views/Register.vue')
    },
    {
      path: '/login',
      name: 'login',     
      component:  () => import('../views/Login.vue')
    }
  ]
})

export default router
