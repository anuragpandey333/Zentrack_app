import express from 'express';
import { generateAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/generate', protect, generateAnalytics);

export default router;
