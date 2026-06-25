import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  createEvaluationUnlockRequestController,
  getEvaluationUnlockRequestsController,
  getEvaluationUnlockRequestByIdController,
  updateEvaluationUnlockRequestController,
  approveEvaluationUnlockRequestController,
  rejectEvaluationUnlockRequestController,
} from '../controllers/evaluationUnlockRequest.controller.js';

export const evaluationUnlockRequestRouter = express.Router();

evaluationUnlockRequestRouter.post('/evaluation-unlock-requests', requireAuth, createEvaluationUnlockRequestController);
evaluationUnlockRequestRouter.get('/evaluation-unlock-requests', requireAuth, getEvaluationUnlockRequestsController);
evaluationUnlockRequestRouter.get('/evaluation-unlock-requests/:id', requireAuth, getEvaluationUnlockRequestByIdController);
evaluationUnlockRequestRouter.put('/evaluation-unlock-requests/:id', requireAuth, updateEvaluationUnlockRequestController);
evaluationUnlockRequestRouter.post('/evaluation-unlock-requests/:id/approve', requireAuth, approveEvaluationUnlockRequestController);
evaluationUnlockRequestRouter.post('/evaluation-unlock-requests/:id/reject', requireAuth, rejectEvaluationUnlockRequestController);
