import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import router from '@/router';

describe('router new routes', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('/survey/:link существует и не требует авторизации', () => {
    const r = router.getRoutes().find(x => x.path === '/survey/:link');
    expect(r).toBeTruthy();
    expect(r?.name).toBe('SurveyView');
    expect(r?.meta?.requiresAuth).toBeUndefined();
  });

  it('/results/:id существует и требует авторизации', () => {
    const r = router.getRoutes().find(x => x.path === '/results/:id');
    expect(r).toBeTruthy();
    expect(r?.name).toBe('SurveyResults');
    expect(r?.meta?.requiresAuth).toBe(true);
  });
});