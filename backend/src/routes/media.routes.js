import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { uploadMedia } from '../middlewares/upload.middleware.js';
import { uploadMediaFile, listUploadedMedia } from '../controllers/media.controller.js';

const router = Router();

// Protected routes
router.use(requireAuth);

router.post('/upload', uploadMedia.single('file'), uploadMediaFile);
router.get('/', listUploadedMedia);

export default router;
