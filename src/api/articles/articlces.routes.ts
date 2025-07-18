import { Router } from 'express';
import { getArticles, getArticleById, saveArticle, unsaveArticle } from './articles.controller';
import { protect, optionalAuth } from '../../core/middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, getArticles);
router.get('/:id', optionalAuth, getArticleById);
router.post('/:id/save', protect, saveArticle);
router.delete('/:id/save', protect, unsaveArticle);

export default router;