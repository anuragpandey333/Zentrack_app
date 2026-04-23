import Anthropic from '@anthropic-ai/sdk';
import prisma from '../lib/prisma.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const analyzeFinances = async (req, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            where: { userId: req.user.id, type: 'debit' },
            orderBy: { date: 'desc' }
        });

        const budget = await prisma.budget.findUnique({ where: { userId: req.user.id } });
        const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
        const remaining = (budget?.amount || 0) - totalSpent;
        
        const categoryBreakdown = transactions.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

        const sortedCategories = Object.entries(categoryBreakdown)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        const prompt = `You are a professional financial advisor. Analyze this monthly spending data and provide actionable insights.

Financial Data:
- Monthly Budget: ₹${budget?.amount || 0}
- Total Spent: ₹${totalSpent.toFixed(2)}
- Remaining: ₹${remaining.toFixed(2)}
- Status: ${remaining < 0 ? 'OVER BUDGET' : 'Within Budget'}
- Number of Transactions: ${transactions.length}
- Top Spending Categories: ${sortedCategories.map(([cat, amt]) => `${cat} (₹${amt.toFixed(2)})`).join(', ')}

Provide:
1. A concise 2-3 sentence financial analysis highlighting key concerns or achievements
2. Exactly 5 specific, actionable recommendations tailored to this spending pattern

Format as JSON:
{
  "report": "your 2-3 sentence analysis",
  "recommendations": ["tip1", "tip2", "tip3", "tip4", "tip5"]
}

Be specific, practical, and encouraging. Focus on concrete actions they can take.`;

        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }]
        });

        const response = JSON.parse(message.content[0].text);
        res.json({
            ...response,
            metadata: {
                totalSpent,
                remaining,
                budget: budget?.amount || 0,
                transactionCount: transactions.length,
                topCategories: sortedCategories
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
