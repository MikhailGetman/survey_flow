

import axios from 'axios';
import { useAuthStore } from '@/store/auth';
import router from '@/router';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});


api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.status, error.response?.data);
    
    
    if (error.response?.status === 401) {
      const authStore = useAuthStore();
      const currentPath = router.currentRoute.value.fullPath;
      
      
      if (!currentPath.includes('/login')) {
        authStore.logout();
        router.push({ 
          path: '/login', 
          query: { redirect: currentPath } 
        });
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;