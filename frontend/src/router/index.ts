

import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true }
    },

    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guest: true }
    },

{
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: () => import('@/views/ForgotPassword.vue'),
      meta: { guest: true }
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('@/views/ResetPassword.vue'),
      meta: { guest: true }
    },
    
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/builder',
      name: 'SurveyBuilder',
      component: () => import('@/components/SurveyBuilder.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/builder/:id',
      name: 'SurveyEdit',
      component: () => import('@/components/SurveyBuilder.vue'),
      meta: { requiresAuth: true }
    },
  ]
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ 
      path: '/login', 
      query: { redirect: to.fullPath } 
    });
  } 
  
  else if (to.meta.guest && authStore.isAuthenticated) {
    // будет позже
  } 
  
  else {
    next();
  }
});

export default router;