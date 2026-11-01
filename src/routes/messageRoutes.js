import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { sendMessage, getMessages, deleteMessage, addReaction } from '../controllers/messageController.js';
import { upload } from '../utils/cloudinary.js';

const router = express.Router();

router.post('/', protect, upload.array('attachments', 5), sendMessage);
router.get('/:conversationId', protect, getMessages);
router.put('/:messageId/reaction', protect, addReaction); // রিঅ্যাকশনের রুট
router.delete('/:messageId', protect, deleteMessage);

export default router;