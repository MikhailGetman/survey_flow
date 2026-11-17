
<template>
  <div class="dashboard">
    <div class="dashboard-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="{ active: activeTab === tab.id }"
        type="button"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="tab-content">
      
      <div v-if="activeTab === 'my-surveys'" class="my-surveys-section">
        <div class="surveys-header">
          <h2>Мои опросы</h2>
          <router-link to="/builder" class="btn btn-primary">
            + Создать опрос
          </router-link>
        </div>
        
        <div v-if="loading.surveys" class="loading-state">
          <div class="spinner"></div>
          <p>Загрузка опросов...</p>
        </div>
        
        <div v-else-if="mySurveys.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>У вас пока нет опросов</h3>
          <p>Создайте свой первый опрос и начните собирать ответы</p>
          <router-link to="/builder" class="btn btn-primary">
            Создать опрос
          </router-link>
        </div>
        
        <div v-else class="surveys-grid">
          <div 
            v-for="survey in mySurveys" 
            :key="survey.id"
            class="survey-card"
          >
            <div class="card-header">
              <h3>{{ survey.title }}</h3>
              <span class="status-badge" :class="survey.status">
                {{ getStatusText(survey.status) }}
              </span>
            </div>
            
            <p class="card-description">{{ survey.description || 'Без описания' }}</p>
            
            <div class="card-stats">
              <div class="stat-item">
                <span class="stat-value">{{ survey.response_count || 0 }}</span>
                <span class="stat-label">Ответов</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ survey.questions_count || 0 }}</span>
                <span class="stat-label">Вопросов</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ formatDate(survey.created_at) }}</span>
                <span class="stat-label">Создан</span>
              </div>
            </div>
            
            <div class="card-actions">
              <router-link 
                :to="`/results/${survey.id}`"
                class="btn btn-sm"
                v-if="survey.status === 'active'"
              >
                📊 Результаты
              </router-link>
              
              <router-link 
                :to="`/builder/${survey.id}`"
                class="btn btn-sm"
              >
                ✏️ Редактировать
              </router-link>
              
              <button 
                @click="copySurveyLink(survey.public_link)"
                class="btn btn-sm"
                v-if="survey.public_link"
              >
                🔗 Копировать ссылку
              </button>
              
              <button 
                @click="deleteSurveyHandler(survey.id)"
                class="btn btn-sm delete-btn"
              >
                🗑️ Удалить
              </button>
            </div>
          </div>
        </div>
      </div>

      
      <div v-if="activeTab === 'taken-surveys'" class="taken-surveys-section">
        <h2>Пройденные опросы</h2>
        
        <div v-if="loading.taken" class="loading-state">
          <div class="spinner"></div>
          <p>Загрузка...</p>
        </div>
        
        <div v-else-if="takenSurveys.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>Вы еще не проходили опросы</h3>
          <p>Пройдите опросы других пользователей по ссылке</p>
        </div>
        
        <div v-else class="taken-surveys-list">
          <div 
            v-for="survey in takenSurveys" 
            :key="survey.response_id"
            class="survey-item"
          >
            <div class="survey-info">
              <div class="survey-title">{{ survey.title }}</div>
              <div class="survey-meta">
                Создатель: {{ survey.creator_name || 'Аноним' }} • 
                Пройден: {{ formatDate(survey.completed_at) }}
              </div>
            </div>
            <div class="survey-score">
              <div class="score-value">{{ survey.answers_count }}/{{ survey.questions_count }}</div>
              <div class="score-label">ответов</div>
            </div>
          </div>
        </div>
      </div>

      
      <div v-if="activeTab === 'profile'" class="profile-section">
        <div class="profile-card">
          <h3>Личные данные</h3>
          <form @submit.prevent="updateProfile" class="form-grid">
            <div class="form-group">
              <label>Имя</label>
              <input 
                v-model="profileForm.name" 
                type="text" 
                class="form-control"
                placeholder="Ваше имя"
              />
            </div>
            
            <div class="form-group">
              <label>Email</label>
              <input 
                v-model="profileForm.email" 
                type="email" 
                class="form-control"
                disabled
              />
            </div>
            
            <div class="form-group">
              <label>Новый пароль</label>
              <input 
                v-model="profileForm.newPassword" 
                type="password" 
                class="form-control"
                placeholder="Оставьте пустым, чтобы не менять"
              />
            </div>
            
            <div class="form-group">
              <label>Подтвердите пароль</label>
              <input 
                v-model="profileForm.confirmPassword" 
                type="password" 
                class="form-control"
                placeholder="Повторите новый пароль"
              />
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="saving">
                {{ saving ? 'Сохранение...' : 'Сохранить изменения' }}
              </button>
            </div>
          </form>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ profile?.createdSurveys || 0 }}</div>
            <div class="stat-label">Создано опросов</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ profile?.takenSurveys || 0 }}</div>
            <div class="stat-label">Пройдено опросов</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ profile?.created_at ? formatDate(profile.created_at) : '-' }}</div>
            <div class="stat-label">Дата регистрации</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { useNotificationStore } from '@/store/notification';
import api from '@/services/api';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();


const activeTab = ref('my-surveys');
const loading = reactive({
  surveys: false,
  taken: false
});
const saving = ref(false);

const mySurveys = ref<any[]>([]);
const takenSurveys = ref<any[]>([]);
const profile = ref<any>(null);

const profileForm = reactive({
  name: '',
  email: '',
  newPassword: '',
  confirmPassword: ''
});

const tabs = [
  { id: 'my-surveys', label: 'Мои опросы' },
  { id: 'taken-surveys', label: 'Пройденные опросы' },
  { id: 'profile', label: 'Управление' }
];


const userInitial = computed(() => {
  return authStore.user?.name?.charAt(0)?.toUpperCase() || 'U';
});


onMounted(async () => {
  await Promise.all([
    loadMySurveys(),
    loadProfile()
  ]);
});

async function loadMySurveys() {
  loading.surveys = true;
  try {
    const response = await api.get('/surveys/my');
    mySurveys.value = Array.isArray(response.data) ? response.data : 
                     (response.data.surveys || []);
  } catch (error: any) {
    console.error('Error loading surveys:', error);
    notificationStore.error('Ошибка', 'Не удалось загрузить опросы');
  } finally {
    loading.surveys = false;
  }
}

async function loadTakenSurveys() {
  loading.taken = true;
  try {
    const response = await api.get('/surveys/taken');
    takenSurveys.value = Array.isArray(response.data) ? response.data : 
                        (response.data.surveys || []);
  } catch (error: any) {
    console.error('Error loading taken surveys:', error);
    notificationStore.error('Ошибка', 'Не удалось загрузить пройденные опросы');
  } finally {
    loading.taken = false;
  }
}

async function loadProfile() {
  try {
    const response = await api.get('/auth/profile');
    profile.value = response.data;
    profileForm.name = response.data.name || '';
    profileForm.email = response.data.email || '';
  } catch (error: any) {
    console.error('Error loading profile:', error);
  }
}

async function updateProfile() {
  if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
    notificationStore.error('Ошибка', 'Пароли не совпадают');
    return;
  }
  
  if (profileForm.newPassword && profileForm.newPassword.length < 6) {
    notificationStore.error('Ошибка', 'Пароль должен быть не менее 6 символов');
    return;
  }
  
  saving.value = true;
  try {
    const data: any = { name: profileForm.name };
    if (profileForm.newPassword) {
      data.password = profileForm.newPassword;
    }
    
    await api.put('/auth/profile', data);
    notificationStore.success('Успешно', 'Профиль обновлен');
    
    
    profileForm.newPassword = '';
    profileForm.confirmPassword = '';
  } catch (error: any) {
    notificationStore.error('Ошибка', error.response?.data?.error || 'Не удалось обновить профиль');
  } finally {
    saving.value = false;
  }
}

async function deleteSurveyHandler(surveyId: number) {
  if (!confirm('Вы уверены, что хотите удалить этот опрос? Это действие нельзя отменить.')) {
    return;
  }
  
  try {
    await api.delete(`/surveys/${surveyId}`);
    notificationStore.success('Успешно', 'Опрос удален');
    await loadMySurveys();
  } catch (error: any) {
    notificationStore.error('Ошибка', 'Не удалось удалить опрос');
  }
}

function copySurveyLink(publicLink: string) {
  if (!publicLink) return;
  
  const fullLink = `${window.location.origin}/survey/${publicLink}`;
  navigator.clipboard.writeText(fullLink).then(() => {
    notificationStore.success('Готово', 'Ссылка скопирована в буфер обмена');
  }).catch(() => {
    notificationStore.info('Ссылка', fullLink);
  });
}

function handleLogout() {
  authStore.logout();
  router.push('/login');
}

function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'draft': 'Черновик',
    'active': 'Активен',
    'closed': 'Закрыт'
  };
  return statusMap[status] || status;
}


import { watch } from 'vue';
watch(activeTab, (newTab) => {
  if (newTab === 'taken-surveys' && takenSurveys.value.length === 0) {
    loadTakenSurveys();
  }
});
</script>

<style lang="scss" scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;

    h1 {
      font-size: 32px;
      color: #333;
      margin: 0;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 16px;

      .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #667eea;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 18px;
      }

      .user-name {
        font-weight: 500;
        color: #333;
      }

      .logout-btn {
        padding: 8px 16px;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        color: #666;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #f5f5f5;
          color: #333;
        }
      }
    }
  }

  .dashboard-tabs {
    display: flex;
    gap: 4px;
    background: white;
    padding: 6px;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    margin-bottom: 24px;

    button {
      flex: 1;
      padding: 10px 20px;
      background: transparent;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      color: #666;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: 500;

      &:hover {
        background: #f5f5f5;
        color: #333;
      }

      &.active {
        background: #667eea;
        color: white;
      }
    }
  }

  .tab-content {
    .surveys-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h2 {
        font-size: 24px;
        color: #333;
        margin: 0;
      }
    }

    .loading-state {
      text-align: center;
      padding: 40px;

      .spinner {
        display: inline-block;
        width: 40px;
        height: 40px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #667eea;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-bottom: 16px;
      }

      p {
        color: #888;
      }
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;

      .empty-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }

      h3 {
        font-size: 20px;
        color: #333;
        margin-bottom: 12px;
      }

      p {
        color: #666;
        margin-bottom: 24px;
      }
    }

    .surveys-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;

      .survey-card {
        background: white;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition: all 0.3s;

        &:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
          transform: translateY(-2px);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;

          h3 {
            font-size: 18px;
            color: #333;
            margin: 0;
            flex: 1;
            margin-right: 12px;
          }

          .status-badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            white-space: nowrap;

            &.active {
              background: #d4edda;
              color: #155724;
            }

            &.draft {
              background: #fff3cd;
              color: #856404;
            }

            &.closed {
              background: #f8d7da;
              color: #721c24;
            }
          }
        }

        .card-description {
          color: #666;
          font-size: 14px;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .card-stats {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;

          .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;

            .stat-value {
              font-size: 18px;
              font-weight: 600;
              color: #667eea;
            }

            .stat-label {
              font-size: 12px;
              color: #888;
              margin-top: 4px;
            }
          }
        }

        .card-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;

          .btn, a {
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.2s;
            border: 1px solid #e0e0e0;
            background: white;
            color: #555;
            display: inline-flex;
            align-items: center;
            gap: 4px;

            &:hover {
              background: #f5f5f5;
              color: #333;
            }

            &.delete-btn {
              &:hover {
                background: #fee;
                border-color: #e74c3c;
                color: #e74c3c;
              }
            }
          }
        }
      }
    }

    .taken-surveys-list {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      overflow: hidden;

      .survey-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .survey-title {
          font-weight: 500;
          color: #333;
          margin-bottom: 4px;
        }

        .survey-meta {
          font-size: 13px;
          color: #888;
        }

        .score-value {
          font-size: 18px;
          font-weight: 600;
          color: #667eea;
          text-align: right;
        }

        .score-label {
          font-size: 12px;
          color: #888;
          text-align: right;
        }
      }
    }

    .profile-section {
      .profile-card {
        background: white;
        border-radius: 12px;
        padding: 30px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        margin-bottom: 24px;

        h3 {
          margin-bottom: 24px;
          color: #333;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;

          .form-group {
            label {
              display: block;
              margin-bottom: 6px;
              font-weight: 500;
              color: #555;
              font-size: 14px;
            }

            input {
              width: 100%;
              padding: 10px 12px;
              border: 1px solid #ddd;
              border-radius: 6px;
              font-size: 14px;

              &:focus {
                outline: none;
                border-color: #667eea;
              }

              &:disabled {
                background: #f5f5f5;
                color: #888;
              }
            }
          }

          .form-actions {
            grid-column: 1 / -1;
            padding-top: 20px;
          }
        }
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;

        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

          .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 8px;
          }

          .stat-label {
            font-size: 13px;
            color: #888;
          }
        }
      }
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .dashboard {
    .dashboard-header {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }

    .surveys-grid {
      grid-template-columns: 1fr;
    }

    .profile-section .form-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>