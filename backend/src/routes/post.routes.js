import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import {
  createPost,
  listPosts,
  getPost,
  updatePost,
  deletePost,
  publishPost,
  getPostStatus,
  createPostSchema,
  updatePostSchema,
} from '../controllers/post.controller.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

router.post('/', validateBody(createPostSchema), createPost);
router.get('/', listPosts);
router.get('/:id', getPost);
router.put('/:id', validateBody(updatePostSchema), updatePost);
router.delete('/:id', deletePost);
router.post('/:id/publish', publishPost);
router.get('/:id/status', getPostStatus);

export default router;
