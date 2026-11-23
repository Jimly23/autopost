import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import {
  connect,
  callback,
  listAccounts,
  getAccount,
  deleteAccount,
  getProfile,
} from '../controllers/instagram.controller.js';

const router = Router();

// OAuth flow
router.get('/connect', requireAuth, connect);
router.get('/callback', callback); // No auth — user returns from Instagram

// Account management (all require auth)
router.get('/accounts', requireAuth, listAccounts);
router.get('/accounts/:id', requireAuth, getAccount);
router.delete('/accounts/:id', requireAuth, deleteAccount);

// Profile
router.get('/accounts/:id/profile', requireAuth, getProfile);

export default router;
