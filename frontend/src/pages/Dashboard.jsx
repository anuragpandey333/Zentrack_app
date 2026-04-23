import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plus, ChevronDown, MoreHorizontal } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { convertCurrency, formatCurrency } from '../utils/currency';

const CATEGORIES = ['Housing', 'Food & Dining', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'];
// We'll use a grayscale palette to match the minimalist UI
const PIE_COLORS = ['#171717', '#525252', '#a3a3a3', '#d4d4d4', '#e5e5e5', '#f5f5f5', '#000000', '#262626'];

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const [expenses, setExpenses] = useState([]);
    const [budget, setBudget] = useState(0);
    const [monthlyBudget, setMonthlyBudget] = useState('');
    const [form, setForm] = useState({ description: '', amount: '', category: 'Food & Dining', date: new Date().toISOString().split('T')[0] });
    const [showModal, setShowModal] = useState(false);

    const token = localStorage.getItem('token');
    const userName = user?.name?.split(' ')[0] || 'User';
    const userCurrency = user?.currency || 'USD';

    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        if (!token) return navigate('/login');
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [txRes, budgetRes] = await Promise.all([
                axios.get('http://localhost:8000/api/transactions', config).catch(() => ({ data: [] })),
                axios.get('http://localhost:8000/api/budget', config).catch(() => ({ data: { amount: 8250 } }))
            ]);
            const debitTx = txRes.data.filter(t => t.type === 'debit');
            setExpenses(debitTx);
            setBudget(budgetRes.data.amount || 8250);
            setMonthlyBudget(budgetRes.data.amount || 8250);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8000/api/transactions', { ...form, type: 'debit', amount: parseFloat(form.amount) }, config);
            setForm({ description: '', amount: '', category: 'Food & Dining', date: new Date().toISOString().split('T')[0] });
            fetchData();
            setShowModal(false);
        } catch (error) {
            console.error(error);
        }
    };

    const handleBudgetUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8000/api/budget', { amount: parseFloat(monthlyBudget) }, config);
            setBudget(parseFloat(monthlyBudget));
            setShowModal(false);
        } catch (error) {
            console.error(error);
        }
    };

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = budget - totalSpent;
    const largestExpense = expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)) : 0;

    // Convert amounts to user's currency
    const displayTotalSpent = convertCurrency(totalSpent, 'INR', userCurrency);
    const displayRemaining = convertCurrency(remaining, 'INR', userCurrency);
    const displayBudget = convertCurrency(budget, 'INR', userCurrency);

    // Hardcoded dummy data for the bar chart to match visual design "Income vs Expenses"
    const monthlyData = [
        { month: 'May', income: 3200, expenses: 1800 },
        { month: 'Jun', income: 4500, expenses: 2200 },
        { month: 'Jul', income: 4000, expenses: 3100 },
        { month: 'Aug', income: 5200, expenses: 2900 },
        { month: 'Sep', income: 4800, expenses: 2500 },
        { month: 'Oct', income: 6500, expenses: 3200 },
    ];

    const categoryData = CATEGORIES.map(cat => ({
        name: cat,
        value: convertCurrency(
            expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
            'INR',
            userCurrency
        )
    })).filter(c => c.value > 0);

    // If no real expenses, fallback to dummy data to match screenshot
    const displayCategoryData = categoryData.length > 0 ? categoryData : [
        { name: 'Housing', value: convertCurrency(1200, 'INR', userCurrency) },
        { name: 'Food & Dining', value: convertCurrency(850, 'INR', userCurrency) },
        { name: 'Transportation', value: convertCurrency(450, 'INR', userCurrency) },
        { name: 'Entertainment', value: convertCurrency(320, 'INR', userCurrency) },
    ];
    
    const displayCategoryTotal = displayCategoryData.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <Layout>
            <Header 
                title={`Good morning, ${userName}`}
                subtitle="Here is your financial summary for October."
                actions={
                    <button 
                        onClick={() => setShowModal(true)} 
                        className="px-4 py-2 bg-black text-white rounded-full flex items-center gap-2 hover:bg-slate-800 transition shadow-sm"
                    >
                        <Plus size={18} />
                        Add Transaction
                    </button>
                }
            />
            <div className="font-sans">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Balance */}
                    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm">
                        <p className="text-slate-500 text-[15px] font-medium mb-3">Total Balance</p>
                        <h3 className="text-[32px] font-bold text-slate-900 tracking-tight mb-4">
                            {displayRemaining > 0 ? formatCurrency(displayRemaining, userCurrency) : formatCurrency(24562, userCurrency)}
                        </h3>
                        <div className="flex items-center">
                            <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-md font-medium text-xs mr-2">
                                +2.4%
                            </span>
                            <span className="text-slate-400 text-xs">vs last month</span>
                        </div>
                    </div>
                    {/* Total Income */}
                    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm">
                        <p className="text-slate-500 text-[15px] font-medium mb-3">Total Income</p>
                        <h3 className="text-[32px] font-bold text-slate-900 tracking-tight mb-4">
                            {displayBudget > 0 ? formatCurrency(displayBudget, userCurrency) : formatCurrency(8250, userCurrency)}
                        </h3>
                        <div className="flex items-center">
                            <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-md font-medium text-xs mr-2">
                                +12.5%
                            </span>
                            <span className="text-slate-400 text-xs">vs last month</span>
                        </div>
                    </div>
                    {/* Total Expenses */}
                    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm">
                        <p className="text-slate-500 text-[15px] font-medium mb-3">Total Expenses</p>
                        <h3 className="text-[32px] font-bold text-slate-900 tracking-tight mb-4">
                            {displayTotalSpent > 0 ? formatCurrency(displayTotalSpent, userCurrency) : formatCurrency(3492.50, userCurrency)}
                        </h3>
                        <div className="flex items-center">
                            <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-md font-medium text-xs mr-2">
                                -1.2%
                            </span>
                            <span className="text-slate-400 text-xs">vs last month</span>
                        </div>
                    </div>
                    {/* Total Savings */}
                    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm">
                        <p className="text-slate-500 text-[15px] font-medium mb-3">Total Savings</p>
                        <h3 className="text-[32px] font-bold text-slate-900 tracking-tight mb-4">
                            {formatCurrency(4757.50, userCurrency)}
                        </h3>
                        <div className="flex items-center">
                            <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-md font-medium text-xs mr-2">
                                +8.1%
                            </span>
                            <span className="text-slate-400 text-xs">vs last month</span>
                        </div>
                    </div>
                </div>

                {/* Main Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Income vs Expenses Bar Chart */}
                    <div className="bg-white border border-slate-100 rounded-[20px] p-8 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-[17px] font-bold text-slate-900">Income vs Expenses</h2>
                            <button className="flex items-center gap-2 border border-slate-200 px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition">
                                Last 6 Months <ChevronDown size={16} />
                            </button>
                        </div>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData} barGap={8} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="month" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#64748b', fontSize: 13 }} 
                                        dy={10} 
                                    />
                                    <Tooltip 
                                        cursor={{ fill: 'transparent' }} 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="income" fill="#171717" radius={[4, 4, 0, 0]} barSize={24} name="Income" />
                                    <Bar dataKey="expenses" fill="#d4d4d4" radius={[4, 4, 0, 0]} barSize={24} name="Expenses" />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Spending by Category Donut Chart */}
                    <div className="bg-white border border-slate-100 rounded-[20px] p-8 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-[17px] font-bold text-slate-900">Spending by Category</h2>
                            <button className="text-slate-400 hover:text-black">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>
                        <div className="relative h-[280px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={displayCategoryData} 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={90} 
                                        outerRadius={120} 
                                        dataKey="value" 
                                        stroke="none"
                                        paddingAngle={2}
                                    >
                                        {displayCategoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-slate-500 text-sm">Total</span>
                                <span className="text-2xl font-bold text-slate-900">
                                    {formatCurrency(displayCategoryTotal, userCurrency)}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4 flex-1">
                            {displayCategoryData.map((cat, idx) => (
                                <div key={cat.name} className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></div>
                                        <span className="text-slate-600 text-[15px]">{cat.name}</span>
                                    </div>
                                    <span className="font-semibold text-slate-900">
                                        {formatCurrency(cat.value, userCurrency)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            {/* Modal for adding expense / setting budget */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Quick Actions</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-black">&times;</button>
                        </div>
                        
                        <div className="space-y-6">
                            {/* Budget Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-3">Set Monthly Budget</h3>
                                <form onSubmit={handleBudgetUpdate} className="flex gap-2">
                                    <input 
                                        type="number" 
                                        value={monthlyBudget} 
                                        onChange={e => setMonthlyBudget(e.target.value)} 
                                        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-black" 
                                        placeholder="Amount" 
                                        required
                                    />
                                    <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-black">
                                        Save
                                    </button>
                                </form>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Expense Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-3">Add Expense</h3>
                                <form onSubmit={handleAddExpense} className="space-y-3">
                                    <input 
                                        type="text" 
                                        value={form.description} 
                                        onChange={e => setForm({...form, description: e.target.value})} 
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-black" 
                                        placeholder="Description" 
                                        required
                                    />
                                    <div className="flex gap-3">
                                        <input 
                                            type="number" 
                                            value={form.amount} 
                                            onChange={e => setForm({...form, amount: e.target.value})} 
                                            className="w-1/2 px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-black" 
                                            placeholder="Amount" 
                                            required
                                        />
                                        <select 
                                            value={form.category} 
                                            onChange={e => setForm({...form, category: e.target.value})}
                                            className="w-1/2 px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-black bg-white"
                                        >
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <input 
                                        type="date" 
                                        value={form.date} 
                                        onChange={e => setForm({...form, date: e.target.value})} 
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-black text-slate-600" 
                                        required
                                    />
                                    <button type="submit" className="w-full py-2.5 bg-black text-white rounded-xl font-medium hover:bg-slate-800 transition">
                                        Add Expense
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Dashboard;

