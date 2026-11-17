import * as nodemailer from 'nodemailer';
import { sendResetEmail } from '../src/services/emailService';

jest.mock('nodemailer');

describe('emailService: sendResetEmail', () => {
  let sendMailMock: jest.Mock;

  beforeEach(() => {
    sendMailMock = jest.fn().mockResolvedValue({});
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });
    process.env.FRONTEND_URL = 'http://localhost:8080';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('формирует правильную ссылку для сброса пароля и отправляет письмо', async () => {
    await sendResetEmail('test@example.com', 'secret-token');

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const mailOptions = sendMailMock.mock.calls[0][0];

    expect(mailOptions.to).toBe('test@example.com');
    expect(mailOptions.subject).toBe('Восстановление пароля');
    // Проверяем, что в html есть правильная ссылка
    expect(mailOptions.html).toContain('http://localhost:8080/reset-password?token=secret-token');
  });

  it('пробрасывает ошибку, если почтовый сервер недоступен', async () => {
    sendMailMock.mockRejectedValue(new Error('SMTP Connection Error'));

    await expect(sendResetEmail('test@example.com', 'token')).rejects.toThrow('SMTP Connection Error');
  });
});