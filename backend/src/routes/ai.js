import express from 'express';
import { analyzeFinances } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/analyze', protect, analyzeFinances);

export default router;
