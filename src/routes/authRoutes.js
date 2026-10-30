import express from 'express';
import { register, login } from '../controllers/authController.js';
import { updateProfilePic } from '../controllers/userController.js'; // এটি এখানে ইমপোর্ট করতে হবে

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/update-pic', updateProfilePic); // রাউট

export default router;