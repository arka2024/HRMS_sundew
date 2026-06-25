import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  uploadEmployeesController,
  previewEmployeesController,
  getAllEmployeesController,
  getUploadHistoryController,
  createEmployeeController,
  updateEmployeeController,
  deleteEmployeeController,
} from '../controllers/probation.controller.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
export const probationRouter = express.Router();
probationRouter.post('/hr/upload', requireAuth, upload.single('file'), uploadEmployeesController);
probationRouter.post('/hr/preview', requireAuth, upload.single('file'), previewEmployeesController);
probationRouter.get('/hr/employees', requireAuth, getAllEmployeesController);
probationRouter.post('/hr/employees', requireAuth, createEmployeeController);
probationRouter.put('/hr/employees/:employeeNumber', requireAuth, updateEmployeeController);
probationRouter.delete('/hr/employees/:employeeNumber', requireAuth, deleteEmployeeController);
probationRouter.get('/hr/upload-history', requireAuth, getUploadHistoryController);
