import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SearchFilter from '@/components/SearchFilter.vue';

describe('SearchFilter.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('рендерит инпут с плейсхолдером', () => {
    const w = mount(SearchFilter, { props: { placeholder: 'Найти опрос' } });
    expect(w.find('input').attributes('placeholder')).toBe('Найти опрос');
  });

  it('эмитит search с задержкой при вводе', async () => {
    const w = mount(SearchFilter, { props: { delay: 300 } });
    await w.find('input').setValue('test');
    expect(w.emitted('search')).toBeFalsy(); // сразу нет
    vi.advanceTimersByTime(300);
    expect(w.emitted('search')?.[0]).toEqual(['test']);
  });

  it('кнопка очистки появляется при вводе и очищает поиск', async () => {
    const w = mount(SearchFilter);
    expect(w.find('.clear-btn').exists()).toBe(false);
    await w.find('input').setValue('abc');
    expect(w.find('.clear-btn').exists()).toBe(true);
    
    await w.find('.clear-btn').trigger('click');
    expect(w.find('input').element).toHaveProperty('value', '');
    expect(w.emitted('clear')).toHaveLength(1);
    expect(w.emitted('search')?.[1]).toEqual(['']);
  });

  it('рендерит слот filters', () => {
    const w = mount(SearchFilter, {
      slots: { filters: '<div class="my-filter">Filter</div>' },
    });
    expect(w.find('.my-filter').exists()).toBe(true);
  });
});