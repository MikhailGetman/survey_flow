import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import router from '@/router';
import { useAuthStore } from '@/store/auth';

describe('router guards & routes', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('корень "/" редиректит на /dashboard', () => {
    const root = router.getRoutes().find((r) => r.path === '/');
    expect(root?.redirect).toBe('/dashboard');
  });

  it('/dashboard, /builder, /builder/:id требуют авторизации', () => {
    const paths = ['/dashboard', '/builder', '/builder/:id'];
    paths.forEach((p) => {
      const r = router.getRoutes().find((x) => x.path === p);
      expect(r, `route ${p}`).toBeTruthy();
      expect(r?.meta.requiresAuth).toBe(true);
    });
  });

  it('/login, /register, /forgot-password, /reset-password — guest', () => {
    const paths = ['/login', '/register', '/forgot-password', '/reset-password'];
    paths.forEach((p) => {
      const r = router.getRoutes().find((x) => x.path === p);
      expect(r?.meta.guest).toBe(true);
    });
  });

  it('/builder и /builder/:id грузят SurveyBuilder.vue', async () => {
    for (const p of ['/builder', '/builder/:id']) {
      const r = router.getRoutes().find((x) => x.path === p);
      const mod = await (r!.component as any)();
      expect(mod.default || mod).toBeTruthy();
    }
  });

  it('без токена /dashboard → /login с query.redirect', async () => {
    const auth = useAuthStore();
    auth.token = null;

    await router.push('/dashboard').catch(() => {});
    await router.isReady();

    expect(router.currentRoute.value.path).toBe('/login');
    expect(router.currentRoute.value.query.redirect).toBe('/dashboard');
  });

  it('с токеном /dashboard пускает', async () => {
    const auth = useAuthStore();
    auth.token = 'tok';

    await router.push('/dashboard').catch(() => {});
    await router.isReady();

    expect(router.currentRoute.value.path).toBe('/dashboard');
  });
});