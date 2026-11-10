import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../app';
import { v4 as uuidv4 } from 'uuid';
import { sendResetEmail } from '../services/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authController = {
    async register(req: Request, res: Response) {
        try {
            const { email, password, name } = req.body;
            
            if (!email || !password || !name) {
                return res.status(400).json({ error: 'Все поля обязательны' });
            }
            
            // Проверка существующего пользователя
            const conn = await pool.getConnection();
            const existingUser = await conn.query(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );
            
            if (existingUser.length > 0) {
                conn.release();
                return res.status(400).json({ error: 'Пользователь уже существует' });
            }
            
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            
            // Создание пользователя
            const result = await conn.query(
                'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
                [email, passwordHash, name]
            );
            
            const userId = result.insertId;
            conn.release();
            
            const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '24h' });
            
            res.status(201).json({
                token,
                user: { id: userId, email, name }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Ошибка регистрации' });
        }
    },
    
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            
            const conn = await pool.getConnection();
            const users = await conn.query(
                'SELECT id, email, password_hash, name FROM users WHERE email = ?',
                [email]
            );
            conn.release();
            
            if (users.length === 0) {
                return res.status(401).json({ error: 'Неверный email или пароль' });
            }
            
            const user = users[0];
            const validPassword = await bcrypt.compare(password, user.password_hash);
            
            if (!validPassword) {
                return res.status(401).json({ error: 'Неверный email или пароль' });
            }
            
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            res.json({
                token,
                user: { id: user.id, email: user.email, name: user.name }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Ошибка входа' });
        }
    },
    
    async forgotPassword(req: Request, res: Response) {
        try {
            const { email } = req.body;
            const resetToken = uuidv4();
            const resetExpires = new Date(Date.now() + 3600000); // 1 час
            
            const conn = await pool.getConnection();
            await conn.query(
                'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
                [resetToken, resetExpires, email]
            );
            conn.release();
            
            await sendResetEmail(email, resetToken);
            
            res.json({ message: 'Инструкции отправлены на email' });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({ error: 'Ошибка восстановления пароля' });
        }
    },
    
    async resetPassword(req: Request, res: Response) {
        try {
            const { token, newPassword } = req.body;
            
            const conn = await pool.getConnection();
            const users = await conn.query(
                'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
                [token]
            );
            
            if (users.length === 0) {
                conn.release();
                return res.status(400).json({ error: 'Недействительный токен' });
            }
            
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(newPassword, salt);
            
            await conn.query(
                'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
                [passwordHash, users[0].id]
            );
            conn.release();
            
            res.json({ message: 'Пароль успешно изменен' });
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({ error: 'Ошибка сброса пароля' });
        }
    },
    
    async getProfile(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;
            
            const conn = await pool.getConnection();
            const users = await conn.query(
                'SELECT id, email, name, created_at FROM users WHERE id = ?',
                [userId]
            );
            
            if (users.length === 0) {
                conn.release();
                return res.status(404).json({ error: 'Пользователь не найден' });
            }
            
            const user = users[0];
            
            // Статистика
            const surveysCount = await conn.query(
                'SELECT COUNT(*) as count FROM surveys WHERE user_id = ?',
                [userId]
            );
            
            const responsesCount = await conn.query(
                'SELECT COUNT(DISTINCT r.survey_id) as count FROM responses r WHERE r.respondent_id = ?',
                [userId.toString()]
            );
            
            conn.release();
            
            res.json({
                ...user,
                createdSurveys: surveysCount[0].count,
                takenSurveys: responsesCount[0].count
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Ошибка получения профиля' });
        }
    },
    
    async updateProfile(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;
            const { name } = req.body;
            
            const conn = await pool.getConnection();
            await conn.query(
                'UPDATE users SET name = ? WHERE id = ?',
                [name, userId]
            );
            conn.release();
            
            res.json({ message: 'Профиль обновлен' });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ error: 'Ошибка обновления профиля' });
        }
    }
};
