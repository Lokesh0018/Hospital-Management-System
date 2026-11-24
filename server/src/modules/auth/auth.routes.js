import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema
} from './auth.validation.js';

const router = Router();

// Public Authentication Routes
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', authRateLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

// Protected Authentication Routes
router.get('/me', authenticate, AuthController.getMe);
router.post('/change-password', authenticate, validate(changePasswordSchema), AuthController.changePassword);

export default router;
