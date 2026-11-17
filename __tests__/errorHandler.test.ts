import { Request, Response, NextFunction } from 'express';
import { AppError, errorHandler, notFoundHandler } from '../src/middleware/errorHandler';

// Создаем моки для Request и Response
const mockRequest = (url = '/test') => ({
  originalUrl: url,
} as Request);

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const mockNext: NextFunction = jest.fn();

describe('errorHandler middleware', () => {
  // Подавляем вывод console.error в тестах, чтобы не засорять консоль
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('возвращает кастомную ошибку AppError с её статус-кодом и сообщением', () => {
    const err = new AppError('Пользователь не найден', 404);
    const req = mockRequest();
    const res = mockResponse();

    errorHandler(err, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Пользователь не найден',
    });
  });

  it('возвращает 500 для непредвиденных (неоперационных) ошибок', () => {
    const err = new Error('Что-то сломалось в базе');
    const req = mockRequest();
    const res = mockResponse();

    errorHandler(err, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Внутренняя ошибка сервера',
    });
    expect(console.error).toHaveBeenCalledWith('Unexpected error:', err);
  });
});

describe('notFoundHandler middleware', () => {
  it('возвращает 404 и URL, который не был найден', () => {
    const req = mockRequest('/api/unknown-route');
    const res = mockResponse();

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Маршрут /api/unknown-route не найден',
    });
  });
});