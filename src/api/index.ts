import { Router } from 'express';
import authRoutes from './auth/auth.routes';
import articleRoutes from './articles/articles.routes';
import userRoutes from './users/users.routes';
import sourceRoutes from './sources/sources.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/articles', articleRoutes);
router.use('/users', userRoutes);
router.use('/sources', sourceRoutes);

export default router;