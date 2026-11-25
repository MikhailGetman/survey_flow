import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNotificationStore } from '@/store/notification';

describe('notification store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  it('addNotification добавляет уведомление и возвращает id', () => {
    const store = useNotificationStore();
    const id = store.addNotification({ type: 'info', title: 'T', message: 'M' });
    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0].id).toBe(id);
    expect(store.notifications[0].duration).toBe(5000);
  });

  it('success, error, warning, info вызывают addNotification с правильным типом', () => {
    const store = useNotificationStore();
    store.success('S', 'M');
    store.error('E', 'M');
    store.warning('W', 'M');
    store.info('I', 'M');
    expect(store.notifications.map(n => n.type)).toEqual(['success', 'error', 'warning', 'info']);
  });

  it('error имеет duration 7000 по умолчанию', () => {
    const store = useNotificationStore();
    store.error('E', 'M');
    expect(store.notifications[0].duration).toBe(7000);
  });

  it('removeNotification удаляет по id', () => {
    const store = useNotificationStore();
    const id = store.addNotification({ type: 'info', title: 'T', message: 'M' });
    store.removeNotification(id);
    expect(store.notifications).toHaveLength(0);
  });

  it('clearAll очищает все уведомления', () => {
    const store = useNotificationStore();
    store.success('S', 'M');
    store.error('E', 'M');
    store.clearAll();
    expect(store.notifications).toHaveLength(0);
  });

  it('уведомление удаляется автоматически по истечении duration', () => {
    const store = useNotificationStore();
    store.addNotification({ type: 'info', title: 'T', message: 'M', duration: 1000 });
    expect(store.notifications).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    expect(store.notifications).toHaveLength(0);
  });
});