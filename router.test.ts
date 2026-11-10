import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import router from '@/router';

describe('router', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('роут /register существует и имеет meta.guest', () => {
    const r = router.getRoutes().find((x) => x.path === '/register');
    expect(r).toBeTruthy();
    expect(r?.meta.guest).toBe(true);
  });
});