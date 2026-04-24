import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { sendMonthlyReport } from '../services/emailService.js';

// Run on the 1st of every month at 9:00 AM
export const scheduleMonthlyReports = () => {
    cron.schedule('0 9 1 * *', async () => {
        console.log('Running monthly report job...');
        
        try {
            const users = await prisma.user.findMany({
                where: { notifyMonthlyReports: true }
            });

            for (const user of users) {
                const lastMonth = new Date();
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                
                const startOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
                const endOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

                const transactions = await prisma.transaction.findMany({
                    where: {
                        userId: user.id,
                        date: {
                            gte: startOfMonth,
                            lte: endOfMonth
                        }
                    }
                });

                const income = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
                const expenses = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
                const savings = income - expenses;

                const categoryTotals = {};
                transactions.filter(t => t.type === 'debit').forEach(t => {
                    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
                });

                const topCategories = Object.entries(categoryTotals)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([name, amount]) => ({ name, amount }));

                const monthName = lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

                await sendMonthlyReport(user, {
                    month: monthName,
                    totalIncome: income,
                    totalExpenses: expenses,
                    savings,
                    currency: user.currency || 'USD',
                    topCategories,
                    insight: savings >= 0 
                        ? `Great job! You saved ${user.currency || 'USD'}${savings.toFixed(2)} this month.`
                        : `You spent ${user.currency || 'USD'}${Math.abs(savings).toFixed(2)} more than you earned this month.`
                });
            }

            console.log(`Monthly reports sent to ${users.length} users`);
        } catch (error) {
            console.error('Error sending monthly reports:', error);
        }
    });

    console.log('Monthly report scheduler initialized');
};
