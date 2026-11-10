import request from 'supertest';
import bcrypt from 'bcrypt';
import app, { pool } from '../src/app';
import * as emailService from '../src/services/emailService';

jest.mock('../src/services/emailService');

describe('POST /auth/forgot-password', () => {
  beforeEach(async () => {
    await pool.query('DELETE FROM users');
    jest.clearAllMocks();
  });

  it('пишет reset_token и reset_token_expires, вызывает sendResetEmail', async () => {
    await request(app).post('/auth/register')
      .send({ email: 'a@b.c', password: 'secret123', name: 'A' });

    const res = await request(app).post('/auth/forgot-password')
      .send({ email: 'a@b.c' });

    expect(res.status).toBe(200);
    const [rows] = await pool.query('SELECT reset_token, reset_token_expires FROM users WHERE email=?', ['a@b.c']);
    const user = (rows as any[])[0];
    expect(user.reset_token).toBeTruthy();
    expect(new Date(user.reset_token_expires).getTime()).toBeGreaterThan(Date.now());
    expect(emailService.sendResetEmail).toHaveBeenCalledWith('a@b.c', user.reset_token);
  });

  it('несуществующий email — всё равно 200 (не раскрываем наличие)', async () => {
    const res = await request(app).post('/auth/forgot-password')
      .send({ email: 'no@one.c' });
    expect(res.status).toBe(200);
  });
});

describe('POST /auth/reset-password', () => {
  let resetToken: string;

  beforeEach(async () => {
    await pool.query('DELETE FROM users');
    await request(app).post('/auth/register')
      .send({ email: 'a@b.c', password: 'secret123', name: 'A' });
    resetToken = 'test-reset-token';
    await pool.query(
      'UPDATE users SET reset_token=?, reset_token_expires=? WHERE email=?',
      [resetToken, new Date(Date.now() + 3600_000), 'a@b.c']
    );
  });

  it('валидный токен — меняет пароль на bcrypt-хеш и очищает reset_token', async () => {
    const res = await request(app).post('/auth/reset-password')
      .send({ token: resetToken, newPassword: 'newsecret123' });

    expect(res.status).toBe(200);
    const [rows] = await pool.query('SELECT password_hash, reset_token FROM users WHERE email=?', ['a@b.c']);
    const user = (rows as any[])[0];
    expect(user.reset_token).toBeNull();
    expect(user.password_hash).not.toBe('newsecret123');
    expect(await bcrypt.compare('newsecret123', user.password_hash)).toBe(true);
  });

  it('просроченный токен — 400', async () => {
    await pool.query('UPDATE users SET reset_token_expires=? WHERE email=?', [new Date(Date.now() - 1000), 'a@b.c']);
    const res = await request(app).post('/auth/reset-password')
      .send({ token: resetToken, newPassword: 'newsecret123' });
    expect(res.status).toBe(400);
  });

  it('неизвестный токен — 400', async () => {
    const res = await request(app).post('/auth/reset-password')
      .send({ token: 'nope', newPassword: 'newsecret123' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /auth/profile (updateProfile)', () => {
  let token: string;
  beforeEach(async () => {
    await pool.query('DELETE FROM users');
    const r = await request(app).post('/auth/register')
      .send({ email: 'a@b.c', password: 'secret123', name: 'Old' });
    token = r.body.token;
  });

  it('обновляет name', async () => {
    const res = await request(app).put('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New' });
    expect(res.status).toBe(200);
    const [rows] = await pool.query('SELECT name FROM users WHERE email=?', ['a@b.c']);
    expect((rows as any[])[0].name).toBe('New');
  });
});