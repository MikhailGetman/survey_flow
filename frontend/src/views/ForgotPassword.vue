<!-- frontend/src/views/ForgotPassword.vue -->
<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>Восстановление пароля</h1>
      
      <div v-if="!emailSent">
        <p class="description">
          Введите email, указанный при регистрации. 
          Мы отправим вам ссылку для сброса пароля.
        </p>
        
        <form @submit.prevent="handleForgotPassword" class="auth-form">
          <div class="form-group">
            <label>Email</label>
            <input 
              v-model="email" 
              type="email" 
              required 
              placeholder="your@email.com"
            />
          </div>
          
          <div class="form-error" v-if="error">{{ error }}</div>
          
          <button type="submit" class="submit-btn" :disabled="loading">
            {{ loading ? 'Отправка...' : 'Отправить инструкции' }}
          </button>
        </form>
      </div>
      
      <div v-else class="success-message">
        <div class="success-icon">✓</div>
        <h2>Письмо отправлено!</h2>
        <p>
          Мы отправили инструкции по восстановлению пароля на 
          <strong>{{ email }}</strong>
        </p>
        <p>Проверьте папку "Спам", если письмо не пришло.</p>
        <button @click="emailSent = false" class="retry-btn">
          Отправить повторно
        </button>
      </div>
      
      <div class="auth-links">
        <router-link to="/login">Вернуться ко входу</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/store/auth';

const authStore = useAuthStore();

const email = ref('');
const error = ref('');
const loading = ref(false);
const emailSent = ref(false);

async function handleForgotPassword() {
  error.value = '';
  loading.value = true;
  
  try {
    await authStore.forgotPassword(email.value);
    emailSent.value = true;
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Ошибка отправки';
  } finally {
    loading.value = false;
  }
}
</script>