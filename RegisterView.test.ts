import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import RegisterView from '@/views/RegisterView.vue';

const push = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  RouterLink: { template: '<a><slot /></a>' },
}));

const registerMock = vi.fn();
vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({ register: registerMock }),
}));

describe('RegisterView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('пароль короче 6 — ошибка и НЕ шлёт запрос', async () => {
    const wrapper = mount(RegisterView);
    await wrapper.find('input[type=password]').setValue('123');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.find('.form-error').text()).toContain('не менее 6 символов');
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('успешная регистрация — редирект на /dashboard', async () => {
    registerMock.mockResolvedValue({ token: 't' });
    const wrapper = mount(RegisterView);
    await wrapper.find('input[type=text]').setValue('Test');
    await wrapper.find('input[type=email]').setValue('a@b.c');
    await wrapper.find('input[type=password]').setValue('secret123');
    await wrapper.find('form').trigger('submit');
    await Promise.resolve();
    await Promise.resolve();

    expect(registerMock).toHaveBeenCalledWith('a@b.c', 'secret123', 'Test');
    expect(push).toHaveBeenCalledWith('/dashboard');
  });

  it('ошибка из стора отображается в .form-error', async () => {
    registerMock.mockRejectedValue({ response: { data: { error: 'EMAIL_EXISTS' } } });
    const wrapper = mount(RegisterView);
    await wrapper.find('input[type=text]').setValue('Test');
    await wrapper.find('input[type=email]').setValue('a@b.c');
    await wrapper.find('input[type=password]').setValue('secret123');
    await wrapper.find('form').trigger('submit');
    await Promise.resolve();
    await Promise.resolve();

    expect(wrapper.find('.form-error').text()).toBe('EMAIL_EXISTS');
  });

  it('во время загрузки кнопка disabled и текст "Регистрация..."', async () => {
    let resolveFn: any;
    registerMock.mockImplementation(() => new Promise((r) => (resolveFn = r)));
    const wrapper = mount(RegisterView);
    await wrapper.find('input[type=text]').setValue('Test');
    await wrapper.find('input[type=email]').setValue('a@b.c');
    await wrapper.find('input[type=password]').setValue('secret123');
    await wrapper.find('form').trigger('submit');
    await wrapper.vm.$nextTick();

    const btn = wrapper.find('.submit-btn');
    expect(btn.attributes('disabled')).toBeDefined();
    expect(btn.text()).toContain('Регистрация...');

    resolveFn({});
  });
});