import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SurveyModal from '@/components/SurveyModal.vue';

describe('SurveyModal.vue', () => {
  beforeEach(() => vi.clearAllMocks());

  it('не рендерится при modelValue=false', () => {
    const w = mount(SurveyModal, { props: { modelValue: false, title: 'T' } });
    expect(w.find('.modal-overlay').exists()).toBe(false);
  });

  it('рендерится при modelValue=true и показывает title', () => {
    const w = mount(SurveyModal, { props: { modelValue: true, title: 'Заголовок' } });
    expect(w.find('.modal-overlay').exists()).toBe(true);
    expect(w.find('.modal-title').text()).toBe('Заголовок');
  });

  it('клик по крестику эмитит update:modelValue=false и close', async () => {
    const w = mount(SurveyModal, { props: { modelValue: true, title: 'T' } });
    await w.find('.modal-close').trigger('click');
    expect(w.emitted('update:modelValue')?.[0]).toEqual([false]);
    expect(w.emitted('close')).toBeTruthy();
  });

  it('клик по оверлею закрывает', async () => {
    const w = mount(SurveyModal, { props: { modelValue: true, title: 'T' } });
    await w.find('.modal-overlay').trigger('click');
    expect(w.emitted('update:modelValue')?.[0]).toEqual([false]);
  });

  it('клик по контенту не закрывает (click.self)', async () => {
    const w = mount(SurveyModal, { props: { modelValue: true, title: 'T' } });
    await w.find('.modal-container').trigger('click');
    expect(w.emitted('update:modelValue')).toBeFalsy();
  });

  it('closable=false — крестика нет', () => {
    const w = mount(SurveyModal, { props: { modelValue: true, title: 'T', closable: false } });
    expect(w.find('.modal-close').exists()).toBe(false);
  });

  it('footer рендерится только при наличии слота', () => {
    const noFooter = mount(SurveyModal, { props: { modelValue: true, title: 'T' } });
    expect(noFooter.find('.modal-footer').exists()).toBe(false);

    const withFooter = mount(SurveyModal, {
      props: { modelValue: true, title: 'T' },
      slots: { footer: '<button>OK</button>' },
    });
    expect(withFooter.find('.modal-footer').exists()).toBe(true);
    expect(withFooter.find('.modal-footer button').text()).toBe('OK');
  });

  it('size задаёт класс контейнера', () => {
    for (const size of ['small', 'medium', 'large']) {
      const w = mount(SurveyModal, { props: { modelValue: true, title: 'T', size } });
      expect(w.find('.modal-container').classes()).toContain(`modal-${size}`);
    }
  });

  it('по умолчанию size=medium, closable=true', () => {
    const w = mount(SurveyModal, { props: { modelValue: true, title: 'T' } });
    expect(w.find('.modal-container').classes()).toContain('modal-medium');
    expect(w.find('.modal-close').exists()).toBe(true);
  });
});