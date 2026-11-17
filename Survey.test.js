const Survey = require('../src/models/Survey');
const pool = require('../src/config/database');

jest.mock('../src/config/database', () => ({
  getConnection: jest.fn(),
  execute: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => '12345678-abcd-efgh'),
}));

describe('Модель Survey', () => {
  let mockConn;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConn = {
      beginTransaction: jest.fn(),
      execute: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
    };
    pool.getConnection.mockResolvedValue(mockConn);
  });

  describe('create', () => {
    it('создает опрос и вопросы в транзакции', async () => {
      mockConn.execute
        .mockResolvedValueOnce([{ insertId: 5 }])
        .mockResolvedValueOnce([{}]);

      const result = await Survey.create(1, {
        title: 'Test',
        description: 'Desc',
        anonymous: true,
        questions: [{ type: 'text', text: 'Q1' }],
      });

      expect(mockConn.beginTransaction).toHaveBeenCalled();
      expect(mockConn.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO surveys'),
        [1, 'Test', 'Desc', '12345678', true, true]
      );
      expect(mockConn.commit).toHaveBeenCalled();
      expect(mockConn.release).toHaveBeenCalled();
      expect(result).toEqual({ id: 5, publicLink: '12345678' });
    });

    it('делает rollback при ошибке', async () => {
      mockConn.execute.mockRejectedValue(new Error('DB fail'));

      await expect(Survey.create(1, { title: 'T', questions: [] })).rejects.toThrow('DB fail');

      expect(mockConn.rollback).toHaveBeenCalled();
      expect(mockConn.release).toHaveBeenCalled();
      expect(mockConn.commit).not.toHaveBeenCalled();
    });
  });

  describe('getByPublicLink', () => {
    it('возвращает null, если опрос не найден', async () => {
      pool.execute.mockResolvedValueOnce([[]]);
      const res = await Survey.getByPublicLink('link');
      expect(res).toBeNull();
    });

    it('возвращает опрос с распарсенными вопросами', async () => {
      pool.execute
        .mockResolvedValueOnce([[{ id: 1, public_link: 'link' }]])
        .mockResolvedValueOnce([[{ id: 10, options: '["A","B"]', scale_labels: '["min","max"]' }]]);

      const res = await Survey.getByPublicLink('link');

      expect(res.questions[0].options).toEqual(['A', 'B']);
      expect(res.questions[0].scale_labels).toEqual(['min', 'max']);
    });
  });

  describe('delete', () => {
    it('удаляет все связанные данные в транзакции', async () => {
      mockConn.execute.mockResolvedValue([{}]);

      const res = await Survey.delete(1, 2);

      expect(mockConn.beginTransaction).toHaveBeenCalled();
      expect(mockConn.execute).toHaveBeenCalledTimes(4);
      expect(mockConn.commit).toHaveBeenCalled();
      expect(res).toBe(true);
    });
  });
});