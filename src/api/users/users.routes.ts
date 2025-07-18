import { Router } from 'express';
import { getMySavedArticles } from './users.controller';
import { protect } from '../../core/middleware/auth.middleware';

const router = Router();

router.get('/me/saved-articles', protect, getMySavedArticles);

export default router;