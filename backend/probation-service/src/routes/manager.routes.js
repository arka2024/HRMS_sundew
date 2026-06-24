import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getEmployeesForManagerController } from '../controllers/manager.controller.js';

export const managerRouter = express.Router();
managerRouter.get('/manager/employees', requireAuth, getEmployeesForManagerController);
