import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ResetPassword from '@/views/ResetPassword.vue';

const resetMock = vi.fn();
const push = vi.fn();
const routeQuery: any = { token: 'tok123' };

vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({ resetPassword: resetMock }),
}));
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: routeQuery }),
  useRouter: () => ({ push }),
  RouterLink: { template: '<a><slot /></a>' },
}));

describe('ResetPassword.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeQuery.token = 'tok123';
    vi.useFakeTimers();
  });

  it('пароли не совпадают — ошибка, запрос не уходит', async () => {
    const w = mount(ResetPassword);
    const inputs = w.findAll('input[type=password]');
    await inputs[0].setValue('secret123');
    await inputs[1].setValue('different');
    await w.find('form').trigger('submit');
    expect(w.find('.form-error').text()).toBe('Пароли не совпадают');
    expect(resetMock).not.toHaveBeenCalled();
  });

  it('пароль короче 6 — ошибка', async () => {
    const w = mount(ResetPassword);
    const inputs = w.findAll('input[type=password]');
    await inputs[0].setValue('123');
    await inputs[1].setValue('123');
    await w.find('form').trigger('submit');
    expect(w.find('.form-error').text()).toContain('не менее 6 символов');
    expect(resetMock).not.toHaveBeenCalled();
  });

  it('нет token в query — ошибка "Недействительная ссылка"', async () => {
    routeQuery.token = undefined;
    const w = mount(ResetPassword);
    const inputs = w.findAll('input[type=password]');
    await inputs[0].setValue('secret123');
    await inputs[1].setValue('secret123');
    await w.find('form').trigger('submit');
    expect(w.find('.form-error').text()).toContain('Недействительная ссылка');
    expect(resetMock).not.toHaveBeenCalled();
  });

  it('успех — success, редирект на /login через 2с', async () => {
    resetMock.mockResolvedValue({});
    const w = mount(ResetPassword);
    const inputs = w.findAll('input[type=password]');
    await inputs[0].setValue('secret123');
    await inputs[1].setValue('secret123');
    await w.find('form').trigger('submit');
    await flushPromises();

    expect(resetMock).toHaveBeenCalledWith('tok123', 'secret123');
    expect(w.find('.form-success').text()).toContain('Пароль успешно изменен');

    vi.advanceTimersByTime(2000);
    expect(push).toHaveBeenCalledWith('/login');
  });

  it('ошибка от сервера — .form-error', async () => {
    resetMock.mockRejectedValue({ response: { data: { error: 'Недействительный токен' } } });
    const w = mount(ResetPassword);
    const inputs = w.findAll('input[type=password]');
    await inputs[0].setValue('secret123');
    await inputs[1].setValue('secret123');
    await w.find('form').trigger('submit');
    await flushPromises();
    expect(w.find('.form-error').text()).toBe('Недействительный токен');
  });
});