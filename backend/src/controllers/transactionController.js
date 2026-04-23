import prisma from '../lib/prisma.js';

export const getTransactions = async (req, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            where: { userId: req.user.id },
            orderBy: { date: 'desc' }
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addTransaction = async (req, res) => {
    const { type, amount, category, description, date } = req.body;
    try {
        const transaction = await prisma.transaction.create({
            data: {
                userId: req.user.id,
                type,
                amount,
                category,
                description,
                date: date ? new Date(date) : new Date()
            }
        });
        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteTransaction = async (req, res) => {
    try {
        const transaction = await prisma.transaction.findUnique({ where: { id: req.params.id } });
        if (transaction && transaction.userId === req.user.id) {
            await prisma.transaction.delete({ where: { id: req.params.id } });
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
        const transactions = await prisma.transaction.findMany({ where: { userId: req.user.id } });
        const totalCredit = transactions.filter(t => t.type === 'credit').reduce((acc, t) => acc + t.amount, 0);
        const totalDebit = transactions.filter(t => t.type === 'debit').reduce((acc, t) => acc + t.amount, 0);
        res.json({
            count: transactions.length,
            totalCredit,
            totalDebit,
            balance: totalCredit - totalDebit
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
