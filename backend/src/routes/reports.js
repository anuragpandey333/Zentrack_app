import express from 'express';
import { generateReport, getCategoryBudgets, setCategoryBudget, deleteCategoryBudget, generateAIInsights } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/generate', protect, generateReport);
router.get('/category-budgets', protect, getCategoryBudgets);
router.post('/category-budgets', protect, setCategoryBudget);
router.delete('/category-budgets/:category', protect, deleteCategoryBudget);
router.get('/ai-insights', protect, generateAIInsights);

export default router;
