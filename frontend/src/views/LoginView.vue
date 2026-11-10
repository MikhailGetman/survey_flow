
<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>Вход в систему</h1>
      
      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label>Email</label>
          <input 
            v-model="email" 
            type="email" 
            required 
            placeholder="your@email.com"
            class="form-control"
          />
        </div>
        
        <div class="form-group">
          <label>Пароль</label>
          <input 
            v-model="password" 
            type="password" 
            required 
            placeholder="Введите пароль"
            class="form-control"
          />
        </div>
        
        <div class="form-error" v-if="error">{{ error }}</div>
        
        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Вход...' : 'Войти' }}
        </button>
        
        <div class="auth-links">
          <router-link to="/forgot-password">Забыли пароль?</router-link>
          <router-link to="/register">Регистрация</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { useNotificationStore } from '@/store/notification';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleLogin() {
  error.value = '';
  loading.value = true;
  
  try {
    await authStore.login(email.value, password.value);
    
    notificationStore.success('Успешно', 'Вы вошли в систему');
    
    
    const redirectPath = (route.query.redirect as string) || '/dashboard';
    
    console.log('Login successful, redirecting to:', redirectPath);
    
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    router.push(redirectPath);
    
  } catch (err: any) {
    console.error('Login error:', err);
    const errorMessage = err.response?.data?.error || err.message || 'Ошибка входа';
    error.value = errorMessage;
  } finally {
    loading.value = false;
  }
}
</script>