
<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>Регистрация</h1>
      
      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label>Имя</label>
          <input 
            v-model="name" 
            type="text" 
            required 
            placeholder="Ваше имя"
          />
        </div>
        
        <div class="form-group">
          <label>Email</label>
          <input 
            v-model="email" 
            type="email" 
            required 
            placeholder="your@email.com"
          />
        </div>
        
        <div class="form-group">
          <label>Пароль</label>
          <input 
            v-model="password" 
            type="password" 
            required 
            placeholder="Минимум 6 символов"
            minlength="6"
          />
        </div>
      
        
        <div class="form-error" v-if="error">{{ error }}</div>
   
        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Регистрация...' : 'Зарегистрироваться' }}
        </button>
        
        <div class="auth-links">
          <router-link to="/login">Уже есть аккаунт? Войти</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const authStore = useAuthStore();

const name = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleRegister() {
  error.value = '';
  
  if (password.value.length < 6) {
    error.value = 'Пароль должен быть не менее 6 символов';
    return;
  }
  
  loading.value = true;
  
  try {
    await authStore.register(email.value, password.value, name.value);
    router.push('/dashboard');
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Ошибка регистрации';
  } finally {
    loading.value = false;
  }
}
</script>