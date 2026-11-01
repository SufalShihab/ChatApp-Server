import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { getUsersForSidebar, toggleBlockUser, getUserProfile } from '../controllers/userController.js';

const router = express.Router();

router.get('/', protect, getUsersForSidebar);
router.get('/profile/:id', protect, getUserProfile); // নতুন যোগ করা হলো
router.put('/block/:userIdToBlock', protect, toggleBlockUser);

export default router;