
<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>Сброс пароля</h1>
      
      <form @submit.prevent="handleResetPassword" class="auth-form">
        <div class="form-group">
          <label>Новый пароль</label>
          <input 
            v-model="newPassword" 
            type="password" 
            required 
            placeholder="Минимум 6 символов"
            minlength="6"
          />
        </div>
        
        <div class="form-group">
          <label>Подтвердите пароль</label>
          <input 
            v-model="confirmPassword" 
            type="password" 
            required 
            placeholder="Повторите пароль"
          />
        </div>
        
        <div class="form-error" v-if="error">{{ error }}</div>
        <div class="form-success" v-if="success">{{ success }}</div>
        
        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Сохранение...' : 'Сохранить пароль' }}
        </button>
        
        <div class="auth-links">
          <router-link to="/login">Вернуться ко входу</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const newPassword = ref('');
const confirmPassword = ref('');
const error = ref('');
const success = ref('');
const loading = ref(false);

async function handleResetPassword() {
  error.value = '';
  success.value = '';
  
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Пароли не совпадают';
    return;
  }
  
  if (newPassword.value.length < 6) {
    error.value = 'Пароль должен быть не менее 6 символов';
    return;
  }
  
  const token = route.query.token as string;
  if (!token) {
    error.value = 'Недействительная ссылка для сброса пароля';
    return;
  }
  
  loading.value = true;
  
  try {
    await authStore.resetPassword(token, newPassword.value);
    success.value = 'Пароль успешно изменен!';
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Ошибка сброса пароля';
  } finally {
    loading.value = false;
  }
}
</script>