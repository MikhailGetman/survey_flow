import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import SurveyBuilder from '@/components/SurveyBuilder.vue';

const push = vi.fn();
const routeParams: any = {};

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: routeParams }),
  useRouter: () => ({ push }),
}));

const apiMock = { post: vi.fn(), put: vi.fn(), get: vi.fn() };
vi.mock('@/services/api', () => ({ default: apiMock }));

vi.mock('@/store/notification', () => ({
  useNotificationStore: () => ({ error: vi.fn(), success: vi.fn() }),
}));

vi.mock('@/components/SurveyModal.vue', () => ({
  default: { name: 'SurveyModal', props: ['modelValue', 'title', 'size'], template: '<div class="modal-stub"><slot /></div>' },
}));

describe('SurveyBuilder.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete routeParams.id;
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('без id: при монтировании добавляется один вопрос', async () => {
    const w = mount(SurveyBuilder);
    await flushPromises();
    expect(w.findAll('.question-card').length).toBe(1);
  });

  it('addQuestion добавляет вопрос', async () => {
    const w = mount(SurveyBuilder);
    await flushPromises();
    await w.find('.add-question-btn').trigger('click');
    expect(w.findAll('.question-card').length).toBe(2);
  });

  it('removeQuestion удаляет вопрос при confirm=true', async () => {
    const w = mount(SurveyBuilder);
    await flushPromises();
    await w.find('.add-question-btn').trigger('click');
    expect(w.findAll('.question-card').length).toBe(2);
    await w.findAll('.delete-btn')[0].trigger('click');
    expect(w.findAll('.question-card').length).toBe(1);
  });

  it('duplicateQuestion дублирует вопрос', async () => {
    const w = mount(SurveyBuilder);
    await flushPromises();
    await w.find('.copy-btn').trigger('click');
    expect(w.findAll('.question-card').length).toBe(2);
  });

  it('addOption добавляет вариант, removeOption не даёт удалить ниже 2', async () => {
    const w = mount(SurveyBuilder);
    await flushPromises();
    // по умолчанию 2 варианта
    expect(w.findAll('.option-item').length).toBe(2);
    await w.find('.add-option-btn').trigger('click');
    expect(w.findAll('.option-item').length).toBe(3);
    // удаляем до 2
    await w.findAll('.remove-option-btn')[2].trigger('click');
    expect(w.findAll('.option-item').length).toBe(2);
    // кнопка удаления disabled при 2
    expect(w.findAll('.remove-option-btn')[0].attributes('disabled')).toBeDefined();
  });

  it('moveQuestionDown меняет порядок вопросов', async () => {
    const w = mount(SurveyBuilder);
    await flushPromises();
    // добавим второй, зададим заголовки
    await w.find('.add-question-btn').trigger('click');
    const titles = w.findAll('.question-title-input');
    await titles[0].setValue('Q1');
    await titles[1].setValue('Q2');
    // переместить первый вниз
    const downBtns = w.findAll('.question-move-buttons');
    await downBtns[0].findAll('button')[1].trigger('click');
    const after = w.findAll('.question-title-input');
    expect((after[0].element as HTMLInputElement).value).toBe('Q2');
    expect((after[1].element as HTMLInputElement).value).toBe('Q1');
  });

  it('saveSurvey без названия — alert, api не зовётся', async () => {
    const w = mount(SurveyBuilder);
    await flushPromises();
    await w.find('.builder-actions .btn-secondary').trigger('click'); // Сохранить
    await flushPromises();
    expect(window.alert).toHaveBeenCalled();
    expect(apiMock.post).not.toHaveBeenCalled();
    expect(apiMock.put).not.toHaveBeenCalled();
  });

  it('saveSurvey с названием, но без текста вопроса — alert', async () => {
    const w = mount(SurveyBuilder);
    await flushPromises();
    await w.find('.title-input').setValue('My survey');
    await w.find('.builder-actions .btn-secondary').trigger('click');
    await flushPromises();
    expect(window.alert).toHaveBeenCalled();
    expect(apiMock.post).not.toHaveBeenCalled();
  });

  it('успешное создание: POST /surveys + редирект на /builder/:id', async () => {
    apiMock.post.mockResolvedValue({ data: { id: 42 } });
    const w = mount(SurveyBuilder);
    await flushPromises();
    await w.find('.title-input').setValue('My survey');
    await w.find('.question-title-input').setValue('Q1');
    await w.find('.builder-actions .btn-secondary').trigger('click');
    await flushPromises();

    expect(apiMock.post).toHaveBeenCalledWith('/surveys', expect.objectContaining({ title: 'My survey' }));
    expect(push).toHaveBeenCalledWith('/builder/42');
  });

  it('при id в route — режим редактирования, PUT /surveys/:id', async () => {
    routeParams.id = '7';
    apiMock.get.mockResolvedValue({ data: { id: 7, title: 'Old', questions: [{ id: 1, title: 'Q', type: 'text' }] } });
    apiMock.put.mockResolvedValue({ data: { id: 7 } });

    const w = mount(SurveyBuilder);
    await flushPromises();
    expect(w.find('.title-input').element).toHaveProperty('value', 'Old');

    await w.find('.builder-actions .btn-secondary').trigger('click');
    await flushPromises();

    expect(apiMock.put).toHaveBeenCalledWith('/surveys/7', expect.any(Object));
  });

  it('previewSurvey открывает модалку', async () => {
    const w = mount(SurveyBuilder);
    await flushPromises();
    expect(w.findComponent({ name: 'SurveyModal' }).props('modelValue')).toBe(false);
    await w.find('.builder-actions .btn').trigger('click'); // Предпросмотр
    expect(w.findComponent({ name: 'SurveyModal' }).props('modelValue')).toBe(true);
  });
});