import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  uploadEmployeesController,
  previewEmployeesController,
  getAllEmployeesController,
  getUploadHistoryController,
} from '../controllers/probation.controller.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
export const probationRouter = express.Router();
probationRouter.post('/hr/upload', requireAuth, upload.single('file'), uploadEmployeesController);
probationRouter.post('/hr/preview', requireAuth, upload.single('file'), previewEmployeesController);
probationRouter.get('/hr/employees', requireAuth, getAllEmployeesController);
probationRouter.get('/hr/upload-history', requireAuth, getUploadHistoryController);
