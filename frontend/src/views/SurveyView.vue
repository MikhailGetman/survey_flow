<template>
  <div class="survey-view">
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Загрузка опроса...</p>
    </div>

    <div v-else-if="requiresAuth" class="auth-required-container">
      <div class="auth-required-card">
        <div class="auth-icon">🔒</div>
        <h2>Требуется авторизация</h2>
        <p>Для прохождения этого опроса необходимо войти в систему</p>
        <div class="auth-actions">
          <router-link :to="{ path: '/login', query: { redirect: $route.fullPath } }" class="btn btn-primary">Войти</router-link>
          <router-link to="/register" class="btn btn-secondary">Зарегистрироваться</router-link>
        </div>
      </div>
    </div>

    <div v-else-if="alreadyTaken" class="already-taken-container">
      <div class="already-taken-card">
        <div class="taken-icon">✅</div>
        <h2>Опрос уже пройден</h2>
        <p>Вы уже ответили на все вопросы этого опроса. Повторное прохождение не разрешено.</p>
        
        <div v-if="surveyStats && surveyStats.questions && surveyStats.questions.length > 0" class="results-preview">
          <h3>Результаты опроса</h3>
          <p class="live-note">🔄 Результаты обновляются в реальном времени</p>
          
          <div class="mini-stats">
            <div class="mini-stat">
              <span class="mini-stat-value">{{ surveyStats.totalResponses || 0 }}</span>
              <span class="mini-stat-label">Всего ответов</span>
            </div>
            <div class="mini-stat">
              <span class="mini-stat-value">{{ surveyStats.completionRate || 0 }}%</span>
              <span class="mini-stat-label">Завершенность</span>
            </div>
            <div class="mini-stat">
              <span class="mini-stat-value">{{ surveyStats.avgTime || '0 мин' }}</span>
              <span class="mini-stat-label">Среднее время</span>
            </div>
          </div>
          
          <div v-for="qStat in surveyStats.questions" :key="qStat.questionId" class="question-stat">
            <h5>{{ qStat.questionTitle }}</h5>
            <div v-if="qStat.type !== 'text' && qStat.data && qStat.data.length > 0" class="mini-chart">
              <div v-for="item in qStat.data" :key="item.id || item.text" class="chart-row">
                <span class="chart-label">{{ item.text }}</span>
                <div class="chart-bar-container">
                  <div class="chart-bar" :style="{ width: getPercentFromData(item.count, qStat.data) + '%' }"></div>
                </div>
                <span class="chart-value">{{ item.count }}</span>
              </div>
            </div>
            <div v-else-if="qStat.type === 'text' && qStat.data && qStat.data.length > 0" class="text-answers-preview">
              <div v-for="(answer, aIdx) in qStat.data.slice(0, 5)" :key="aIdx" class="answer-preview-item">
                "{{ answer.text_answer }}" ({{ answer.count }})
              </div>
            </div>
            <div v-else class="no-data-mini">
              <p>Пока нет ответов</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="error-container">
      <div class="error-card">
        <div class="error-icon">⚠️</div>
        <h2>Опрос не найден</h2>
        <p>{{ error }}</p>
        <button @click="loadSurvey" class="btn btn-primary">Попробовать снова</button>
      </div>
    </div>

    <div v-else-if="survey" class="survey-container">
      <div class="survey-header">
        <h1>{{ survey.title }}</h1>
        <p v-if="survey.description" class="survey-description">{{ survey.description }}</p>
        
        <div v-if="!submitted" class="survey-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <div class="progress-text">{{ answeredCount }} из {{ survey.questions.length }} вопросов</div>
        </div>
      </div>

      <div v-if="!submitted" class="questions-container">
        <div v-for="(question, index) in survey.questions" :key="question.id" class="question-card">
          <div class="question-header">
            <h3>{{ index + 1 }}. {{ question.title }}<span v-if="question.required" class="required">*</span></h3>
            <p v-if="question.description" class="question-description">{{ question.description }}</p>
          </div>

          <div v-if="question.type === 'single_choice'" class="options-group">
            <div v-for="option in getQuestionOptions(question)" :key="option.id || option" class="option-item" :class="{ selected: answers[index] === getOptionValue(option) }" @click="answers[index] = getOptionValue(option)">
              <div class="option-radio" :class="{ checked: answers[index] === getOptionValue(option) }">
                <div class="radio-inner" v-if="answers[index] === getOptionValue(option)"></div>
              </div>
              <span class="option-text">{{ getOptionText(option) }}</span>
            </div>
            <div v-if="hasOtherOption(question)" class="option-item" :class="{ selected: answers[index] === '__other__' }">
              <div class="option-radio" :class="{ checked: answers[index] === '__other__' }" @click="answers[index] = '__other__'">
                <div class="radio-inner" v-if="answers[index] === '__other__'"></div>
              </div>
              <span class="option-text" @click="answers[index] = '__other__'">Другое:</span>
              <input v-if="answers[index] === '__other__'" v-model="otherAnswers[index]" type="text" class="other-input" placeholder="Введите свой вариант" @click.stop />
            </div>
          </div>

          <div v-if="question.type === 'multiple_choice'" class="options-group">
            <div v-for="option in getQuestionOptions(question)" :key="option.id || option" class="option-item" :class="{ selected: isMultipleSelected(index, getOptionValue(option)) }" @click="toggleMultipleChoice(index, getOptionValue(option))">
              <div class="option-checkbox" :class="{ checked: isMultipleSelected(index, getOptionValue(option)) }">
                <span v-if="isMultipleSelected(index, getOptionValue(option))">✓</span>
              </div>
              <span class="option-text">{{ getOptionText(option) }}</span>
            </div>
          </div>

          <div v-if="question.type === 'text'" class="text-input">
            <textarea v-model="answers[index]" placeholder="Введите ваш ответ..." rows="4" class="text-area"></textarea>
            <div class="char-counter" v-if="answers[index]">{{ answers[index].length }} символов</div>
          </div>

          <div v-if="question.type === 'likert_scale'" class="likert-scale">
            <div class="scale-container">
              <div v-for="value in getLikertRange(question)" :key="value" class="scale-item" :class="{ selected: answers[index] == value }" @click="answers[index] = value">{{ value }}</div>
            </div>
            <div class="scale-labels">
              <span>{{ getLikertMinLabel(question) }}</span>
              <span>{{ getLikertMaxLabel(question) }}</span>
            </div>
          </div>

          <div v-if="question.type === 'ab_test'" class="ab-test">
            <div class="ab-variants">
              <div v-for="(variant, vIndex) in getABVariants(question)" :key="vIndex" class="variant-card" :class="{ selected: answers[index] === variant }" @click="answers[index] = variant">
                <div class="variant-label">Вариант {{ String.fromCharCode(65 + vIndex) }}</div>
                <div class="variant-content">{{ variant }}</div>
              </div>
            </div>
          </div>

          <div v-if="errors[index]" class="error-message">{{ errors[index] }}</div>
        </div>

        <div class="survey-actions">
          <button @click="submitSurvey" class="submit-btn" :disabled="!isValid || submitting">{{ submitting ? 'Отправка...' : 'Отправить ответы' }}</button>
          <button v-if="survey.allowRetake" @click="resetSurvey" class="reset-btn" type="button">Сбросить ответы</button>
        </div>
      </div>

      <div v-else class="submitted-message">
        <div class="success-icon">✓</div>
        <h2>Спасибо за участие!</h2>
        <p>Ваши ответы успешно отправлены.</p>
        
        <div v-if="surveyStats && surveyStats.questions && surveyStats.questions.length > 0" class="results-preview">
          <h3>Текущие результаты опроса</h3>
          <p class="live-note">🔄 Результаты обновляются в реальном времени</p>
          
          <div class="mini-stats">
            <div class="mini-stat">
              <span class="mini-stat-value">{{ surveyStats.totalResponses || 0 }}</span>
              <span class="mini-stat-label">Всего ответов</span>
            </div>
            <div class="mini-stat">
              <span class="mini-stat-value">{{ surveyStats.completionRate || 0 }}%</span>
              <span class="mini-stat-label">Завершенность</span>
            </div>
            <div class="mini-stat">
              <span class="mini-stat-value">{{ surveyStats.avgTime || '0 мин' }}</span>
              <span class="mini-stat-label">Среднее время</span>
            </div>
          </div>
          
          <div v-for="qStat in surveyStats.questions" :key="qStat.questionId" class="question-stat">
            <h5>{{ qStat.questionTitle }}</h5>
            <div v-if="qStat.type !== 'text' && qStat.data && qStat.data.length > 0" class="mini-chart">
              <div v-for="item in qStat.data" :key="item.id || item.text" class="chart-row">
                <span class="chart-label">{{ item.text }}</span>
                <div class="chart-bar-container">
                  <div class="chart-bar" :style="{ width: getPercentFromData(item.count, qStat.data) + '%' }"></div>
                </div>
                <span class="chart-value">{{ item.count }}</span>
              </div>
            </div>
            <div v-else-if="qStat.type === 'text' && qStat.data && qStat.data.length > 0" class="text-answers-preview">
              <div v-for="(answer, aIdx) in qStat.data.slice(0, 5)" :key="aIdx" class="answer-preview-item">
                "{{ answer.text_answer }}" ({{ answer.count }})
              </div>
            </div>
            <div v-else class="no-data-mini"><p>Пока нет ответов</p></div>
          </div>
        </div>
        
        <div v-else class="no-stats"><p>Статистика появится после первых ответов</p></div>
        
        <button v-if="survey.allowRetake" @click="retakeSurvey" class="retake-btn">Пройти опрос заново</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useNotificationStore } from '@/store/notification';
import { useAuthStore } from '@/store/auth';
import { io, Socket } from 'socket.io-client';
import api from '@/services/api';

const route = useRoute();
const notificationStore = useNotificationStore();
const authStore = useAuthStore();

const loading = ref(true);
const error = ref('');
const requiresAuth = ref(false);
const alreadyTaken = ref(false);
const survey = ref<any>(null);
const answers = ref<any[]>([]);
const otherAnswers = ref<string[]>([]);
const errors = ref<string[]>([]);
const submitted = ref(false);
const submitting = ref(false);
const surveyStats = ref<any>(null);
const socket = ref<Socket>();

const answeredCount = computed(() => {
  if (!survey.value) return 0;
  return answers.value.filter((a, i) => {
    const q = survey.value.questions[i];
    if (!q || !q.required) return a !== undefined && a !== null && a !== '';
    if (Array.isArray(a)) return a.length > 0;
    return a !== undefined && a !== null && a !== '';
  }).length;
});

const progressPercent = computed(() => {
  if (!survey.value || survey.value.questions.length === 0) return 0;
  return Math.round((answeredCount.value / survey.value.questions.length) * 100);
});

const isValid = computed(() => {
  if (!survey.value) return false;
  return survey.value.questions.every((q: any, index: number) => {
    if (!q.required) return true;
    const answer = answers.value[index];
    if (answer === undefined || answer === null) return false;
    if (q.type === 'multiple_choice') return Array.isArray(answer) && answer.length > 0;
    if (q.type === 'single_choice' && answer === '__other__') return otherAnswers.value[index] && otherAnswers.value[index].trim().length > 0;
    return answer !== '';
  });
});

watch(() => authStore.isAuthenticated, (newVal) => {
  if (newVal && requiresAuth.value) {
    requiresAuth.value = false;
    loadSurvey();
  }
});

function getQuestionOptions(question: any): any[] {
  if (!question || !Array.isArray(question.options)) return [];
  return question.options.filter((opt: any) => getOptionText(opt) !== 'Другое' || !question.settings?.hasOther);
}

function getOptionText(option: any): string {
  if (!option) return '';
  if (typeof option === 'string') return option;
  return option.text || option.label || option.value || '';
}

function getOptionValue(option: any): string {
  if (!option) return '';
  if (typeof option === 'string') return option;
  return option.text || option.label || option.value || String(option.id || '');
}

function hasOtherOption(question: any): boolean {
  if (!question) return false;
  return question.settings?.hasOther || false;
}

function getLikertRange(question: any): number[] {
  if (!question) return [1, 2, 3, 4, 5];
  let min = 1, max = 5;
  if (question.settings?.likertScale) {
    min = question.settings.likertScale.min || 1;
    max = question.settings.likertScale.max || 5;
  }
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

function getLikertMinLabel(question: any): string {
  return question?.settings?.likertScale?.labels?.[0] || '';
}

function getLikertMaxLabel(question: any): string {
  return question?.settings?.likertScale?.labels?.[1] || '';
}

function getABVariants(question: any): string[] {
  if (!question) return ['', ''];
  if (question.settings?.abTest?.variants) return question.settings.abTest.variants;
  return ['', ''];
}

function isMultipleSelected(questionIndex: number, value: string): boolean {
  return Array.isArray(answers.value[questionIndex]) && answers.value[questionIndex].includes(value);
}

function toggleMultipleChoice(questionIndex: number, value: string) {
  if (!Array.isArray(answers.value[questionIndex])) answers.value[questionIndex] = [];
  const idx = answers.value[questionIndex].indexOf(value);
  if (idx > -1) answers.value[questionIndex].splice(idx, 1);
  else answers.value[questionIndex].push(value);
}

function validateAnswer(index: number, required: boolean) {
  if (!required) { errors.value[index] = ''; return; }
  const answer = answers.value[index];
  if (answer === undefined || answer === null || answer === '') errors.value[index] = 'Это обязательный вопрос';
  else if (Array.isArray(answer) && answer.length === 0) errors.value[index] = 'Выберите хотя бы один вариант';
  else errors.value[index] = '';
}

function getPercentFromData(count: number, data: any[]): number {
  if (!data || data.length === 0) return 0;
  const total = data.reduce((s: number, d: any) => s + (d.count || 0), 0);
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function initAnswers() {
  if (!survey.value) return;
  answers.value = survey.value.questions.map((q: any) => q.type === 'multiple_choice' ? [] : null);
  otherAnswers.value = new Array(survey.value.questions.length).fill('');
  errors.value = new Array(survey.value.questions.length).fill('');
}

function resetSurvey() {
  submitted.value = false;
  initAnswers();
}

function retakeSurvey() {
  submitted.value = false;
  initAnswers();
}

function connectToSurveyRoom() {
  if (!survey.value) return;
  
  if (socket.value) {
    socket.value.disconnect();
    socket.value = undefined;
  }
  
  socket.value = io('http://localhost:3000', { transports: ['websocket', 'polling'] });
  
  socket.value.on('connect', () => {
    socket.value?.emit('join-survey', survey.value.id.toString());
  });
  
  socket.value.on('survey-results', (data: any) => {
    if (data && data.questions) surveyStats.value = { ...data };
  });
}

async function loadSurveyStats() {
  try {
    const response = await api.get(`/surveys/${survey.value.id}/stats`);
    surveyStats.value = response.data;
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

async function loadSurvey() {
  const link = route.params.link as string;
  if (!link) { error.value = 'Не указана ссылка на опрос'; loading.value = false; return; }
  
  try {
    loading.value = true;
    error.value = '';
    requiresAuth.value = false;
    alreadyTaken.value = false;
    
    const response = await api.get(`/surveys/public/${link}`);
    survey.value = response.data;
    
    connectToSurveyRoom();
    
    if (!survey.value.allowRetake && authStore.isAuthenticated) {
      try {
        const takenResponse = await api.get('/surveys/taken');
        const alreadyTakenSurvey = takenResponse.data.surveys?.find((s: any) => s.id === survey.value.id);
        if (alreadyTakenSurvey) {
          alreadyTaken.value = true;
          submitted.value = true;
          await loadSurveyStats();
          return;
        }
      } catch (err) { /* ignore */ }
    }
    
    if (!alreadyTaken.value) initAnswers();
    
  } catch (err: any) {
    if (err.response?.status === 401) requiresAuth.value = true;
    else if (err.response?.status === 403 && err.response?.data?.alreadyTaken) {
      alreadyTaken.value = true;
      submitted.value = true;
      if (err.response.data.stats) surveyStats.value = err.response.data.stats;
      connectToSurveyRoom();
    } else error.value = err.response?.data?.error || 'Опрос не найден';
  } finally {
    loading.value = false;
  }
}

async function submitSurvey() {
  if (!isValid.value || submitting.value) return;
  
  let hasErrors = false;
  survey.value.questions.forEach((q: any, i: number) => { validateAnswer(i, q.required); if (errors.value[i]) hasErrors = true; });
  if (hasErrors) return;
  
  submitting.value = true;
  
  try {
    const formattedAnswers = survey.value.questions.map((q: any, index: number) => {
      const answer = answers.value[index];
      const fa: any = { questionId: q.id };
      
      if (q.type === 'text') { fa.optionId = null; fa.textAnswer = answer || ''; }
      else if (q.type === 'single_choice') {
        if (answer === '__other__') { fa.optionId = null; fa.textAnswer = otherAnswers.value[index] || 'Другое'; }
        else {
          const opt = q.options?.find((o: any) => getOptionValue(o) === answer);
          fa.optionId = opt?.id || null; fa.textAnswer = null;
        }
      }
      else if (q.type === 'multiple_choice') { fa.optionId = null; fa.textAnswer = Array.isArray(answer) ? answer.join('; ') : (answer || ''); }
      else if (q.type === 'likert_scale') {
        const s = String(answer || '');
        const opt = q.options?.find((o: any) => getOptionText(o) === s);
        fa.optionId = opt?.id || null; fa.textAnswer = s;
      }
      else if (q.type === 'ab_test') {
        const opt = q.options?.find((o: any) => getOptionText(o) === answer);
        fa.optionId = opt?.id || null; fa.textAnswer = answer || null;
      }
      else { fa.optionId = null; fa.textAnswer = String(answer || ''); }
      
      return fa;
    });
    
    let respondentId = localStorage.getItem('respondentId');
    if (!respondentId) { respondentId = 'resp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); localStorage.setItem('respondentId', respondentId); }
    
    const response = await api.post(`/surveys/${survey.value.id}/respond`, { answers: formattedAnswers, respondentId });
    
    submitted.value = true;
    if (response.data.stats) surveyStats.value = response.data.stats;
    notificationStore.success('Успешно', 'Ваши ответы отправлены!');
    
  } catch (err: any) {
    if (err.response?.data?.alreadyTaken) {
      submitted.value = true;
      if (err.response.data.stats) surveyStats.value = err.response.data.stats;
      notificationStore.warning('Внимание', 'Вы уже прошли этот опрос');
    } else if (err.response?.status === 401) {
      notificationStore.error('Ошибка', 'Требуется авторизация');
      requiresAuth.value = true;
    } else notificationStore.error('Ошибка', err.response?.data?.error || 'Не удалось отправить ответы');
  } finally {
    submitting.value = false;
  }
}

onMounted(() => loadSurvey());
onUnmounted(() => { if (socket.value) socket.value.disconnect(); });
</script>

<style lang="scss" scoped>
.survey-view { min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; }
.loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; color: white; }
.spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid white; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 16px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.auth-required-container, .already-taken-container, .error-container { max-width: 500px; margin: 100px auto; }
.auth-required-card, .already-taken-card, .error-card { background: white; border-radius: 12px; padding: 40px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
.auth-icon, .taken-icon, .error-icon { font-size: 64px; margin-bottom: 20px; }
.auth-actions { display: flex; gap: 12px; justify-content: center; margin-top: 20px; }

.survey-container { max-width: 700px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden; }
.survey-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
.survey-header h1 { font-size: 28px; margin-bottom: 12px; }
.survey-description { font-size: 16px; opacity: 0.9; }
.survey-progress { margin-top: 20px; }
.progress-bar { height: 6px; background: rgba(255,255,255,0.3); border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: white; border-radius: 3px; transition: width 0.3s; }
.progress-text { font-size: 13px; margin-top: 8px; opacity: 0.8; }

.questions-container { padding: 30px; }
.question-card { background: #fafafa; border-radius: 12px; padding: 24px; margin-bottom: 20px; }
.question-header { margin-bottom: 20px; }
.question-header h3 { font-size: 18px; color: #333; }
.required { color: #e74c3c; margin-left: 4px; }
.question-description { font-size: 14px; color: #888; margin-top: 8px; }

.option-item { display: flex; align-items: center; padding: 12px 16px; margin-bottom: 8px; background: white; border: 2px solid #e8e8e8; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.option-item:hover { border-color: #667eea; background: #f8f9ff; }
.option-item.selected { border-color: #667eea; background: #f0f3ff; }
.option-radio, .option-checkbox { width: 22px; height: 22px; border: 2px solid #ccc; border-radius: 50%; margin-right: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.option-radio.checked, .option-checkbox.checked { border-color: #667eea; background: #667eea; }
.radio-inner { width: 10px; height: 10px; background: white; border-radius: 50%; }
.option-checkbox { border-radius: 4px; }
.option-checkbox span { color: white; font-size: 14px; font-weight: bold; }
.option-text { flex: 1; font-size: 15px; color: #333; }
.other-input { margin-left: 12px; padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; flex: 1; }

.text-area { width: 100%; padding: 12px 16px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 15px; resize: vertical; min-height: 100px; font-family: inherit; }
.text-area:focus { outline: none; border-color: #667eea; }
.char-counter { text-align: right; font-size: 12px; color: #aaa; margin-top: 4px; }

.likert-scale .scale-container { display: flex; gap: 8px; margin-bottom: 8px; }
.scale-item { flex: 1; padding: 12px; text-align: center; background: white; border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-weight: 500; }
.scale-item:hover { border-color: #667eea; background: #f8f9ff; }
.scale-item.selected { background: #667eea; color: white; border-color: #667eea; }
.scale-labels { display: flex; justify-content: space-between; font-size: 12px; color: #888; padding: 0 4px; }

.ab-variants { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.variant-card { padding: 20px; border: 2px solid #e0e0e0; border-radius: 10px; cursor: pointer; transition: all 0.3s; text-align: center; background: white; }
.variant-card:hover { border-color: #667eea; }
.variant-card.selected { border-color: #667eea; background: #f0f3ff; }
.variant-label { font-size: 24px; font-weight: 700; color: #667eea; margin-bottom: 12px; }
.variant-content { font-size: 14px; color: #555; }

.error-message { margin-top: 12px; padding: 10px 16px; background: #fef2f2; color: #dc2626; border-radius: 6px; font-size: 13px; }

.survey-actions { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
.submit-btn { padding: 12px 40px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 500; cursor: pointer; }
.submit-btn:hover:not(:disabled) { background: #5a6fd6; }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.reset-btn { padding: 10px 20px; background: none; border: none; color: #888; cursor: pointer; }
.retake-btn { padding: 12px 32px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; margin-top: 20px; }

.submitted-message { padding: 60px 30px; text-align: center; }
.success-icon { width: 80px; height: 80px; background: #27ae60; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px; margin: 0 auto 24px; }

.results-preview { text-align: left; background: #f8f9fa; border-radius: 12px; padding: 24px; margin: 24px auto; max-width: 600px; }
.results-preview h3 { text-align: center; margin-bottom: 8px; }
.live-note { text-align: center; font-size: 13px; color: #27ae60; margin-bottom: 20px; }
.mini-stats { display: flex; gap: 16px; margin-bottom: 24px; }
.mini-stat { flex: 1; text-align: center; padding: 12px; background: white; border-radius: 8px; }
.mini-stat-value { display: block; font-size: 24px; font-weight: 700; color: #667eea; }
.mini-stat-label { font-size: 12px; color: #888; }
.question-stat { background: white; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
.question-stat h5 { margin: 0 0 12px 0; font-size: 14px; }
.chart-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.chart-label { width: 100px; font-size: 12px; color: #666; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chart-bar-container { flex: 1; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden; }
.chart-bar { height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); border-radius: 10px; transition: width 0.5s ease; min-width: 2px; }
.chart-value { width: 30px; font-size: 12px; font-weight: 600; color: #333; text-align: center; }
.text-answers-preview .answer-preview-item { padding: 6px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #555; font-style: italic; }
.no-data-mini, .no-stats { text-align: center; color: #999; padding: 20px; }

.btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; text-decoration: none; }
.btn-primary { background: #667eea; color: white; }
.btn-secondary { background: #f0f0f0; color: #555; }

@media (max-width: 768px) {
  .survey-view { padding: 20px 10px; }
  .survey-header { padding: 30px 20px; }
  .survey-header h1 { font-size: 24px; }
  .questions-container { padding: 20px; }
  .ab-variants { grid-template-columns: 1fr; }
  .mini-stats { flex-direction: column; }
}
</style>