
<template>
  <div class="survey-builder-page">
    <div class="builder-header">
      <h1>{{ isEditing ? 'Редактирование опроса' : 'Новый опрос' }}</h1>
      <div class="builder-actions">
        <button @click="previewSurvey" class="btn btn-secondary" type="button">
          Предпросмотр
        </button>
        <button @click="saveDraft" class="btn btn-secondary" type="button">
          Сохранить
        </button>
        <button @click="publishSurvey" class="btn btn-primary" type="button">
          Опубликовать
        </button>
      </div>
    </div>

    <div class="survey-builder">
      
      <div class="survey-header">
        <input 
          v-model="survey.title" 
          class="title-input"
          placeholder="Название опроса"
          type="text"
        />
        <textarea 
          v-model="survey.description" 
          class="description-input"
          placeholder="Описание опроса (необязательно)"
          rows="3"
        ></textarea>
      </div>

      
      <div class="survey-settings">
        <label>
          <input type="checkbox" v-model="survey.isAnonymous" />
          Анонимный опрос
        </label>
        <label>
          <input type="checkbox" v-model="survey.allowRetake" />
          Разрешить повторное прохождение
        </label>
      </div>

      
      <div class="questions-section">
        <div 
          v-for="(question, index) in survey.questions" 
          :key="question.id"
          class="question-wrapper"
        >
          <div class="question-card">
            
            <div class="question-header">
              <div class="question-move-buttons">
                <button 
                  @click="moveQuestionUp(index)" 
                  :disabled="index === 0"
                  class="move-btn"
                  type="button"
                  title="Переместить вверх"
                >▲</button>
                <button 
                  @click="moveQuestionDown(index)" 
                  :disabled="index === survey.questions.length - 1"
                  class="move-btn"
                  type="button"
                  title="Переместить вниз"
                >▼</button>
              </div>
              
              <span class="question-number">{{ index + 1 }}</span>
              
              <select v-model="question.type" class="question-type">
                <option value="single_choice">Одиночный выбор</option>
                <option value="multiple_choice">Множественный выбор</option>
                <option value="text">Текстовый ответ</option>
                <option value="likert_scale">Шкала Лайкерта</option>
                <option value="ab_test">A/B тест</option>
              </select>

              <div class="question-actions">
                <button 
                  @click="duplicateQuestion(index)" 
                  class="action-btn copy-btn"
                  type="button"
                  title="Дублировать вопрос"
                >📋</button>
                <button 
                  @click="removeQuestion(index)" 
                  class="action-btn delete-btn"
                  type="button"
                  title="Удалить вопрос"
                >✕</button>
              </div>
            </div>

            
            <input 
              v-model="question.title" 
              class="question-title-input"
              placeholder="Текст вопроса"
              type="text"
            />

            
            <input 
              v-model="question.description" 
              class="question-description-input"
              placeholder="Описание (необязательно)"
              type="text"
            />

            
            <div class="required-toggle">
              <label>
                <input type="checkbox" v-model="question.required" />
                Обязательный вопрос
              </label>
            </div>

            
            <div v-if="!['text', 'likert_scale', 'ab_test'].includes(question.type)" class="options-section">
              <div class="options-label">Варианты ответов:</div>
              
              <div 
                v-for="(option, optIndex) in question.options" 
                :key="option.id"
                class="option-item"
              >
                <div class="option-move-buttons">
                  <button 
                    @click="moveOptionUp(question, optIndex)" 
                    :disabled="optIndex === 0"
                    class="move-btn-small"
                    type="button"
                    title="Переместить вверх"
                  >▲</button>
                  <button 
                    @click="moveOptionDown(question, optIndex)" 
                    :disabled="optIndex === question.options.length - 1"
                    class="move-btn-small"
                    type="button"
                    title="Переместить вниз"
                  >▼</button>
                </div>
                
                <span class="option-type-indicator" :class="question.type === 'multiple_choice' ? 'checkbox' : 'radio'"></span>
                
                <input 
                  v-model="option.text"
                  :placeholder="`Вариант ${optIndex + 1}`"
                  class="option-input"
                  type="text"
                />
                
                <button 
                  @click="removeOption(question, optIndex)"
                  class="remove-option-btn"
                  :disabled="question.options.length <= 2"
                  type="button"
                  title="Удалить вариант"
                >✕</button>
              </div>

              <button @click="addOption(question)" class="add-option-btn" type="button">
                + Добавить вариант
              </button>

              
              <div class="other-option">
                <label>
                  <input type="checkbox" v-model="question.hasOther" />
                  Добавить вариант "Другое"
                </label>
              </div>
            </div>

            
            <div v-if="question.type === 'likert_scale'" class="likert-settings">
              <h5>Настройки шкалы</h5>
              <div class="scale-range">
                <div class="range-input">
                  <label>Минимум</label>
                  <input 
                    type="number" 
                    v-model.number="question.likertMin" 
                    :min="1"
                    :max="question.likertMax - 1"
                  />
                </div>
                <div class="range-input">
                  <label>Максимум</label>
                  <input 
                    type="number" 
                    v-model.number="question.likertMax" 
                    :min="question.likertMin + 1"
                    :max="10"
                  />
                </div>
              </div>
              <div class="scale-labels">
                <input 
                  v-model="question.likertLabelMin" 
                  placeholder="Метка минимума"
                  type="text"
                />
                <input 
                  v-model="question.likertLabelMax" 
                  placeholder="Метка максимума"
                  type="text"
                />
              </div>
            </div>

            
            <div v-if="question.type === 'ab_test'" class="ab-test-settings">
              <h5>Варианты A/B теста</h5>
              <div 
                v-for="(variant, vIndex) in question.abVariants" 
                :key="vIndex"
                class="variant-card"
              >
                <div class="variant-header">
                  <span class="variant-label">Вариант {{ String.fromCharCode(65 + vIndex) }}</span>
                  <button 
                    @click="removeABVariant(question, vIndex)"
                    :disabled="question.abVariants.length <= 2"
                    type="button"
                  >✕</button>
                </div>
                <textarea 
                  v-model="question.abVariants[vIndex]"
                  :placeholder="`Текст варианта ${String.fromCharCode(65 + vIndex)}`"
                  rows="3"
                ></textarea>
              </div>
              <button @click="addABVariant(question)" class="add-variant-btn" type="button">
                + Добавить вариант
              </button>
            </div>
          </div>
        </div>

        
        <div class="add-question-section">
          <button @click="addQuestion" class="add-question-btn" type="button">
            + Добавить вопрос
          </button>
        </div>
      </div>
    </div>

    
    <SurveyModal v-model="showPreview" title="Предпросмотр опроса" size="large">
      <div class="survey-preview-modal">
        <div class="preview-container">
          <div class="preview-header">
            <h2>{{ survey.title || 'Без названия' }}</h2>
            <p>{{ survey.description }}</p>
          </div>

          <div 
            v-for="(question, index) in survey.questions" 
            :key="question.id"
            class="preview-question"
          >
            <h4>
              {{ index + 1 }}. {{ question.title || 'Без названия' }}
              <span v-if="question.required" class="required-mark">*</span>
            </h4>
            
            
            <div v-if="question.type === 'single_choice'" class="preview-options">
              <div 
                v-for="(option, optIndex) in question.options" 
                :key="option.id"
                class="preview-option"
              >
                <input type="radio" :name="`preview-${question.id}`" disabled />
                <span>{{ option.text || `Вариант ${optIndex + 1}` }}</span>
              </div>
              <div v-if="question.hasOther" class="preview-option">
                <input type="radio" disabled />
                <span>Другое</span>
              </div>
            </div>

            
            <div v-if="question.type === 'multiple_choice'" class="preview-options">
              <div 
                v-for="(option, optIndex) in question.options" 
                :key="option.id"
                class="preview-option"
              >
                <input type="checkbox" disabled />
                <span>{{ option.text || `Вариант ${optIndex + 1}` }}</span>
              </div>
              <div v-if="question.hasOther" class="preview-option">
                <input type="checkbox" disabled />
                <span>Другое</span>
              </div>
            </div>

            
            <div v-if="question.type === 'text'">
              <textarea 
                disabled 
                placeholder="Текстовый ответ..."
                rows="3"
                class="preview-textarea"
              ></textarea>
            </div>

            
            <div v-if="question.type === 'likert_scale'" class="preview-likert">
              <div class="likert-scale-preview">
                <div 
                  v-for="n in (question.likertMax - question.likertMin + 1)" 
                  :key="n"
                  class="likert-point"
                >
                  {{ question.likertMin + n - 1 }}
                </div>
              </div>
              <div class="likert-labels-preview">
                <span>{{ question.likertLabelMin || 'Мин' }}</span>
                <span>{{ question.likertLabelMax || 'Макс' }}</span>
              </div>
            </div>

            
            <div v-if="question.type === 'ab_test'" class="preview-abtest">
              <div class="ab-variants-preview">
                <div 
                  v-for="(variant, vIndex) in question.abVariants" 
                  :key="vIndex"
                  class="ab-variant-preview"
                >
                  <div class="ab-variant-label">Вариант {{ String.fromCharCode(65 + vIndex) }}</div>
                  <div class="ab-variant-text">{{ variant || 'Пусто' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <button @click="showPreview = false" class="btn btn-secondary">Закрыть</button>
      </template>
    </SurveyModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotificationStore } from '@/store/notification';
import SurveyModal from '@/components/SurveyModal.vue';
import api from '@/services/api';

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  type: string;
  title: string;
  description: string;
  required: boolean;
  options: Option[];
  hasOther: boolean;
  likertMin: number;
  likertMax: number;
  likertLabelMin: string;
  likertLabelMax: string;
  abVariants: string[];
}

interface Survey {
  title: string;
  description: string;
  isAnonymous: boolean;
  allowRetake: boolean;
  questions: Question[];
}

const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();

const isEditing = ref(false);
const showPreview = ref(false);
const saving = ref(false);

const survey = reactive<Survey>({
  title: '',
  description: '',
  isAnonymous: false,
  allowRetake: false,
  questions: []
});


function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}


function createNewQuestion(type = 'single_choice'): Question {
  return {
    id: generateId(),
    type,
    title: '',
    description: '',
    required: false,
    options: [
      { id: generateId(), text: '' },
      { id: generateId(), text: '' }
    ],
    hasOther: false,
    likertMin: 1,
    likertMax: 5,
    likertLabelMin: '',
    likertLabelMax: '',
    abVariants: ['', '']
  };
}


function moveQuestionUp(index: number) {
  if (index > 0) {
    const temp = survey.questions[index];
    survey.questions[index] = survey.questions[index - 1];
    survey.questions[index - 1] = temp;
  }
}

function moveQuestionDown(index: number) {
  if (index < survey.questions.length - 1) {
    const temp = survey.questions[index];
    survey.questions[index] = survey.questions[index + 1];
    survey.questions[index + 1] = temp;
  }
}


function moveOptionUp(question: Question, index: number) {
  if (index > 0) {
    const temp = question.options[index];
    question.options[index] = question.options[index - 1];
    question.options[index - 1] = temp;
  }
}

function moveOptionDown(question: Question, index: number) {
  if (index < question.options.length - 1) {
    const temp = question.options[index];
    question.options[index] = question.options[index + 1];
    question.options[index + 1] = temp;
  }
}


function addQuestion() {
  survey.questions.push(createNewQuestion());
}

function removeQuestion(index: number) {
  if (confirm('Вы уверены, что хотите удалить этот вопрос?')) {
    survey.questions.splice(index, 1);
  }
}

function duplicateQuestion(index: number) {
  const original = JSON.parse(JSON.stringify(survey.questions[index]));
  original.id = generateId();
  original.options.forEach((opt: Option) => {
    opt.id = generateId();
  });
  survey.questions.splice(index + 1, 0, original);
}


function addOption(question: Question) {
  question.options.push({ id: generateId(), text: '' });
}

function removeOption(question: Question, index: number) {
  if (question.options.length > 2) {
    question.options.splice(index, 1);
  }
}


function addABVariant(question: Question) {
  question.abVariants.push('');
}

function removeABVariant(question: Question, index: number) {
  if (question.abVariants.length > 2) {
    question.abVariants.splice(index, 1);
  }
}


async function saveDraft() {
  await saveSurvey('draft');
}

async function publishSurvey() {
  await saveSurvey('active');
}


async function saveSurvey(status = 'draft') {
  if (!survey.title.trim()) {
    alert('Внимание: Укажите название опроса');
    return;
  }

  if (survey.questions.length === 0) {
    alert('Внимание: Добавьте хотя бы один вопрос');
    return;
  }

  
  const emptyQuestions = survey.questions.filter(q => !q.title.trim());
  if (emptyQuestions.length > 0) {
    alert('Внимание: У всех вопросов должен быть текст');
    return;
  }

  saving.value = true;

  try {
    const surveyData = {
      title: survey.title,
      description: survey.description,
      isAnonymous: survey.isAnonymous,
      allowRetake: survey.allowRetake,
      status: status,
      questions: survey.questions.map((q, index) => {
        const questionData: any = {
          type: q.type,
          title: q.title,
          description: q.description,
          required: q.required,
          orderIndex: index,
          settings: {}
        };

        
        if (q.type !== 'text') {
          questionData.options = q.options.map(opt => opt.text || '');
          
          if (q.hasOther) {
            questionData.settings.hasOther = true;
          }
        }

        
        if (q.type === 'likert_scale') {
          questionData.settings.likertScale = {
            min: q.likertMin || 1,
            max: q.likertMax || 5,
            labels: [q.likertLabelMin || '', q.likertLabelMax || '']
          };
        }

        
        if (q.type === 'ab_test') {
          questionData.settings.abTest = {
            variants: q.abVariants.filter(v => v.trim() !== '')
          };
        }

        return questionData;
      })
    };

    console.log('Saving survey data:', surveyData); 

    let response;
    if (isEditing.value) {
      const surveyId = route.params.id;
      console.log('Updating survey:', surveyId);
      response = await api.put(`/surveys/${surveyId}`, surveyData);
    } else {
      console.log('Creating new survey');
      response = await api.post('/surveys', surveyData);
    }

    console.log('Save response:', response.data);

    alert(
      'Успешно!'
    );
    
    if (!isEditing.value && response.data.id) {
      isEditing.value = true;
      router.push(`/builder/${response.data.id}`);
    }
  } catch (error: any) {
    console.error('Save error:', error);
    console.error('Error response:', error.response?.data);
    alert(
      'Ошибка: ' +  
      error.response?.data?.error || error.message || 'Не удалось сохранить опрос'
    );
  } finally {
    saving.value = false;
  }
}


function previewSurvey() {
  showPreview.value = true;
}



async function loadSurvey() {
  const surveyId = route.params.id;
  if (!surveyId) {
    
    if (survey.questions.length === 0) {
      addQuestion();
    }
    return;
  }

  isEditing.value = true;

  try {
    console.log('Loading survey:', surveyId);
    
    
    let response;
    try {
      response = await api.get(`/surveys/public/${surveyId}`);
    } catch (err) {
      
      response = await api.get(`/surveys/${surveyId}`);
    }
    
    const data = response.data;
    console.log('Loaded survey data:', data);

    survey.title = data.title || '';
    survey.description = data.description || '';
    survey.isAnonymous = data.isAnonymous || data.is_anonymous || false;
    survey.allowRetake = data.allowRetake || data.allow_retake || false;

    if (data.questions && data.questions.length > 0) {
      survey.questions = data.questions.map((q: any) => {
        const question = createNewQuestion(q.type);
        question.id = q.id?.toString() || generateId();
        question.title = q.title || '';
        question.description = q.description || '';
        question.required = q.required || false;

        
        if (q.options && q.options.length > 0) {
          question.options = q.options.map((opt: any) => ({
            id: opt.id?.toString() || generateId(),
            text: typeof opt === 'string' ? opt : (opt.text || '')
          }));
        } else if (q.type !== 'text') {
          
          question.options = [
            { id: generateId(), text: '' },
            { id: generateId(), text: '' }
          ];
        }

        
        const settings = q.settings || {};
        question.hasOther = settings.hasOther || false;
        
        if (settings.likertScale) {
          question.likertMin = settings.likertScale.min || 1;
          question.likertMax = settings.likertScale.max || 5;
          question.likertLabelMin = settings.likertScale.labels?.[0] || '';
          question.likertLabelMax = settings.likertScale.labels?.[1] || '';
        }
        
        if (settings.abTest) {
          question.abVariants = settings.abTest.variants || ['', ''];
        }

        return question;
      });
    } else {
      
      addQuestion();
    }
  } catch (error: any) {
    console.error('Error loading survey:', error);
    console.error('Error response:', error.response?.data);
    notificationStore.error('Ошибка', 'Не удалось загрузить опрос. Возможно, у вас нет доступа.');
    router.push('/builder');
  }
}


onMounted(() => {
  loadSurvey();
  
  
  if (!route.params.id) {
    addQuestion();
  }
});
</script>

<style lang="scss" scoped>
.survey-builder-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;

  .builder-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;

    h1 {
      font-size: 28px;
      color: #333;
      margin: 0;
    }

    .builder-actions {
      display: flex;
      gap: 12px;
    }
  }
}

.survey-builder {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 30px;

  .survey-header {
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #f0f0f0;

    .title-input {
      width: 100%;
      padding: 12px 16px;
      font-size: 24px;
      font-weight: 600;
      border: 2px solid transparent;
      border-radius: 8px;
      margin-bottom: 12px;
      transition: all 0.2s;
      color: #333;

      &:focus {
        outline: none;
        border-color: #667eea;
        background: #f8f9ff;
      }

      &::placeholder {
        color: #bbb;
      }
    }

    .description-input {
      width: 100%;
      padding: 12px 16px;
      font-size: 14px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      resize: vertical;
      color: #666;

      &:focus {
        outline: none;
        border-color: #667eea;
        background: #f8f9ff;
      }

      &::placeholder {
        color: #bbb;
      }
    }
  }

  .survey-settings {
    display: flex;
    gap: 24px;
    margin-bottom: 30px;
    padding: 16px 20px;
    background: #f8f9fa;
    border-radius: 8px;
    flex-wrap: wrap;

    label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #555;
      cursor: pointer;

      input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: #667eea;
        cursor: pointer;
      }

      &:hover {
        color: #333;
      }
    }
  }

  .questions-section {
    .question-wrapper {
      margin-bottom: 20px;
    }

    .question-card {
      background: #fafafa;
      border: 2px solid #e8e8e8;
      border-radius: 10px;
      padding: 24px;
      transition: all 0.3s;

      &:hover {
        border-color: #667eea;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
      }

      .question-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;

        .question-move-buttons {
          display: flex;
          flex-direction: column;
          gap: 2px;

          .move-btn {
            background: none;
            border: 1px solid #ddd;
            border-radius: 3px;
            padding: 2px 6px;
            cursor: pointer;
            font-size: 10px;
            color: #666;
            line-height: 1;

            &:hover:not(:disabled) {
              background: #f0f0f0;
              color: #333;
            }

            &:disabled {
              opacity: 0.3;
              cursor: not-allowed;
            }
          }
        }

        .question-number {
          background: #667eea;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .question-type {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          cursor: pointer;
          color: #555;

          &:focus {
            outline: none;
            border-color: #667eea;
          }
        }

        .question-actions {
          display: flex;
          gap: 4px;

          .action-btn {
            background: none;
            border: none;
            padding: 6px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.2s;

            &:hover {
              background: #f0f0f0;
            }

            &.delete-btn:hover {
              background: #fee;
            }

            &.copy-btn:hover {
              background: #e8f0fe;
            }
          }
        }
      }

      .question-title-input {
        width: 100%;
        padding: 10px 12px;
        font-size: 16px;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        margin-bottom: 12px;

        &:focus {
          outline: none;
          border-color: #667eea;
        }

        &::placeholder {
          color: #bbb;
        }
      }

      .question-description-input {
        width: 100%;
        padding: 8px 12px;
        font-size: 13px;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        margin-bottom: 16px;
        color: #888;

        &:focus {
          outline: none;
          border-color: #667eea;
        }

        &::placeholder {
          color: #ccc;
        }
      }

      .required-toggle {
        margin-bottom: 16px;

        label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #777;
          cursor: pointer;

          input[type="checkbox"] {
            accent-color: #667eea;
          }
        }
      }

      .options-section {
        .options-label {
          font-size: 13px;
          font-weight: 500;
          color: #555;
          margin-bottom: 12px;
        }

        .option-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          padding: 4px;
          border-radius: 6px;
          transition: background 0.2s;

          &:hover {
            background: #f5f5f5;
          }

          .option-move-buttons {
            display: flex;
            flex-direction: column;
            gap: 2px;

            .move-btn-small {
              background: none;
              border: 1px solid #ddd;
              border-radius: 2px;
              padding: 1px 4px;
              cursor: pointer;
              font-size: 8px;
              color: #999;
              line-height: 1;

              &:hover:not(:disabled) {
                background: #f0f0f0;
                color: #333;
              }

              &:disabled {
                opacity: 0.3;
                cursor: not-allowed;
              }
            }
          }

          .option-type-indicator {
            width: 18px;
            height: 18px;
            border: 2px solid #667eea;
            border-radius: 50%;
            flex-shrink: 0;

            &.checkbox {
              border-radius: 4px;
            }
          }

          .option-input {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            font-size: 14px;

            &:focus {
              outline: none;
              border-color: #667eea;
            }

            &::placeholder {
              color: #bbb;
            }
          }

          .remove-option-btn {
            background: none;
            border: none;
            color: #ccc;
            cursor: pointer;
            padding: 4px;
            font-size: 18px;
            flex-shrink: 0;

            &:hover:not(:disabled) {
              color: #e74c3c;
            }

            &:disabled {
              opacity: 0.3;
              cursor: not-allowed;
            }
          }
        }

        .add-option-btn {
          background: none;
          border: 1px dashed #ccc;
          color: #888;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          width: 100%;
          margin-top: 8px;
          transition: all 0.2s;

          &:hover {
            border-color: #667eea;
            color: #667eea;
            background: #f8f9ff;
          }
        }

        .other-option {
          margin-top: 12px;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 6px;

          label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: #666;
            cursor: pointer;

            input[type="checkbox"] {
              accent-color: #667eea;
            }
          }
        }
      }

      .likert-settings,
      .ab-test-settings {
        background: #f8f9fa;
        padding: 16px;
        border-radius: 8px;
        margin-top: 12px;

        h5 {
          font-size: 14px;
          margin-bottom: 12px;
          color: #555;
          margin-top: 0;
        }
      }

      .likert-settings {
        .scale-range {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;

          .range-input {
            flex: 1;

            label {
              display: block;
              font-size: 12px;
              color: #888;
              margin-bottom: 4px;
            }

            input {
              width: 100%;
              padding: 6px 10px;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-size: 14px;

              &:focus {
                outline: none;
                border-color: #667eea;
              }
            }
          }
        }

        .scale-labels {
          display: flex;
          gap: 12px;

          input {
            flex: 1;
            padding: 6px 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 13px;

            &:focus {
              outline: none;
              border-color: #667eea;
            }

            &::placeholder {
              color: #bbb;
              font-size: 12px;
            }
          }
        }
      }

      .ab-test-settings {
        .variant-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 8px;

          .variant-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;

            .variant-label {
              font-weight: 600;
              font-size: 13px;
              color: #667eea;
            }

            button {
              background: none;
              border: none;
              color: #ccc;
              cursor: pointer;
              font-size: 16px;

              &:hover:not(:disabled) {
                color: #e74c3c;
              }

              &:disabled {
                opacity: 0.3;
                cursor: not-allowed;
              }
            }
          }

          textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            font-size: 13px;
            resize: vertical;
            min-height: 60px;

            &:focus {
              outline: none;
              border-color: #667eea;
            }

            &::placeholder {
              color: #bbb;
            }
          }
        }

        .add-variant-btn {
          width: 100%;
          padding: 8px;
          background: none;
          border: 1px dashed #ccc;
          border-radius: 6px;
          color: #888;
          cursor: pointer;
          font-size: 13px;

          &:hover {
            border-color: #667eea;
            color: #667eea;
          }
        }
      }
    }

    .add-question-section {
      text-align: center;
      padding: 20px;

      .add-question-btn {
        padding: 12px 32px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);

        &:hover {
          background: #5a6fd6;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
      }
    }
  }
}


.survey-preview-modal {
  .preview-container {
    padding: 20px;

    .preview-header {
      text-align: center;
      margin-bottom: 30px;

      h2 {
        font-size: 24px;
        margin-bottom: 12px;
        color: #333;
      }

      p {
        color: #666;
      }
    }

    .preview-question {
      background: #fafafa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 16px;

      h4 {
        margin-bottom: 12px;
        color: #333;

        .required-mark {
          color: #e74c3c;
          margin-left: 4px;
        }
      }

      .preview-options .preview-option {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;

        input {
          flex-shrink: 0;
        }
      }

      .preview-textarea {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 6px;
        resize: vertical;
        background: #f5f5f5;
      }

      .preview-likert {
        .likert-scale-preview {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;

          .likert-point {
            flex: 1;
            padding: 10px;
            text-align: center;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
          }
        }

        .likert-labels-preview {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #888;
        }
      }

      .preview-abtest {
        .ab-variants-preview {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;

          .ab-variant-preview {
            padding: 16px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            text-align: center;

            .ab-variant-label {
              font-weight: bold;
              color: #667eea;
              margin-bottom: 8px;
            }

            .ab-variant-text {
              color: #555;
            }
          }
        }
      }
    }
  }
}


.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &-primary {
    background: #667eea;
    color: white;

    &:hover:not(:disabled) {
      background: #5a6fd6;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
  }

  &-secondary {
    background: #f0f0f0;
    color: #555;

    &:hover:not(:disabled) {
      background: #e0e0e0;
      color: #333;
    }
  }
}

@media (max-width: 768px) {
  .survey-builder-page {
    padding: 10px;

    .builder-header {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;

      .builder-actions {
        width: 100%;
        
        .btn {
          flex: 1;
          justify-content: center;
        }
      }
    }
  }
}
</style>