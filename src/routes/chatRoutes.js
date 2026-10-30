import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { getOrCreateConversation, getUserConversations } from '../controllers/chatController.js';

const router = express.Router();

router.post('/', protect, getOrCreateConversation);
router.get('/', protect, getUserConversations);

export default router;