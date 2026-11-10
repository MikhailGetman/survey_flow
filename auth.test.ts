import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '@/store/auth';
import api from '@/services/api';

vi.mock('@/services/api', () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('token инициализируется из localStorage', () => {
    localStorage.setItem('token', 'saved-token');
    const store = useAuthStore();
    expect(store.token).toBe('saved-token');
  });

  it('isAuthenticated = false без токена', () => {
    const store = useAuthStore();
    expect(store.isAuthenticated).toBe(false);
  });

  it('isAuthenticated = true при наличии токена', () => {
    const store = useAuthStore();
    store.token = 'abc';
    expect(store.isAuthenticated).toBe(true);
  });

  it('register вызывает api.post с правильными аргументами', async () => {
    (api.post as any).mockResolvedValue({ data: { token: 't1', user: { id: 1 } } });
    const store = useAuthStore();

    await store.register('a@b.c', 'secret123', 'Test');

    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      email: 'a@b.c',
      password: 'secret123',
      name: 'Test',
    });
  });

  it('register при успехе пишет token, user, localStorage', async () => {
    (api.post as any).mockResolvedValue({
      data: { token: 't1', user: { id: 1, email: 'a@b.c', name: 'Test' } },
    });
    const store = useAuthStore();

    await store.register('a@b.c', 'secret123', 'Test');

    expect(store.token).toBe('t1');
    expect(store.user).toEqual({ id: 1, email: 'a@b.c', name: 'Test' });
    expect(localStorage.getItem('token')).toBe('t1');
  });

  it('register пробрасывает ошибку (409) и не пишет токен', async () => {
    const err = { response: { status: 409, data: { error: 'EMAIL_EXISTS' } } };
    (api.post as any).mockRejectedValue(err);
    const store = useAuthStore();

    await expect(store.register('a@b.c', 'secret123', 'Test')).rejects.toBe(err);
    expect(store.token).toBeNull();
  });
});