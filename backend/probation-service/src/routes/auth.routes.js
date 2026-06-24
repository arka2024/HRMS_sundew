import express from 'express';
import { loginController, registerController } from '../controllers/auth.controller.js';

export const authRouter = express.Router();
authRouter.post('/login', loginController);
authRouter.post('/register', registerController);
