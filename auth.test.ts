import { authenticateToken, optionalAuth } from '../src/middleware/auth';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'your-secret-key';

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('authenticateToken', () => {
  it('нет заголовка — 401', () => {
    const req: any = { headers: {} };
    const res = mockRes();
    const next = jest.fn();
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('битый токен — 403', () => {
    const req: any = { headers: { authorization: 'Bearer bad.token.here' } };
    const res = mockRes();
    const next = jest.fn();
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('валидный токен — кладёт userId/email и вызывает next', () => {
    const token = jwt.sign({ userId: 7, email: 'a@b.c' }, SECRET);
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();
    authenticateToken(req, res, next);
    expect(req.userId).toBe(7);
    expect(req.email).toBe('a@b.c');
    expect(next).toHaveBeenCalled();
  });
});

describe('optionalAuth', () => {
  it('без токена — next без userId', () => {
    const req: any = { headers: {} };
    const res = mockRes();
    const next = jest.fn();
    optionalAuth(req, res, next);
    expect(req.userId).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('битый токен — next без падения', () => {
    const req: any = { headers: { authorization: 'Bearer bad' } };
    const res = mockRes();
    const next = jest.fn();
    optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.userId).toBeUndefined();
  });

  it('валидный токен — кладёт userId и next', () => {
    const token = jwt.sign({ userId: 9, email: 'x@y.z' }, SECRET);
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();
    optionalAuth(req, res, next);
    expect(req.userId).toBe(9);
    expect(next).toHaveBeenCalled();
  });
});