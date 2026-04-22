import { Transaction } from '../models/Transaction.js';

export const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.id }).sort({ date: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addTransaction = async (req, res) => {
    const { type, amount, category, description, date } = req.body;
    try {
        const transaction = await Transaction.create({
            userId: req.user.id,
            type,
            amount,
            category,
            description,
            date: date || Date.now()
        });
        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (transaction && transaction.userId.toString() === req.user.id) {
            await transaction.deleteOne();
            res.json({ message: 'Transaction removed' });
        } else {
            res.status(404).json({ message: 'Transaction not found or not authorized' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getDashboardSummary = async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.id });
        const totalTransactions = transactions.length;
        const totalCredit = transactions.filter(t => t.type === 'credit').reduce((acc, curr) => acc + curr.amount, 0);
        const totalDebit = transactions.filter(t => t.type === 'debit').reduce((acc, curr) => acc + curr.amount, 0);
        const balance = totalCredit - totalDebit;

        res.json({
            count: totalTransactions,
            totalCredit,
            totalDebit,
            balance
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
