import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSurveyStore } from '@/store/survey';
import api from '@/services/api';

vi.mock('@/services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

describe('survey store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('fetchMySurveys: loading true → false, пишет surveys, зовёт /surveys/my', async () => {
    const store = useSurveyStore();
    const data = [{ id: 1, title: 'A' }];
    (api.get as any).mockResolvedValue({ data });

    const promise = store.fetchMySurveys();
    expect(store.loading).toBe(true);

    await promise;
    expect(api.get).toHaveBeenCalledWith('/surveys/my');
    expect(store.surveys).toEqual(data);
    expect(store.loading).toBe(false);
  });

  it('createSurvey: зовёт POST /surveys и возвращает данные', async () => {
    const store = useSurveyStore();
    const payload = { title: 'New' };
    const response = { id: 5, title: 'New' };
    (api.post as any).mockResolvedValue({ data: response });

    const result = await store.createSurvey(payload);

    expect(api.post).toHaveBeenCalledWith('/surveys', payload);
    expect(result).toEqual(response);
  });

  it('fetchSurveyByLink: зовёт /surveys/public/:link и пишет currentSurvey', async () => {
    const store = useSurveyStore();
    const response = { id: 1, title: 'Pub' };
    (api.get as any).mockResolvedValue({ data: response });

    const result = await store.fetchSurveyByLink('abc');

    expect(api.get).toHaveBeenCalledWith('/surveys/public/abc');
    expect(store.currentSurvey).toEqual(response);
    expect(result).toEqual(response);
  });

  it('updateSurvey: зовёт PUT /surveys/:id', async () => {
    const store = useSurveyStore();
    const payload = { title: 'Upd' };
    (api.put as any).mockResolvedValue({ data: { id: 7, title: 'Upd' } });

    await store.updateSurvey(7, payload);

    expect(api.put).toHaveBeenCalledWith('/surveys/7', payload);
  });

  it('deleteSurvey: зовёт DELETE /surveys/:id', async () => {
    const store = useSurveyStore();
    (api.delete as any).mockResolvedValue({ data: { ok: true } });

    await store.deleteSurvey(9);

    expect(api.delete).toHaveBeenCalledWith('/surveys/9');
  });
});