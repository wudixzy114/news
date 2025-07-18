import { Router } from 'express';
import { register, login, getMe } from './auth.controller';
import { registerValidator, loginValidator } from './auth.validator';
import { validate } from '../../core/middleware/validator.middleware';
import { protect } from '../../core/middleware/auth.middleware';

const router = Router();

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.get('/me', protect, getMe);

export default router;