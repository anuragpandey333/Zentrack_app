import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { useUser } from '../context/UserContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Plus, ShoppingCart, Coffee, Car, Tv, ShoppingBag, Lightbulb, Home, FileText, Activity } from 'lucide-react';
import { convertCurrency, formatCurrency, getCurrencySymbol } from '../utils/currency';

const CATEGORY_ICONS = {
    'Food & Dining': <Coffee size={20} className="text-slate-600" />,
    'Groceries': <ShoppingCart size={20} className="text-slate-600" />,
    'Transportation': <Car size={20} className="text-slate-600" />,
    'Entertainment': <Tv size={20} className="text-slate-600" />,
    'Shopping': <ShoppingBag size={20} className="text-slate-600" />,
    'Housing': <Home size={20} className="text-slate-600" />,
    'Bills': <FileText size={20} className="text-slate-600" />,
    'Health': <Activity size={20} className="text-slate-600" />,
    'Other': <ShoppingCart size={20} className="text-slate-600" />,
};

// Default category limits for demo purposes
const DEFAULT_LIMITS = {
    'Food & Dining': 5000,
    'Groceries': 10000,
    'Transportation': 3000,
    'Entertainment': 2000,
    'Shopping': 4000,
    'Housing': 15000,
    'Bills': 5000,
    'Health': 2000,
    'Other': 2000
};

const CATEGORIES = Object.keys(DEFAULT_LIMITS);

const Budgets = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const userCurrency = user?.currency || 'USD';
    const [expenses, setExpenses] = useState([]);
    const [totalBudget, setTotalBudget] = useState(0);
    const [customLimits, setCustomLimits] = useState({});
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [budgetForm, setBudgetForm] = useState({ category: CATEGORIES[0], limit: '' });

    const token = localStorage.getItem('token');

    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        if (!token) return navigate('/login');
        
        // Load custom category budgets from localStorage
        const savedLimits = localStorage.getItem('customCategoryLimits');
        if (savedLimits) {
            try {
                setCustomLimits(JSON.parse(savedLimits));
            } catch (e) {
                console.error("Failed to parse custom limits");
            }
        }
        
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [txRes, budgetRes] = await Promise.all([
                axios.get('http://localhost:8000/api/transactions', config).catch(() => ({ data: [] })),
                axios.get('http://localhost:8000/api/budget', config).catch(() => ({ data: { amount: 35000 } }))
            ]);
            const debitTx = txRes.data.filter(t => t.type === 'debit');
            setExpenses(debitTx);
            setTotalBudget(budgetRes.data.amount || 35000);
        } catch (error) {
            console.error(error);
        }
    };

    // Calculate spend per category
    const categorySpend = expenses.reduce((acc, expense) => {
        const cat = expense.category || 'Other';
        acc[cat] = (acc[cat] || 0) + expense.amount;
        return acc;
    }, {});

    // Merge default limits with custom limits
    const activeLimits = { ...DEFAULT_LIMITS, ...customLimits };

    // Prepare data for the list
    const budgetData = Object.keys(activeLimits).map(cat => {
        const spent = categorySpend[cat] || 0;
        const limit = activeLimits[cat];
        const percentage = Math.round((spent / limit) * 100) || 0;
        const left = limit - spent;
        return {
            category: cat,
            spent: convertCurrency(spent, 'INR', userCurrency),
            limit: convertCurrency(limit, 'INR', userCurrency),
            percentage,
            left: convertCurrency(left, 'INR', userCurrency),
            icon: CATEGORY_ICONS[cat] || <ShoppingCart size={20} className="text-slate-600" />
        };
    }).filter(item => item.spent > 0 || item.limit > 0).sort((a, b) => b.percentage - a.percentage);

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const overallRemaining = totalBudget - totalSpent;
    const overspentTotal = budgetData.reduce((sum, item) => item.left < 0 ? sum + Math.abs(item.left) : sum, 0);

    // Convert to user currency
    const displayTotalSpent = convertCurrency(totalSpent, 'INR', userCurrency);
    const displayTotalBudget = convertCurrency(totalBudget, 'INR', userCurrency);
    const displayRemaining = convertCurrency(overallRemaining, 'INR', userCurrency);
    const displayOverspent = convertCurrency(overspentTotal, 'INR', userCurrency);

    const handleCreateBudget = (e) => {
        e.preventDefault();
        const newLimits = {
            ...customLimits,
            [budgetForm.category]: parseFloat(budgetForm.limit)
        };
        setCustomLimits(newLimits);
        localStorage.setItem('customCategoryLimits', JSON.stringify(newLimits));
        setShowModal(false);
        setBudgetForm({ category: CATEGORIES[0], limit: '' });
    };

    // Generate dynamic tip based on budget data
    const generateTip = () => {
        if (budgetData.length === 0) return "Start tracking your expenses to see personalized tips here.";
        
        // Find the category with the highest percentage spent
        const highestCategory = budgetData[0]; // Already sorted by percentage descending
        
        if (highestCategory.percentage >= 100) {
            return `You have exceeded your ${highestCategory.category} budget by ${formatCurrency(Math.abs(highestCategory.left), userCurrency)}. Try to review your recent expenses to find areas to cut back next month.`;
        } else if (highestCategory.percentage >= 80) {
            return `You've used ${highestCategory.percentage}% of your ${highestCategory.category} budget. Consider reducing expenses here to stay within your ${formatCurrency(highestCategory.limit, userCurrency)} limit.`;
        } else if (totalSpent === 0) {
            return "You haven't spent anything yet this month. Keep up the good savings habits!";
        } else {
            return "You're on track with your budgets this month! All categories are well within their limits.";
        }
    };

    // Chart Data
    // We want the chart to show total spent vs remaining. 
    // If overspent, remaining is 0 and we might show a different color.
    const chartData = [
        { name: 'Spent', value: displayTotalSpent, fill: '#171717' },
        { name: 'Remaining', value: displayRemaining > 0 ? displayRemaining : 0, fill: '#f1f5f9' },
    ];
    if (displayTotalSpent > displayTotalBudget && displayTotalBudget > 0) {
        chartData[0].fill = '#ef4444'; // Red if over total budget
    }

    return (
        <Layout>
            <Header 
                title="Budgets"
                subtitle="Track your spending limits across categories."
                actions={
                    <button 
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-black text-white rounded-full flex items-center gap-2 hover:bg-slate-800 transition shadow-sm"
                    >
                        <Plus size={18} />
                        Create Budget
                    </button>
                }
            />
            <div className="font-sans">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Monthly Category Budgets */}
                    <div className="lg:col-span-2">
                        <div className="bg-white border border-slate-100 rounded-[24px] p-8 shadow-sm">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-[18px] font-bold text-slate-900">Monthly Category Budgets</h2>
                                <button 
                                    onClick={() => setShowModal(true)}
                                    className="flex items-center gap-2 border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                                >
                                    <Plus size={16} /> Create Budget
                                </button>
                            </div>

                            <div className="space-y-8">
                                {budgetData.length > 0 ? budgetData.map((item, idx) => {
                                    const isOver = item.percentage >= 100;
                                    const isNear = item.percentage >= 85 && !isOver;
                                    const barColor = isOver ? 'bg-red-500' : isNear ? 'bg-red-400' : 'bg-slate-600';
                                    const textColor = isOver ? 'text-red-500' : 'text-slate-900';
                                    
                                    return (
                                        <div key={idx} className="flex flex-col">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                                                        {item.icon}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-[15px] font-semibold text-slate-900">{item.category}</h3>
                                                        <p className="text-sm text-slate-400">
                                                            {formatCurrency(item.spent, userCurrency)} of {formatCurrency(item.limit, userCurrency)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-[15px] font-bold ${textColor}`}>
                                                        {item.percentage}%
                                                    </p>
                                                    <p className="text-sm text-slate-400">
                                                        {item.left < 0 ? 'Over budget' : `${formatCurrency(item.left, userCurrency)} left`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                                                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <p className="text-slate-500 text-center py-4">No budget data available.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Overall Spending */}
                        <div className="bg-white border border-slate-100 rounded-[24px] p-8 shadow-sm">
                            <h2 className="text-[18px] font-bold text-slate-900 mb-6">Overall Spending</h2>
                            
                            <div className="relative h-[240px] w-full flex items-center justify-center mb-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={chartData} 
                                            cx="50%" 
                                            cy="50%" 
                                            innerRadius={85} 
                                            outerRadius={110} 
                                            dataKey="value" 
                                            stroke="none"
                                            startAngle={90}
                                            endAngle={-270}
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-slate-500 text-[13px] font-medium mb-1">Total Spent</span>
                                    <span className="text-[28px] font-bold text-slate-900 tracking-tight leading-none mb-1">
                                        {formatCurrency(displayTotalSpent, userCurrency)}
                                    </span>
                                    <span className="text-slate-400 text-xs">
                                        of {formatCurrency(displayTotalBudget, userCurrency)} limit
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 rounded-2xl p-4 flex flex-col justify-center items-start">
                                    <span className="text-slate-500 text-xs font-semibold tracking-wider mb-1 uppercase">Remaining</span>
                                    <span className="text-xl font-bold text-emerald-500">
                                        {displayRemaining > 0 ? formatCurrency(displayRemaining, userCurrency) : formatCurrency(0, userCurrency)}
                                    </span>
                                </div>
                                <div className="bg-red-50 rounded-2xl p-4 flex flex-col justify-center items-start">
                                    <span className="text-red-400 text-xs font-semibold tracking-wider mb-1 uppercase">Overspent</span>
                                    <span className="text-xl font-bold text-red-500">
                                        {formatCurrency(displayOverspent, userCurrency)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm">
                            <h3 className="text-[16px] font-bold text-slate-900 mb-4">Tips</h3>
                            <div className="flex gap-4">
                                <div className="mt-1">
                                    <Lightbulb size={20} className="text-slate-600" />
                                </div>
                                <p className="text-[14px] text-slate-500 leading-relaxed">
                                    {generateTip()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for Creating Category Budget */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Set Category Limit</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-black">&times;</button>
                        </div>
                        
                        <form onSubmit={handleCreateBudget} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                <select 
                                    value={budgetForm.category} 
                                    onChange={e => setBudgetForm({...budgetForm, category: e.target.value})}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-black bg-white"
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Limit ({getCurrencySymbol(userCurrency)})</label>
                                <input 
                                    type="number" 
                                    value={budgetForm.limit} 
                                    onChange={e => setBudgetForm({...budgetForm, limit: e.target.value})} 
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-black" 
                                    placeholder="e.g. 5000" 
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full py-2.5 mt-2 bg-black text-white rounded-xl font-medium hover:bg-slate-800 transition">
                                Save Budget
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Budgets;
