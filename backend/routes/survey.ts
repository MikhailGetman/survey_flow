

import express from 'express';
import { surveyController } from '../controllers/surveyController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = express.Router();


router.get('/public/:link', optionalAuth, surveyController.getByPublicLink);
router.post('/:surveyId/respond', optionalAuth, surveyController.submitResponse);


router.use(authenticateToken);


router.post('/', surveyController.create);
router.get('/my', surveyController.getMySurveys);
router.get('/taken', surveyController.getTakenSurveys);


router.get('/:surveyId', surveyController.getSurveyById);
router.put('/:surveyId', surveyController.update);
router.delete('/:surveyId', surveyController.delete);


router.get('/:surveyId/results', surveyController.getResults);
router.get('/:surveyId/stats', surveyController.getSurveyStats);
router.get('/:surveyId/detailed-results', surveyController.getDetailedResults);


router.get('/:surveyId/respondent/:responseId', surveyController.getRespondentInfo);
router.delete('/:surveyId/response/:responseId', surveyController.deleteResponse);


router.get('/:surveyId/export', surveyController.exportResults);

export default router;