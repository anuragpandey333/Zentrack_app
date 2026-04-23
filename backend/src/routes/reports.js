import express from 'express';
import { generateReport, getCategoryBudgets, setCategoryBudget, deleteCategoryBudget } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/generate', protect, generateReport);
router.get('/category-budgets', protect, getCategoryBudgets);
router.post('/category-budgets', protect, setCategoryBudget);
router.delete('/category-budgets/:category', protect, deleteCategoryBudget);

export default router;
