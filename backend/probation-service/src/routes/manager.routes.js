import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getEmployeesForManagerController,
  getAllManagersController,
  getManagerByIdController,
  createManagerController,
  updateManagerController,
} from '../controllers/manager.controller.js';

export const managerRouter = express.Router();

managerRouter.get('/manager/employees', requireAuth, getEmployeesForManagerController);
managerRouter.get('/managers', requireAuth, getAllManagersController);
managerRouter.get('/managers/:managerId', requireAuth, getManagerByIdController);
managerRouter.post('/managers', requireAuth, createManagerController);
managerRouter.put('/managers/:managerId', requireAuth, updateManagerController);
