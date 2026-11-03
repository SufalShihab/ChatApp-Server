import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { getOrCreateConversation, getUserConversations,hideConversation } from '../controllers/chatController.js';

const router = express.Router();

router.post('/', protect, getOrCreateConversation);
router.get('/', protect, getUserConversations);
router.put('/hide/:conversationId', protect, hideConversation);
export default router;