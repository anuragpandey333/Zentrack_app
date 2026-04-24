import prisma from '../lib/prisma.js';
import { sendSecurityAlert, sendMonthlyReport, sendBudgetWarning, sendNewFeatureNotification } from '../services/emailService.js';

export const getNotificationPreferences = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                notifySecurityAlerts: true,
                notifyMonthlyReports: true,
                notifyBudgetWarnings: true,
                notifyNewFeatures: true
            }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateNotificationPreferences = async (req, res) => {
    const { notifySecurityAlerts, notifyMonthlyReports, notifyBudgetWarnings, notifyNewFeatures } = req.body;
    
    try {
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                notifySecurityAlerts,
                notifyMonthlyReports,
                notifyBudgetWarnings,
                notifyNewFeatures
            }
        });
        res.json({ message: 'Notification preferences updated', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const checkBudgetAndNotify = async (userId) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.notifyBudgetWarnings) return;

        const budget = await prisma.budget.findUnique({ where: { userId } });
        if (!budget) return;

        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                type: 'debit',
                date: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }
        });

        const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
        const percentage = (totalSpent / budget.amount) * 100;

        if (percentage >= 80) {
            await sendBudgetWarning(user, {
                percentage,
                spent: totalSpent,
                budget: budget.amount,
                currency: user.currency || 'USD',
                category: 'monthly'
            });
        }
    } catch (error) {
        console.error('Error checking budget:', error);
    }
};
