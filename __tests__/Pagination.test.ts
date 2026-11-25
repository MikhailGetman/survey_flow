import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Pagination from '@/components/Pagination.vue';

describe('Pagination.vue', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    totalItems: 100,
    itemsPerPage: 10,
  };

  it('не рендерится, если totalPages <= 1', () => {
    const w = mount(Pagination, { props: { ...defaultProps, totalPages: 1 } });
    expect(w.find('.pagination').exists()).toBe(false);
  });

  it('рендерит кнопки страниц и "..." для больших объемов', () => {
    const w = mount(Pagination, { props: defaultProps });
    const buttons = w.findAll('.page-btn');
    expect(buttons.length).toBeGreaterThan(5);
    expect(w.text()).toContain('...');
  });

  it('кнопка Назад disabled на первой странице', () => {
    const w = mount(Pagination, { props: defaultProps });
    expect(w.findAll('.page-btn')[0].attributes('disabled')).toBeDefined();
  });

  it('эмитит page-change при клике на страницу', async () => {
    const w = mount(Pagination, { props: defaultProps });
    const page2 = w.findAll('.page-btn').find(b => b.text() === '2');
    await page2?.trigger('click');
    expect(w.emitted('page-change')?.[0]).toEqual([2]);
  });

  it('не эмитит при клике на многоточие', async () => {
    const w = mount(Pagination, { props: defaultProps });
    const ellipsis = w.findAll('.page-btn').find(b => b.text() === '...');
    await ellipsis?.trigger('click');
    expect(w.emitted('page-change')).toBeFalsy();
  });
});