import express from 'express';
import { getNotificationPreferences, updateNotificationPreferences } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/preferences', authenticate, getNotificationPreferences);
router.put('/preferences', authenticate, updateNotificationPreferences);

export default router;
