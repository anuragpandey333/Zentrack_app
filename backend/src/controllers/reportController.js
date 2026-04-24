import prisma from '../lib/prisma.js';
import axios from 'axios';

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const GROK_API_KEY = process.env.GROK_API_KEY;

const callGrokAPI = async (prompt) => {
    try {
        const response = await axios.post(
            GROK_API_URL,
            {
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional financial advisor. Provide detailed, actionable financial advice in JSON format.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                model: 'grok-beta',
                stream: false,
                temperature: 0.7
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROK_API_KEY}`
                }
            }
        );
        
        const content = response.data.choices[0].message.content;
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[1] || jsonMatch[0]);
        }
        return JSON.parse(content);
    } catch (error) {
        console.error('Grok API Error:', error.response?.data || error.message);
        throw error;
    }
};

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

        // Generate AI analysis using Grok
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
            aiAnalysis = await callGrokAPI(prompt);
        } catch (aiError) {
            console.error('Grok AI Error:', aiError);
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

export const generateAIInsights = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const transactions = await prisma.transaction.findMany({
            where: { userId, type: 'debit' },
            orderBy: { date: 'desc' }
        });

        const budget = await prisma.budget.findUnique({ where: { userId } });

        if (transactions.length === 0) {
            return res.status(400).json({ message: 'No transactions to analyze' });
        }

        const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);
        const remaining = (budget?.amount || 0) - totalExpenses;
        
        const categoryTotals = transactions.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

        const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

        const prompt = `Analyze this user's expense data and provide brief, actionable insights.

Financial Data:
- Monthly Budget: ₹${budget?.amount || 0}
- Total Expenses: ₹${totalExpenses.toFixed(2)}
- Remaining: ₹${remaining.toFixed(2)}
- Transactions: ${transactions.length}
- Category Breakdown: ${JSON.stringify(categoryTotals)}

Provide analysis in JSON format:
{
  "observations": ["observation 1", "observation 2", "observation 3"],
  "patterns": ["pattern 1", "pattern 2"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "budgetComparison": "Brief budget vs actual comparison with percentage"
}

Keep each point short (1 sentence). Be specific and actionable.`;

        let insights;
        try {
            const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
            const response = await axios.post(
                GROK_API_URL,
                {
                    messages: [
                        { role: 'system', content: 'You are a financial advisor. Provide brief, clear insights.' },
                        { role: 'user', content: prompt }
                    ],
                    model: 'grok-beta',
                    temperature: 0.7
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.GROK_API_KEY}`
                    }
                }
            );
            
            const content = response.data.choices[0].message.content;
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
            insights = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } catch (aiError) {
            console.error('Grok AI Error:', aiError);
            // Fallback
            const usagePercent = budget?.amount > 0 ? ((totalExpenses / budget.amount) * 100).toFixed(1) : 0;
            insights = {
                observations: [
                    `Your highest spending is in ${sortedCategories[0][0]} at ₹${sortedCategories[0][1].toFixed(2)}`,
                    `You've made ${transactions.length} transactions this month`,
                    `Average transaction amount is ₹${(totalExpenses / transactions.length).toFixed(2)}`
                ],
                patterns: [
                    sortedCategories[0][1] > totalExpenses * 0.3 ? `${sortedCategories[0][0]} spending is unusually high` : 'Spending is well distributed',
                    transactions.length > 40 ? 'High transaction frequency detected' : 'Moderate spending frequency'
                ],
                suggestions: [
                    `Consider reducing ${sortedCategories[0][0]} expenses by 15-20%`,
                    'Set category-specific budgets for better control',
                    'Track daily expenses to catch overspending early'
                ],
                budgetComparison: remaining < 0 
                    ? `You've exceeded your budget by ₹${Math.abs(remaining).toFixed(2)} (${usagePercent}% used)`
                    : `You're ${usagePercent}% through your budget with ₹${remaining.toFixed(2)} remaining`
            };
        }

        res.json(insights);
    } catch (error) {
        console.error('AI Insights error:', error);
        res.status(500).json({ message: error.message });
    }
};
