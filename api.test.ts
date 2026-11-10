import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import api from '@/services/api';
import { useAuthStore } from '@/store/auth';

vi.mock('@/router', () => ({
  default: {
    push: vi.fn(),
    currentRoute: { value: { fullPath: '/dashboard' } },
  },
}));
import router from '@/router';

describe('api service', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('конфиг: baseURL, timeout, Content-Type', () => {
    expect(api.defaults.baseURL).toBe('http://localhost:3000/api');
    expect(api.defaults.timeout).toBe(15000);
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('request-интерсептор добавляет Authorization при наличии токена', async () => {
    const store = useAuthStore();
    store.token = 'abc123';

    let captured: any;
    await api.get('/ping', {
      adapter: (config) => {
        captured = config;
        return Promise.resolve({
          data: {}, status: 200, statusText: 'OK', headers: {}, config,
        });
      },
    });

    expect(captured.headers.Authorization).toBe('Bearer abc123');
  });

  it('request-интерсептор не добавляет Authorization без токена', async () => {
    const store = useAuthStore();
    store.token = null;

    let captured: any;
    await api.get('/ping', {
      adapter: (config) => {
        captured = config;
        return Promise.resolve({
          data: {}, status: 200, statusText: 'OK', headers: {}, config,
        });
      },
    });

    expect(captured.headers.Authorization).toBeUndefined();
  });

  it('response на 500 просто реджектит, logout не зовёт', async () => {
    const store = useAuthStore();
    const logoutSpy = vi.fn();
    (store as any).logout = logoutSpy;

    await expect(
      api.get('/boom', {
        adapter: () => Promise.reject({ response: { status: 500 }, config: {} }),
      })
    ).rejects.toBeTruthy();

    expect(logoutSpy).not.toHaveBeenCalled();
  });

  it('response на 401 вызывает logout и редирект на /login', async () => {
    const store = useAuthStore();
    const logoutSpy = vi.fn();
    (store as any).logout = logoutSpy;

    await expect(
      api.get('/secure', {
        adapter: () => Promise.reject({ response: { status: 401 }, config: {} }),
      })
    ).rejects.toBeTruthy();

    expect(logoutSpy).toHaveBeenCalled();
    expect((router as any).push).toHaveBeenCalledWith({
      path: '/login',
      query: { redirect: '/dashboard' },
    });
  });

  it('response на 401 НЕ редиректит, если уже на /login', async () => {
    (router as any).currentRoute = { value: { fullPath: '/login' } };
    const store = useAuthStore();
    const logoutSpy = vi.fn();
    (store as any).logout = logoutSpy;

    await expect(
      api.get('/secure', {
        adapter: () => Promise.reject({ response: { status: 401 }, config: {} }),
      })
    ).rejects.toBeTruthy();

    expect((router as any).push).not.toHaveBeenCalled();
  });
});