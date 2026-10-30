import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { sendMessage, getMessages } from '../controllers/messageController.js';

const router = express.Router();

router.post('/', protect, sendMessage);
router.get('/:conversationId', protect, getMessages);

export default router;