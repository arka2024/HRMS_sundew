import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  createAssociateManagerMappingController,
  getAssociateManagerMappingsController,
  getAssociateManagerMappingByIdController,
  updateAssociateManagerMappingController,
  deactivateAssociateManagerMappingController,
  deleteAssociateManagerMappingController,
} from '../controllers/associateManagerMapping.controller.js';

export const associateManagerMappingRouter = express.Router();

associateManagerMappingRouter.post('/associate-manager-mappings', requireAuth, createAssociateManagerMappingController);
associateManagerMappingRouter.get('/associate-manager-mappings', requireAuth, getAssociateManagerMappingsController);
associateManagerMappingRouter.get('/associate-manager-mappings/:id', requireAuth, getAssociateManagerMappingByIdController);
associateManagerMappingRouter.put('/associate-manager-mappings/:id', requireAuth, updateAssociateManagerMappingController);
associateManagerMappingRouter.post('/associate-manager-mappings/:id/deactivate', requireAuth, deactivateAssociateManagerMappingController);
associateManagerMappingRouter.delete('/associate-manager-mappings/:id', requireAuth, deleteAssociateManagerMappingController);
