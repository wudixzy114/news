import { Router } from 'express';
import { getAllSources } from './sources.controller';

const router = Router();
router.get('/', getAllSources);

export default router;