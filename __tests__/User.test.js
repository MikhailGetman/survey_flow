const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../src/models/User');
const { pool } = require('../src/config/database');

// Мокаем базу данных, bcrypt и crypto
jest.mock('../src/config/database', () => ({
  pool: {
    execute: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

describe('Модель User', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('хеширует пароль и создает пользователя', async () => {
      bcrypt.hash.mockResolvedValue('hashed_password');
      pool.execute.mockResolvedValue([{ insertId: 1 }]);

      const id = await User.create({ email: 'a@b.c', password: '123', name: 'Test' });

      expect(bcrypt.hash).toHaveBeenCalledWith('123', 10);
      expect(pool.execute).toHaveBeenCalledWith(
        'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
        ['a@b.c', 'hashed_password', 'Test']
      );
      expect(id).toBe(1);
    });
  });

  describe('findByEmail / findById', () => {
    it('возвращает пользователя по email', async () => {
      const mockUser = { id: 1, email: 'a@b.c' };
      pool.execute.mockResolvedValue([[mockUser]]);

      const user = await User.findByEmail('a@b.c');

      expect(pool.execute).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = ?',
        ['a@b.c']
      );
      expect(user).toEqual(mockUser);
    });

    it('возвращает пользователя по id без пароля', async () => {
      pool.execute.mockResolvedValue([[{ id: 1 }]]);
      await User.findById(1);
      expect(pool.execute).toHaveBeenCalledWith(
        'SELECT id, email, name, created_at FROM users WHERE id = ?',
        [1]
      );
    });
  });

  describe('validatePassword', () => {
    it('сравнивает введенный пароль с хешем в БД', async () => {
      bcrypt.compare.mockResolvedValue(true);
      const user = { password_hash: 'hash' };
      
      const isValid = await User.validatePassword(user, '123');
      
      expect(bcrypt.compare).toHaveBeenCalledWith('123', 'hash');
      expect(isValid).toBe(true);
    });
  });

  describe('createResetToken', () => {
    it('генерирует токен, сохраняет его в БД с временем жизни и возвращает', async () => {
      crypto.randomBytes.mockReturnValue({ toString: () => 'mock-token' });
      pool.execute.mockResolvedValue([{}]);

      const token = await User.createResetToken('a@b.c');

      expect(token).toBe('mock-token');
      expect(pool.execute).toHaveBeenCalledWith(
        'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
        ['mock-token', expect.any(Date), 'a@b.c']
      );
    });
  });

  describe('findByResetToken', () => {
    it('ищет пользователя по токену с проверкой срока действия', async () => {
      pool.execute.mockResolvedValue([[{ id: 1 }]]);
      const user = await User.findByResetToken('mock-token');

      expect(pool.execute).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
        ['mock-token']
      );
      expect(user).toEqual({ id: 1 });
    });
  });

  describe('updatePassword', () => {
    it('хеширует новый пароль и очищает токен сброса', async () => {
      bcrypt.hash.mockResolvedValue('new_hash');
      pool.execute.mockResolvedValue([{}]);

      await User.updatePassword(1, 'new_password');

      expect(bcrypt.hash).toHaveBeenCalledWith('new_password', 10);
      expect(pool.execute).toHaveBeenCalledWith(
        'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
        ['new_hash', 1]
      );
    });
  });
});