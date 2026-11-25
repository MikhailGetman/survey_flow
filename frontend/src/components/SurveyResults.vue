
<template>
  <div class="results-page">
    <LoadingSpinner v-if="loading" fullscreen message="Загрузка результатов..." />

    <div v-else-if="error" class="error-container">
      <div class="error-card">
        <div class="error-icon">⚠️</div>
        <h2>Ошибка загрузки</h2>
        <p>{{ error }}</p>
        <button @click="loadResults" class="btn btn-primary">Попробовать снова</button>
      </div>
    </div>

    <div v-else-if="results" class="results-content">
      
      <div class="results-header">
        <div class="header-info">
          <h1>{{ results.survey?.title || 'Результаты опроса' }}</h1>
          <p class="survey-description">{{ results.survey?.description }}</p>
        </div>
        <div class="header-actions">
          <button @click="exportToPDF" class="btn btn-primary">PDF</button>
          <button @click="exportToSPSS" class="btn btn-secondary">SPSS</button>
        </div>
      </div>

      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ results.totalResponses || 0 }}</div>
          <div class="stat-label">Всего ответов</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ results.completionRate || 0 }}%</div>
          <div class="stat-label">Завершенность</div>
        </div>

        <div class="stat-card">
          <div class="stat-value">{{ questionsList.length }}</div>
          <div class="stat-label">Вопросов</div>
        </div>
      </div>

      
      <div class="questions-results">
        <h3>Результаты по вопросам</h3>
        
        <div 
          v-for="(question, qIndex) in questionsList" 
          :key="question.questionId || qIndex"
          class="question-result-card"
        >
          <div class="question-header">
            <h4>{{ qIndex + 1 }}. {{ question.questionTitle }}</h4>
            <span class="question-type-badge">{{ getTypeLabel(question.type) }}</span>
          </div>

          
          <div v-if="question.type !== 'text' && question.data && question.data.length > 0">
            
            
            <div class="chart-controls">
              <button 
                @click="chartModes[question.questionId] = 'bar'"
                :class="{ active: getChartMode(question.questionId) === 'bar' }"
                class="btn btn-sm"
              >Столбчатая</button>
              <button 
                @click="chartModes[question.questionId] = 'pie'"
                :class="{ active: getChartMode(question.questionId) === 'pie' }"
                class="btn btn-sm"
              >Круговая</button>
            </div>

            
            <div v-if="getChartMode(question.questionId) === 'bar'" class="bar-chart">
              <div 
                v-for="(item, i) in question.data" 
                :key="i"
                class="bar-item"
              >
                <div class="bar-label">{{ item.text }}</div>
                <div class="bar-track">
                  <div 
                    class="bar-fill"
                    :style="{ 
                      width: getBarWidth(item.count, question.data) + '%',
                      backgroundColor: barColors[i % barColors.length]
                    }"
                  >
                    <span class="bar-value" v-if="getBarWidth(item.count, question.data) > 15">
                      {{ item.count }}
                    </span>
                  </div>
                  <span class="bar-value-outside" v-if="getBarWidth(item.count, question.data) <= 15">
                    {{ item.count }}
                  </span>
                </div>
                <div class="bar-percent">{{ getPercentage(item.count, question.data) }}%</div>
              </div>
            </div>

            
            <div v-else class="pie-chart-wrapper">
              <svg viewBox="0 0 200 200" class="pie-chart">
                <circle 
                  v-for="(slice, i) in getPieSlices(question.data)" 
                  :key="i"
                  cx="100" cy="100" r="80"
                  fill="none"
                  :stroke="barColors[i % barColors.length]"
                  stroke-width="40"
                  :stroke-dasharray="slice.dashArray"
                  :stroke-dashoffset="slice.dashOffset"
                  transform="rotate(-90 100 100)"
                  class="pie-slice"
                >
                  <title>{{ question.data[i]?.text }}: {{ question.data[i]?.count }}</title>
                </circle>
                <text x="100" y="95" text-anchor="middle" class="pie-total" font-size="16" font-weight="bold" fill="#333">
                  {{ getTotal(question.data) }}
                </text>
                <text x="100" y="115" text-anchor="middle" font-size="11" fill="#888">всего</text>
              </svg>
              <div class="pie-legend">
                <div 
                  v-for="(item, i) in question.data" 
                  :key="i"
                  class="legend-item"
                >
                  <span class="legend-color" :style="{ backgroundColor: barColors[i % barColors.length] }"></span>
                  <span class="legend-text">{{ item.text }}</span>
                  <span class="legend-value">{{ item.count }} ({{ getPercentage(item.count, question.data) }}%)</span>
                </div>
              </div>
            </div>

            
            <div class="results-table">
              <table>
                <thead>
                  <tr>
                    <th>Вариант</th>
                    <th>Кол-во</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, i) in question.data" :key="i">
                    <td>{{ item.text }}</td>
                    <td>{{ item.count }}</td>
                    <td>{{ getPercentage(item.count, question.data) }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            
            <div v-if="question.type === 'likert_scale'" class="stats-extra">
              <div class="stat-row"><span>Среднее:</span><strong>{{ calcLikertStats(question).mean }}</strong></div>
              <div class="stat-row"><span>Медиана:</span><strong>{{ calcLikertStats(question).median }}</strong></div>
              <div class="stat-row"><span>Стд. откл.:</span><strong>{{ calcLikertStats(question).stdDev }}</strong></div>
            </div>
          </div>

          
          <div v-else-if="question.type === 'text' && question.data && question.data.length > 0" class="text-answers">
            <div v-for="(answer, aIdx) in question.data.slice(0, 10)" :key="aIdx" class="answer-item">
              <span class="answer-text">"{{ answer.text_answer }}"</span>
              <span class="answer-count">{{ answer.count }}</span>
            </div>
          </div>

          
          <div v-else class="no-data">
            <p>Нет данных для отображения</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { io, Socket } from 'socket.io-client';
import { useNotificationStore } from '@/store/notification';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import api from '@/services/api';

const route = useRoute();
const notificationStore = useNotificationStore();

const loading = ref(true);
const error = ref('');
const results = ref<any>(null);
const socket = ref<Socket>();


const chartModes = reactive<Record<number, string>>({});


const barColors = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
  '#9966FF', '#FF9F40', '#7CB342', '#5C6BC0',
  '#FF9A9E', '#A18CD1'
];

const questionsList = computed(() => {
  if (!results.value?.questions) return [];
  if (Array.isArray(results.value.questions)) return results.value.questions;
  return [];
});

onMounted(async () => {
  await loadResults();
  connectWebSocket();
});

onUnmounted(() => {
  socket.value?.disconnect();
});

function getChartMode(questionId: number): string {
  return chartModes[questionId] || 'bar';
}

async function loadResults() {
  try {
    loading.value = true;
    error.value = '';
    const surveyId = route.params.id as string;
    
    const response = await api.get(`/surveys/${surveyId}/results`);
    results.value = response.data;
    
    
    questionsList.value.forEach((q: any) => {
      if (q.type !== 'text' && !chartModes[q.questionId]) {
        chartModes[q.questionId] = 'bar';
      }
    });
    
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Ошибка загрузки';
  } finally {
    loading.value = false;
  }
}

function connectWebSocket() {
  const surveyId = route.params.id as string;
  if (!surveyId) return;
  
  socket.value = io('http://localhost:3000', { transports: ['websocket', 'polling'] });
  socket.value.on('connect', () => socket.value?.emit('join-survey', surveyId));
  socket.value.on('survey-results', (data: any) => {
    if (data?.questions) results.value = { ...results.value, ...data };
  });
}

function getBarWidth(count: number, data: any[]): number {
  const max = Math.max(...data.map(d => d.count || 0), 1);
  return Math.round((count / max) * 100);
}

function getPercentage(count: number, data: any[]): string {
  const total = data.reduce((s: number, d: any) => s + (d.count || 0), 0);
  return total > 0 ? ((count / total) * 100).toFixed(1) : '0';
}

function getTotal(data: any[]): number {
  return data.reduce((s: number, d: any) => s + (d.count || 0), 0);
}

function getPieSlices(data: any[]) {
  const total = getTotal(data);
  if (total === 0) return [];
  
  let cumulativePercent = 0;
  const circumference = 2 * Math.PI * 80; 
  
  return data.map((item) => {
    const percent = item.count / total;
    const dashLength = circumference * percent;
    const dashOffset = circumference * cumulativePercent;
    cumulativePercent += percent;
    
    return {
      dashArray: `${dashLength} ${circumference - dashLength}`,
      dashOffset: -dashOffset
    };
  });
}

function calcLikertStats(question: any) {
  const values: number[] = [];
  question.data?.forEach((d: any) => {
    const val = parseInt(d.text);
    if (!isNaN(val)) {
      for (let i = 0; i < (d.count || 0); i++) values.push(val);
    }
  });
  
  if (!values.length) return { mean: '-', median: '-', stdDev: '-' };
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid-1] + sorted[mid]) / 2;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  
  return {
    mean: mean.toFixed(2),
    median: median.toFixed(2),
    stdDev: Math.sqrt(variance).toFixed(2)
  };
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'single_choice': 'Одиночный выбор',
    'multiple_choice': 'Множ. выбор',
    'text': 'Текст',
    'likert_scale': 'Шкала Лайкерта',
    'ab_test': 'A/B тест'
  };
  return labels[type] || type;
}

async function exportToPDF() {
  try {
    const response = await api.get(`/surveys/${route.params.id}/export?format=pdf`, { responseType: 'blob' });
    window.open(URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' })), '_blank');
    notificationStore.success("Успешно", 'PDF открыт');
  } catch (err) {
    notificationStore.error("Ошибка", 'Ошибка экспорта');
  }
}

async function exportToSPSS() {
  try {
    const response = await api.get(`/surveys/${route.params.id}/export?format=spss`, { responseType: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
    a.download = `survey-${route.params.id}.csv`;
    a.click();
    notificationStore.success("Успешно", 'Файл скачан');
  } catch (err) {
    notificationStore.error("Ошибка", 'Ошибка экспорта');
  }
}
</script>

<style lang="scss" scoped>
.results-page { max-width: 1200px; margin: 0 auto; padding: 20px; }

.results-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  background: white; padding: 24px; border-radius: 12px;
  margin-bottom: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  h1 { font-size: 24px; margin: 0 0 8px 0; }
  .header-actions { display: flex; gap: 8px; }
}

.stats-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px; margin-bottom: 24px;
  .stat-card {
    background: white; padding: 20px; border-radius: 10px;
    text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    .stat-value { font-size: 28px; font-weight: 700; color: #667eea; }
    .stat-label { color: #666; font-size: 13px; margin-top: 4px; }
  }
}

.questions-results {
  h3 { margin-bottom: 16px; }
  .question-result-card {
    background: white; padding: 24px; border-radius: 12px;
    margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    
    .question-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 16px;
      h4 { margin: 0; }
      .question-type-badge {
        background: #e8eaf6; color: #667eea; padding: 4px 12px;
        border-radius: 12px; font-size: 12px;
      }
    }
    
    .chart-controls {
      display: flex; gap: 8px; margin-bottom: 20px;
      .btn-sm {
        padding: 6px 14px; border: 1px solid #ddd; background: white;
        border-radius: 6px; cursor: pointer; font-size: 13px;
        &.active { background: #667eea; color: white; border-color: #667eea; }
        &:hover:not(.active) { background: #f5f5f5; }
      }
    }
    
    
    .bar-chart {
      margin-bottom: 20px;
      .bar-item {
        display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
        .bar-label {
          width: 130px; text-align: right; font-size: 13px; color: #555;
          flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .bar-track {
          flex: 1; height: 28px; background: #f0f0f0; border-radius: 14px;
          position: relative; overflow: visible;
          .bar-fill {
            height: 100%; border-radius: 14px; display: flex;
            align-items: center; justify-content: flex-end; padding-right: 8px;
            transition: width 0.6s ease; min-width: 4px;
            .bar-value { color: white; font-size: 12px; font-weight: 600; }
          }
          .bar-value-outside {
            position: absolute; left: calc(100% + 8px); top: 50%;
            transform: translateY(-50%); font-size: 12px; font-weight: 600; color: #333;
          }
        }
        .bar-percent { width: 50px; text-align: right; font-size: 13px; color: #888; }
      }
    }
    
    
    .pie-chart-wrapper {
      display: flex; align-items: center; gap: 30px; margin-bottom: 20px;
      flex-wrap: wrap;
      .pie-chart {
        width: 200px; height: 200px; flex-shrink: 0;
        .pie-slice { transition: all 0.3s; cursor: pointer; }
      }
      .pie-legend {
        flex: 1; min-width: 200px;
        .legend-item {
          display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
          font-size: 13px;
          .legend-color {
            width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0;
          }
          .legend-text { flex: 1; color: #555; }
          .legend-value { color: #333; font-weight: 500; }
        }
      }
    }
    
    .results-table {
      overflow-x: auto;
      table { width: 100%; border-collapse: collapse;
        th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #eee; font-size: 13px; }
        th { font-weight: 600; color: #555; background: #f8f9fa; }
      }
    }
    
    .stats-extra {
      display: flex; gap: 24px; margin-top: 16px;
      padding: 12px 16px; background: #f8f9fa; border-radius: 8px;
      .stat-row { font-size: 13px; span { color: #666; } strong { margin-left: 8px; } }
    }
    
    .text-answers .answer-item {
      display: flex; justify-content: space-between; padding: 10px 0;
      border-bottom: 1px solid #f0f0f0; font-size: 14px;
      .answer-text { color: #333; font-style: italic; }
      .answer-count {
        background: #667eea; color: white; padding: 2px 10px;
        border-radius: 12px; font-size: 12px;
      }
    }
    
    .no-data { padding: 40px; text-align: center; color: #999; }
  }
}

.btn {
  padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px;
  cursor: pointer; display: inline-flex; align-items: center; gap: 8px;
  &-primary { background: #667eea; color: white; &:hover { background: #5a6fd6; } }
  &-secondary { background: #f0f0f0; color: #555; &:hover { background: #e0e0e0; } }
}

.error-card {
  text-align: center; padding: 60px; background: white; border-radius: 12px;
  max-width: 500px; margin: 100px auto;
  .error-icon { font-size: 64px; }
}

@media (max-width: 768px) {
  .results-page { padding: 10px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .bar-chart .bar-item .bar-label { width: 80px; font-size: 11px; }
  .pie-chart-wrapper { flex-direction: column; align-items: center; }
}
</style>