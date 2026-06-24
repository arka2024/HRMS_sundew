import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getEvaluationsController,
  getDashboardStatsController,
  getEmployeeReportController,
  getBulkReportController,
  saveEvaluationController,
  lockEvaluationController,
  unlockEvaluationController,
  exportExcelController,
  seedEvaluationsController,
  exportPDFController
} from '../controllers/evaluation.controller.js';

export const evaluationRouter = express.Router();

evaluationRouter.get('/evaluation-reports', requireAuth, getEvaluationsController);
evaluationRouter.get('/evaluation-reports/dashboard', requireAuth, getDashboardStatsController);
evaluationRouter.get('/evaluation-reports/:employeeId', requireAuth, getEmployeeReportController);
evaluationRouter.post('/evaluation-reports/bulk', requireAuth, getBulkReportController);
evaluationRouter.post('/evaluation-reports/save', requireAuth, saveEvaluationController);
evaluationRouter.post('/evaluation-reports/lock/:employeeId/:monthKey', requireAuth, lockEvaluationController);
evaluationRouter.post('/evaluation-reports/unlock/:employeeId/:monthKey', requireAuth, unlockEvaluationController);
evaluationRouter.get('/evaluation-reports/export/excel', requireAuth, exportExcelController);
evaluationRouter.get('/evaluation-reports/export/pdf', requireAuth, exportPDFController);
evaluationRouter.post('/evaluation-reports/seed', requireAuth, seedEvaluationsController);
