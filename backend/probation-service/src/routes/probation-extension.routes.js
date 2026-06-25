import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  createProbationExtensionController,
  getProbationExtensionsController,
  getProbationExtensionByIdController,
  updateProbationExtensionController,
  approveProbationExtensionByManagerController,
  approveProbationExtensionController,
  rejectProbationExtensionController,
  deleteProbationExtensionController,
} from '../controllers/probationExtension.controller.js';

export const probationExtensionRouter = express.Router();

probationExtensionRouter.post('/probation-extensions', requireAuth, createProbationExtensionController);
probationExtensionRouter.get('/probation-extensions', requireAuth, getProbationExtensionsController);
probationExtensionRouter.get('/probation-extensions/:id', requireAuth, getProbationExtensionByIdController);
probationExtensionRouter.put('/probation-extensions/:id', requireAuth, updateProbationExtensionController);
probationExtensionRouter.post('/probation-extensions/:id/manager-approve', requireAuth, approveProbationExtensionByManagerController);
probationExtensionRouter.post('/probation-extensions/:id/approve', requireAuth, approveProbationExtensionController);
probationExtensionRouter.post('/probation-extensions/:id/reject', requireAuth, rejectProbationExtensionController);
probationExtensionRouter.delete('/probation-extensions/:id', requireAuth, deleteProbationExtensionController);
