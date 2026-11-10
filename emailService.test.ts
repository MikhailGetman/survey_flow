import * as nodemailer from 'nodemailer';
import { sendResetEmail } from '../src/services/emailService';

jest.mock('nodemailer');

describe('sendResetEmail', () => {
  it('формирует ссылку с токеном и шлёт письмо', async () => {
    const sendMail = jest.fn().mockResolvedValue({});
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });

    process.env.FRONTEND_URL = 'http://localhost:8080';
    await sendResetEmail('a@b.c', 'tok123');

    expect(sendMail).toHaveBeenCalledTimes(1);
    const arg = sendMail.mock.calls[0][0];
    expect(arg.to).toBe('a@b.c');
    expect(arg.html).toContain('http://localhost:8080/reset-password?token=tok123');
  });

  it('пробрасывает ошибку транспорта', async () => {
    const sendMail = jest.fn().mockRejectedValue(new Error('SMTP down'));
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
    await expect(sendResetEmail('a@b.c', 't')).rejects.toThrow('SMTP down');
  });
});