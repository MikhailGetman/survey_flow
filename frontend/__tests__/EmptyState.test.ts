import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import EmptyState from '@/components/EmptyState.vue';

describe('EmptyState.vue', () => {
  it('рендерит заголовок и описание', () => {
    const w = mount(EmptyState, {
      props: { title: 'Нет данных', description: 'Добавьте что-нибудь' },
    });
    expect(w.find('.empty-title').text()).toBe('Нет данных');
    expect(w.find('.empty-description').text()).toBe('Добавьте что-нибудь');
  });

  it('использует иконку по умолчанию и кастомную', () => {
    const defaultIcon = mount(EmptyState, { props: { title: 'T' } });
    expect(defaultIcon.find('.empty-icon').text()).toBe('📋');

    const customIcon = mount(EmptyState, { props: { title: 'T', icon: '📭' } });
    expect(customIcon.find('.empty-icon').text()).toBe('📭');
  });

  it('показывает кнопку действия и эмитит событие при клике', async () => {
    const w = mount(EmptyState, {
      props: { title: 'T', actionText: 'Добавить' },
    });
    const btn = w.find('.empty-action');
    expect(btn.text()).toBe('Добавить');
    await btn.trigger('click');
    expect(w.emitted('action')).toHaveLength(1);
  });

  it('не показывает кнопку, если actionText не передан', () => {
    const w = mount(EmptyState, { props: { title: 'T' } });
    expect(w.find('.empty-action').exists()).toBe(false);
  });
});