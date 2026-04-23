import prisma from '../lib/prisma.js';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const generateReport = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Fetch all user data
        const transactions = await prisma.transaction.findMany({
            where: { userId, type: 'debit' },
            orderBy: { date: 'desc' }
        });

        const budget = await prisma.budget.findUnique({ where: { userId } });
        
        // Get category budgets
        const categoryBudgets = await prisma.categoryBudget.findMany({
            where: { userId }
        });

        // Calculate summary
        const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);
        
        const categoryTotals = transactions.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

        const sortedCategories = Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1]);

        // Calculate budget usage per category
        const categoryBudgetStatus = categoryBudgets.map(cb => {
            const spent = categoryTotals[cb.category] || 0;
            const percentage = (spent / cb.limit) * 100;
            return {
                category: cb.category,
                limit: cb.limit,
                spent,
                remaining: cb.limit - spent,
                percentage: percentage.toFixed(1),
                status: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'good'
            };
        });

        // Generate AI analysis
        const prompt = `You are a professional financial advisor analyzing a user's monthly expenses. Provide a comprehensive financial report.

Financial Data:
- Total Monthly Expenses: ₹${totalExpenses.toFixed(2)}
- Monthly Budget: ₹${budget?.amount || 0}
- Number of Transactions: ${transactions.length}
- Top 3 Spending Categories: ${sortedCategories.slice(0, 3).map(([cat, amt]) => `${cat} (₹${amt.toFixed(2)})`).join(', ')}
- Category Breakdown: ${JSON.stringify(categoryTotals)}

Provide a detailed analysis in JSON format:
{
  "summary": "2-3 sentence overview of financial health",
  "whyExpensesHigh": "Detailed explanation of why expenses are high (3-4 sentences)",
  "spendingPatterns": ["pattern 1", "pattern 2", "pattern 3"],
  "suggestions": ["specific suggestion 1", "specific suggestion 2", "specific suggestion 3", "specific suggestion 4", "specific suggestion 5"],
  "warnings": ["warning 1", "warning 2"],
  "budgetAdvice": "Specific advice on budget optimization (2-3 sentences)"
}

Be specific, actionable, and encouraging. Focus on concrete steps they can take.`;

        let aiAnalysis = null;
        try {
            const message = await anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 2048,
                messages: [{ role: 'user', content: prompt }]
            });
            aiAnalysis = JSON.parse(message.content[0].text);
        } catch (aiError) {
            console.error('AI Error:', aiError);
            // Fallback to rule-based analysis
            aiAnalysis = generateFallbackAnalysis(totalExpenses, budget?.amount || 0, categoryTotals, transactions.length);
        }

        // Prepare response
        const report = {
            summary: {
                totalExpenses,
                monthlyBudget: budget?.amount || 0,
                remaining: (budget?.amount || 0) - totalExpenses,
                transactionCount: transactions.length,
                categoryTotals: sortedCategories.map(([cat, amt]) => ({ category: cat, amount: amt }))
            },
            categoryBudgetStatus,
            aiAnalysis,
            transactions: transactions.slice(0, 20), // Latest 20
            generatedAt: new Date().toISOString()
        };

        res.json(report);
    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Fallback analysis when AI is unavailable
const generateFallbackAnalysis = (totalExpenses, budget, categoryTotals, transactionCount) => {
    const remaining = budget - totalExpenses;
    const isOverBudget = remaining < 0;
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const topCategory = sortedCategories[0];

    return {
        summary: isOverBudget 
            ? `You've exceeded your budget by ₹${Math.abs(remaining).toFixed(2)}. Your spending needs immediate attention.`
            : `You're ${((totalExpenses/budget)*100).toFixed(1)}% through your budget with ₹${remaining.toFixed(2)} remaining.`,
        
        whyExpensesHigh: `Your highest spending is in ${topCategory[0]} at ₹${topCategory[1].toFixed(2)}, accounting for ${((topCategory[1]/totalExpenses)*100).toFixed(1)}% of total expenses. With ${transactionCount} transactions this month, your average transaction is ₹${(totalExpenses/transactionCount).toFixed(2)}. This suggests frequent spending in multiple categories.`,
        
        spendingPatterns: [
            `Heavy spending in ${topCategory[0]} category`,
            `${transactionCount} transactions indicate ${transactionCount > 50 ? 'very frequent' : transactionCount > 30 ? 'frequent' : 'moderate'} spending`,
            sortedCategories.length > 5 ? 'Expenses spread across many categories' : 'Focused spending in few categories'
        ],
        
        suggestions: [
            `Reduce ${topCategory[0]} expenses by 20% through meal planning or bulk buying`,
            'Track daily expenses to identify unnecessary purchases',
            'Set category-specific budgets to control spending',
            'Use cash for discretionary spending to limit overspending',
            'Review subscriptions and cancel unused services'
        ],
        
        warnings: isOverBudget 
            ? ['Budget exceeded - immediate action required', `${topCategory[0]} spending is too high`]
            : remaining < budget * 0.2 
                ? ['Less than 20% budget remaining', 'Reduce discretionary spending']
                : [],
        
        budgetAdvice: `Set specific limits for each category. Allocate ${((budget * 0.3).toFixed(0))} for essentials, ${((budget * 0.2).toFixed(0))} for ${topCategory[0]}, and keep 15% as emergency buffer.`
    };
};

export const getCategoryBudgets = async (req, res) => {
    try {
        const budgets = await prisma.categoryBudget.findMany({
            where: { userId: req.user.id }
        });
        res.json(budgets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const setCategoryBudget = async (req, res) => {
    const { category, limit } = req.body;
    try {
        const budget = await prisma.categoryBudget.upsert({
            where: { 
                userId_category: { 
                    userId: req.user.id, 
                    category 
                } 
            },
            update: { limit },
            create: { 
                userId: req.user.id, 
                category, 
                limit 
            }
        });
        res.json(budget);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteCategoryBudget = async (req, res) => {
    const { category } = req.params;
    try {
        await prisma.categoryBudget.delete({
            where: { 
                userId_category: { 
                    userId: req.user.id, 
                    category 
                } 
            }
        });
        res.json({ message: 'Category budget deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
