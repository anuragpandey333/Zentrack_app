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
                        content: 'You are an expert financial advisor. Analyze expense data and provide clear, actionable insights in JSON format. Be specific, practical, and user-friendly.'
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

export const generateAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Fetch user data
        const transactions = await prisma.transaction.findMany({
            where: { userId, type: 'debit' },
            orderBy: { date: 'desc' }
        });

        const budget = await prisma.budget.findUnique({ where: { userId } });

        if (transactions.length === 0) {
            return res.status(400).json({ message: 'No transactions found to analyze' });
        }

        // Calculate statistics
        const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);
        const remaining = (budget?.amount || 0) - totalExpenses;
        
        const categoryTotals = transactions.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

        const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
        const avgTransaction = totalExpenses / transactions.length;

        // Prepare prompt for Grok
        const prompt = `Analyze this user's expense data and provide comprehensive financial insights.

Financial Data:
- Monthly Budget: ₹${budget?.amount || 0}
- Total Expenses: ₹${totalExpenses.toFixed(2)}
- Remaining: ₹${remaining.toFixed(2)}
- Number of Transactions: ${transactions.length}
- Average Transaction: ₹${avgTransaction.toFixed(2)}
- Category Breakdown: ${JSON.stringify(categoryTotals)}

Provide analysis in this exact JSON format:
{
  "expenseAnalysis": {
    "highest": [
      {"category": "CategoryName", "amount": 0, "percentage": 0}
    ],
    "lowest": [
      {"category": "CategoryName", "amount": 0, "percentage": 0}
    ],
    "unusual": ["Pattern description 1", "Pattern description 2"]
  },
  "budgetComparison": {
    "usagePercent": 0,
    "status": "overspending or saving",
    "insights": ["Insight 1", "Insight 2", "Insight 3"]
  },
  "recommendations": [
    {
      "title": "Recommendation Title",
      "description": "Specific actionable advice"
    }
  ],
  "futurePlanning": {
    "budgetSuggestion": "Detailed budget allocation advice",
    "trendPrediction": "Prediction about future spending",
    "actionItems": ["Action 1", "Action 2", "Action 3"]
  },
  "summary": "2-3 sentence overall financial health summary"
}

Requirements:
- Identify top 3 highest and lowest spending categories
- Detect unusual patterns (high frequency, large amounts, unnecessary spending)
- Provide 5-6 specific, actionable recommendations
- Compare budget vs actual spending with clear insights
- Suggest future budget improvements
- Predict potential overspending trends
- Keep language simple and user-friendly
- Be encouraging but honest about financial situation`;

        let aiAnalysis;
        try {
            aiAnalysis = await callGrokAPI(prompt);
        } catch (aiError) {
            console.error('Grok AI Error:', aiError);
            // Fallback to rule-based analysis
            aiAnalysis = generateFallbackAnalytics(
                totalExpenses,
                budget?.amount || 0,
                categoryTotals,
                transactions.length,
                avgTransaction
            );
        }

        res.json(aiAnalysis);
    } catch (error) {
        console.error('Analytics generation error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Fallback analytics when AI is unavailable
const generateFallbackAnalytics = (totalExpenses, budget, categoryTotals, transactionCount, avgTransaction) => {
    const remaining = budget - totalExpenses;
    const usagePercent = budget > 0 ? ((totalExpenses / budget) * 100).toFixed(1) : 0;
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

    // Highest spending categories
    const highest = sortedCategories.slice(0, 3).map(([category, amount]) => ({
        category,
        amount,
        percentage: ((amount / totalExpenses) * 100).toFixed(1)
    }));

    // Lowest spending categories
    const lowest = sortedCategories.slice(-3).reverse().map(([category, amount]) => ({
        category,
        amount,
        percentage: ((amount / totalExpenses) * 100).toFixed(1)
    }));

    // Detect unusual patterns
    const unusual = [];
    if (transactionCount > 50) {
        unusual.push('High transaction frequency detected - consider consolidating purchases');
    }
    if (avgTransaction > 1000) {
        unusual.push('Large average transaction amount - review for unnecessary big purchases');
    }
    sortedCategories.forEach(([cat, amt]) => {
        if (amt > totalExpenses * 0.4) {
            unusual.push(`${cat} spending is unusually high at ${((amt/totalExpenses)*100).toFixed(0)}% of total`);
        }
    });

    // Budget comparison
    const budgetComparison = {
        usagePercent: parseFloat(usagePercent),
        status: remaining < 0 ? 'overspending' : 'saving',
        insights: [
            remaining < 0 
                ? `You've exceeded your budget by ₹${Math.abs(remaining).toFixed(2)}`
                : `You're saving ₹${remaining.toFixed(2)} this month`,
            `Your top spending category is ${highest[0].category} at ${highest[0].percentage}%`,
            transactionCount > 40 
                ? 'High number of transactions - consider tracking daily spending'
                : 'Good transaction discipline maintained'
        ]
    };

    // Recommendations
    const recommendations = [
        {
            title: `Reduce ${highest[0].category} Spending`,
            description: `Your ${highest[0].category} expenses are ₹${highest[0].amount.toFixed(2)}. Try to reduce by 20% through better planning.`
        },
        {
            title: 'Set Category Budgets',
            description: 'Create specific limits for each spending category to better control expenses.'
        },
        {
            title: 'Track Daily Expenses',
            description: 'Monitor your spending daily to catch overspending early and adjust behavior.'
        },
        {
            title: 'Use Cash for Discretionary Spending',
            description: 'Withdraw a fixed amount for non-essential purchases to limit impulse buying.'
        },
        {
            title: 'Review Subscriptions',
            description: 'Cancel unused subscriptions and services to free up monthly budget.'
        },
        {
            title: 'Plan Major Purchases',
            description: 'Wait 24 hours before making large purchases to avoid impulse decisions.'
        }
    ];

    // Future planning
    const futurePlanning = {
        budgetSuggestion: `Based on your spending, allocate ₹${(budget * 0.3).toFixed(0)} for ${highest[0].category}, ₹${(budget * 0.25).toFixed(0)} for ${highest[1]?.category || 'essentials'}, and keep 15% as emergency buffer.`,
        trendPrediction: remaining < 0 
            ? 'If current spending continues, you may exceed budget by 10-15% next month. Immediate action needed.'
            : 'Your spending is controlled. Maintain current habits to continue saving.',
        actionItems: [
            'Set weekly spending limits',
            'Review and categorize all transactions',
            'Create an emergency fund with savings',
            'Automate savings transfers on payday'
        ]
    };

    // Summary
    const summary = remaining < 0
        ? `You've spent ₹${totalExpenses.toFixed(2)} against a budget of ₹${budget.toFixed(2)}, exceeding by ₹${Math.abs(remaining).toFixed(2)}. Your highest expense is ${highest[0].category} at ₹${highest[0].amount.toFixed(2)}. Focus on reducing discretionary spending and setting category limits to get back on track.`
        : `Great job! You've spent ₹${totalExpenses.toFixed(2)} out of ₹${budget.toFixed(2)}, saving ₹${remaining.toFixed(2)}. Your primary expense is ${highest[0].category}. Continue monitoring your spending and consider investing your savings for better returns.`;

    return {
        expenseAnalysis: { highest, lowest, unusual },
        budgetComparison,
        recommendations,
        futurePlanning,
        summary
    };
};
