import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { getUsersForSidebar } from '../controllers/userController.js';

const router = express.Router();

router.get('/', protect, getUsersForSidebar);

export default router;