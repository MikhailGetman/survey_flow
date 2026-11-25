import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

describe('LoadingSpinner.vue', () => {
  it('рендерит спиннер и сообщение', () => {
    const w = mount(LoadingSpinner, { props: { message: 'Загрузка...' } });
    expect(w.find('.spinner').exists()).toBe(true);
    expect(w.find('.loading-message').text()).toBe('Загрузка...');
  });

  it('не рендерит сообщение, если не передано', () => {
    const w = mount(LoadingSpinner);
    expect(w.find('.loading-message').exists()).toBe(false);
  });

  it('добавляет класс fullscreen при fullscreen=true', () => {
    const w = mount(LoadingSpinner, { props: { fullscreen: true } });
    expect(w.find('.loading-spinner').classes()).toContain('fullscreen');
  });
});