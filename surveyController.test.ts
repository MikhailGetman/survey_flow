import { surveyController } from '../src/controllers/surveyController';
import { pool } from '../src/app';
import { v4 as uuidv4 } from 'uuid';

jest.mock('../src/app', () => ({
  pool: {
    getConnection: jest.fn(),
  },
}));

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('surveyController', () => {
  let mockConn: any;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConn = {
      query: jest.fn(),
      release: jest.fn(),
    };
    (pool.getConnection as jest.Mock).mockResolvedValue(mockConn);

    mockReq = {
      body: {},
      params: {},
      userId: 1,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('create', () => {
    it('успешно создает опрос с вопросами и возвращает 201', async () => {
      (uuidv4 as jest.Mock).mockReturnValue('mock-uuid-link');

      mockReq.body = {
        title: 'Test Survey',
        description: 'Desc',
        isAnonymous: true,
        questions: [
          { type: 'text', title: 'Q1' },
          { type: 'single_choice', title: 'Q2', options: ['A', 'B'], settings: { hasOther: true } },
        ],
      };

      mockConn.query
        .mockResolvedValueOnce({ insertId: 10 })
        .mockResolvedValueOnce({ insertId: 100 })
        .mockResolvedValueOnce({ insertId: 101 })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      await surveyController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ id: 10 }));

      expect(mockConn.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO surveys'),
        [1, 'Test Survey', 'Desc', true, false, 'draft', 'mock-uuid-link']
      );
      expect(mockConn.release).toHaveBeenCalled();
    });

    it('возвращает 500 при ошибке в БД', async () => {
      mockReq.body = { title: 'T' };
      mockConn.query.mockRejectedValue(new Error('DB Error'));

      await surveyController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Ошибка создания опроса' });
    });
  });

  describe('getSurveyById', () => {
    it('возвращает 404, если опрос не найден или чужой', async () => {
      mockReq.params = { surveyId: '10' };
      mockConn.query.mockResolvedValueOnce([]);

      await surveyController.getSurveyById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Опрос не найден или нет доступа' });
      expect(mockConn.release).toHaveBeenCalled();
    });

    it('возвращает опрос с вопросами и распарсенными настройками', async () => {
      mockReq.params = { surveyId: '10' };

      mockConn.query
        .mockResolvedValueOnce([{ id: 10, title: 'Survey', user_id: 1, is_anonymous: 1 }])
        .mockResolvedValueOnce([
          { id: 100, type: 'text', settings: '{"a":1}' },
          { id: 101, type: 'single_choice', settings: null },
        ])
        .mockResolvedValueOnce([{ id: 1, question_id: 101, text: 'Opt', order_index: 0 }]);

      await surveyController.getSurveyById(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 10,
        title: 'Survey',
        isAnonymous: true,
        questions: expect.arrayContaining([
          expect.objectContaining({ id: 100, settings: { a: 1 }, options: [] }),
          expect.objectContaining({ id: 101, settings: {}, options: [{ id: 1, question_id: 101, text: 'Opt', order_index: 0 }] }),
        ]),
      }));
    });
  });

  describe('update', () => {
    it('возвращает 404, если опрос не существует', async () => {
      mockReq.params = { surveyId: '10' };
      mockConn.query.mockResolvedValueOnce([]);

      await surveyController.update(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Опрос не найден' });
    });

    it('возвращает 403, если опрос принадлежит другому пользователю', async () => {
      mockReq.params = { surveyId: '10' };
      mockReq.userId = 1;
      mockConn.query.mockResolvedValueOnce([{ id: 10, user_id: 2 }]);

      await surveyController.update(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Нет доступа' });
    });

    it('успешно обновляет опрос и возвращает 200', async () => {
      mockReq.params = { surveyId: '10' };
      mockReq.userId = 1;
      mockReq.body = { title: 'Updated' };

      mockConn.query
        .mockResolvedValueOnce([{ id: 10, user_id: 1 }])
        .mockResolvedValueOnce({});

      await surveyController.update(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ id: 10, message: 'Опрос успешно обновлен' });
    });
  });

  describe('delete', () => {
    it('возвращает 404, если опрос не найден', async () => {
      mockReq.params = { surveyId: '10' };
      mockConn.query.mockResolvedValueOnce({ affectedRows: 0 });

      await surveyController.delete(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Опрос не найден или нет доступа' });
    });

    it('успешно удаляет опрос', async () => {
      mockReq.params = { surveyId: '10' };
      mockConn.query.mockResolvedValueOnce({ affectedRows: 1 });

      await surveyController.delete(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Опрос удален' });
    });
  });

  describe('getMySurveys', () => {
    it('возвращает список опросов пользователя с приведением типов', async () => {
      mockConn.query.mockResolvedValueOnce([
        { id: '1', user_id: '1', title: 'S1', response_count: '5', questions_count: '3' },
      ]);

      await surveyController.getMySurveys(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith([
        expect.objectContaining({ id: 1, response_count: 5, questions_count: 3 }),
      ]);
    });
  });

  describe('getTakenSurveys', () => {
    it('возвращает пройденные опросы с количеством ответов', async () => {
      mockConn.query
        .mockResolvedValueOnce([
          { id: 1, title: 'Taken', response_id: 10, questions_count: '2' },
        ])
        .mockResolvedValueOnce([{ count: '2' }]);

      await surveyController.getTakenSurveys(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        surveys: [expect.objectContaining({ id: 1, answers_count: 2 })],
        total: 1,
      });
    });
  });
});