import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { 
  sendFriendRequest, 
  getFriendRequests, 
  acceptFriendRequest, 
  rejectFriendRequest,
  getMyFriends,
  getUserNotifications,
  getUserFriends
} from '../controllers/friendController.js';

const router = express.Router();

router.post('/send', protect, sendFriendRequest);
router.get('/', protect, getFriendRequests);
router.get('/my-friends', protect, getMyFriends);
// নির্দিষ্ট ইউজারের ফ্রেন্ডস পাওয়ার রুট
router.get('/user/:userId', protect, getUserFriends);
router.get('/notifications', protect, getUserNotifications);
router.put('/accept/:requestId', protect, acceptFriendRequest);
router.delete('/reject/:requestId', protect, rejectFriendRequest);

export default router;