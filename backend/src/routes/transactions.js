import express from 'express';
import { getTransactions, addTransaction, deleteTransaction, getDashboardSummary } from '../controllers/transactionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/summary', protect, getDashboardSummary);
router.get('/', protect, getTransactions);
router.post('/', protect, addTransaction);
router.delete('/:id', protect, deleteTransaction);

export default router;
