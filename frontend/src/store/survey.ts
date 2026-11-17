
import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';
import { Survey } from '@/types/survey';

export const useSurveyStore = defineStore('survey', () => {
  const surveys = ref<Survey[]>([]);
  const currentSurvey = ref<Survey | null>(null);
  const loading = ref(false);
  
  async function fetchMySurveys() {
    loading.value = true;

    const response = await api.get('/surveys/my');
    loading.value = false;
    surveys.value = response.data;
    return response.data;
  }
  
  async function createSurvey(surveyData: Partial<Survey>) {
    const response = await api.post('/surveys', surveyData);
    return response.data;
  }
  
  async function fetchSurveyByLink(link: string) {
    const response = await api.get(`/surveys/public/${link}`);
    currentSurvey.value = response.data;
    return response.data;
  }
  
  async function updateSurvey(id: number, surveyData: Partial<Survey>) {
    const response = await api.put(`/surveys/${id}`, surveyData);
    return response.data;
  }
  
  async function deleteSurvey(id: number) {
    const response = await api.delete(`/surveys/${id}`);
    return response.data;
  }

  return {
    surveys,
    currentSurvey,
    loading,
    fetchMySurveys,
    createSurvey,
    fetchSurveyByLink,
    updateSurvey,
    deleteSurvey,
  };
});