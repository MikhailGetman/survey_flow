import request from 'supertest';
import express from 'express';
import surveyRouter from '../src/routes/survey';
import { surveyController } from '../src/controllers/surveyController';
import { authenticateToken } from '../src/middleware/auth';

jest.mock('../src/controllers/surveyController', () => ({
  surveyController: {
    getByPublicLink: jest.fn((req, res) => res.json({ ok: true })),
    submitResponse: jest.fn((req, res) => res.json({ ok: true })),
    create: jest.fn((req, res) => res.json({ ok: true })),
    getMySurveys: jest.fn((req, res) => res.json({ ok: true })),
    getTakenSurveys: jest.fn((req, res) => res.json({ ok: true })),
    getSurveyById: jest.fn((req, res) => res.json({ ok: true })),
    update: jest.fn((req, res) => res.json({ ok: true })),
    delete: jest.fn((req, res) => res.json({ ok: true })),
  },
}));

jest.mock('../src/middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => next()),
  optionalAuth: jest.fn((req, res, next) => next()),
}));

const app = express();
app.use(express.json());
app.use('/surveys', surveyRouter);

describe('survey routes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /surveys/public/:link доступен без токена', async () => {
    await request(app).get('/surveys/public/abc');
    expect(surveyController.getByPublicLink).toHaveBeenCalled();
  });

  it('POST /surveys/:surveyId/respond доступен без токена', async () => {
    await request(app).post('/surveys/1/respond');
    expect(surveyController.submitResponse).toHaveBeenCalled();
  });

  it('POST /surveys требует авторизации', async () => {
    await request(app).post('/surveys');
    expect(authenticateToken).toHaveBeenCalled();
    expect(surveyController.create).toHaveBeenCalled();
  });

  it('GET /surveys/my требует авторизации', async () => {
    await request(app).get('/surveys/my');
    expect(authenticateToken).toHaveBeenCalled();
    expect(surveyController.getMySurveys).toHaveBeenCalled();
  });

  it('GET /surveys/taken требует авторизации', async () => {
    await request(app).get('/surveys/taken');
    expect(authenticateToken).toHaveBeenCalled();
    expect(surveyController.getTakenSurveys).toHaveBeenCalled();
  });

  it('GET /surveys/:surveyId требует авторизации', async () => {
    await request(app).get('/surveys/1');
    expect(authenticateToken).toHaveBeenCalled();
    expect(surveyController.getSurveyById).toHaveBeenCalled();
  });

  it('PUT /surveys/:surveyId требует авторизации', async () => {
    await request(app).put('/surveys/1');
    expect(authenticateToken).toHaveBeenCalled();
    expect(surveyController.update).toHaveBeenCalled();
  });

  it('DELETE /surveys/:surveyId требует авторизации', async () => {
    await request(app).delete('/surveys/1');
    expect(authenticateToken).toHaveBeenCalled();
    expect(surveyController.delete).toHaveBeenCalled();
  });
});