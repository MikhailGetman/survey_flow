

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

interface User {
  id: number;
  email: string;
  name: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const loading = ref(false);
  
  const isAuthenticated = computed(() => !!token.value);

  
  async function register(email: string, password: string, name: string) {
    try {
      const response = await api.post('/auth/register', { email, password, name });
      
      token.value = response.data.token;
      user.value = response.data.user;
      
      localStorage.setItem('token', response.data.token);
      
      return response.data;
    } catch (error: any) {
      console.error('Register error in store:', error);
      throw error;
    }
  }
  
  
  return {
    user,
    token,
    loading,
    isAuthenticated,
    register,
  };
});