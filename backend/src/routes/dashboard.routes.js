import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { getOverview } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/overview', requireAuth, getOverview);

export default router;
