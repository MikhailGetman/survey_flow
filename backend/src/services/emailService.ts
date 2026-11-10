
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

export async function sendResetEmail(email: string, token: string): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@surveyplatform.com',
        to: email,
        subject: 'Восстановление пароля',
        html: `
            <h2>Восстановление пароля</h2>
            <p>Вы запросили восстановление пароля на платформе опросов.</p>
            <p>Для сброса пароля перейдите по ссылке:</p>
            <a href="${resetLink}">${resetLink}</a>
            <p>Ссылка действительна в течение 1 часа.</p>
            <p>Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.</p>
        `
    });
}
