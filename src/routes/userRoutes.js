import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { 
  getUsersForSidebar, 
  updateProfilePic, 
  toggleBlockUser, 
  getUserProfile 
} from '../controllers/userController.js';

const router = express.Router();
router.get('/profile/:id', protect, getUserProfile);
router.get('/', protect, getUsersForSidebar);
router.put('/update-profile-pic', protect, updateProfilePic);
router.put('/block/:userIdToBlock', protect, toggleBlockUser);

// এটি যেন সবার শেষে থাকে
router.get('/:id', protect, getUserProfile);

export default router;