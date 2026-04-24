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
    const [income, setIncome] = useState([]);
    const [budget, setBudget] = useState(0);
    const [monthlyBudget, setMonthlyBudget] = useState(0);
    const [form, setForm] = useState({ description: '', amount: '', category: 'Food & Dining', date: new Date().toISOString().split('T')[0] });
    const [incomeForm, setIncomeForm] = useState({ description: '', amount: '', date: new Date().toISOString().split('T')[0] });
    const [showModal, setShowModal] = useState(false);

    const token = localStorage.getItem('token');
    const userName = user?.name?.split(' ')[0] || 'User';
    const userCurrency = user?.currency || 'USD';

    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        if (!token) return navigate('/login');
        fetchData();
    }, [token, navigate]);

    useEffect(() => {
        const handleFocus = () => fetchData();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const fetchData = async () => {
        try {
            const [txRes, budgetRes] = await Promise.all([
                axios.get('http://localhost:8000/api/transactions', config).catch(() => ({ data: [] })),
                axios.get('http://localhost:8000/api/budget', config).catch(() => ({ data: { amount: 0 } }))
            ]);
            
            // Separate income and expenses
            const allTransactions = txRes.data || [];
            const debitTx = allTransactions.filter(t => t.type === 'debit');
            const creditTx = allTransactions.filter(t => t.type === 'credit');
            
            setExpenses(debitTx);
            setIncome(creditTx);
            setBudget(budgetRes.data.amount || 0);
            setMonthlyBudget(budgetRes.data.amount || 0);
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

    const handleAddIncome = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8000/api/transactions', { 
                ...incomeForm, 
                type: 'credit', 
                amount: parseFloat(incomeForm.amount),
                category: 'Income'
            }, config);
            setIncomeForm({ description: '', amount: '', date: new Date().toISOString().split('T')[0] });
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

    // Calculate percentage changes vs last month
    const calculateMonthlyChanges = () => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        
        // Filter transactions for current month
        const currentMonthIncome = income.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
        }).reduce((sum, tx) => sum + tx.amount, 0);
        
        const currentMonthExpenses = expenses.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
        }).reduce((sum, tx) => sum + tx.amount, 0);
        
        // Filter transactions for last month
        const lastMonthIncome = income.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate.getMonth() === lastMonth && txDate.getFullYear() === lastMonthYear;
        }).reduce((sum, tx) => sum + tx.amount, 0);
        
        const lastMonthExpenses = expenses.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate.getMonth() === lastMonth && txDate.getFullYear() === lastMonthYear;
        }).reduce((sum, tx) => sum + tx.amount, 0);
        
        // Calculate percentage changes
        const incomeChange = lastMonthIncome > 0 
            ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome * 100).toFixed(1)
            : 0;
        
        const expensesChange = lastMonthExpenses > 0 
            ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses * 100).toFixed(1)
            : 0;
        
        const currentBalance = currentMonthIncome - currentMonthExpenses;
        const lastBalance = lastMonthIncome - lastMonthExpenses;
        const balanceChange = lastBalance !== 0
            ? ((currentBalance - lastBalance) / Math.abs(lastBalance) * 100).toFixed(1)
            : 0;
        
        const currentSavings = currentMonthIncome - currentMonthExpenses;
        const lastSavings = lastMonthIncome - lastMonthExpenses;
        const savingsChange = lastSavings !== 0
            ? ((currentSavings - lastSavings) / Math.abs(lastSavings) * 100).toFixed(1)
            : 0;
        
        return {
            incomeChange: parseFloat(incomeChange),
            expensesChange: parseFloat(expensesChange),
            balanceChange: parseFloat(balanceChange),
            savingsChange: parseFloat(savingsChange),
            hasLastMonthData: lastMonthIncome > 0 || lastMonthExpenses > 0
        };
    };
    
    const monthlyChanges = calculateMonthlyChanges();
    
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = income.reduce((sum, e) => sum + e.amount, 0);
    const remaining = totalIncome - totalSpent;
    const hasData = expenses.length > 0 || income.length > 0;

    // Convert amounts to user's currency
    const displayTotalSpent = convertCurrency(totalSpent, 'INR', userCurrency);
    const displayTotalIncome = convertCurrency(totalIncome, 'INR', userCurrency);
    const displayRemaining = convertCurrency(remaining, 'INR', userCurrency);
    const displayBudget = convertCurrency(budget, 'INR', userCurrency);

    // Calculate savings (income - expenses)
    const savings = totalIncome - totalSpent;
    const displaySavings = convertCurrency(savings, 'INR', userCurrency);

    // Group transactions by month and calculate income/expenses
    const getMonthlyData = () => {
        if (!hasData) return [];
        
        const monthlyMap = {};
        
        // Process all transactions
        [...income, ...expenses].forEach(tx => {
            const date = new Date(tx.date);
            const monthKey = date.toLocaleString('en-US', { month: 'short' });
            
            if (!monthlyMap[monthKey]) {
                monthlyMap[monthKey] = { month: monthKey, income: 0, expenses: 0, date: date };
            }
            
            if (tx.type === 'credit') {
                monthlyMap[monthKey].income += tx.amount;
            } else if (tx.type === 'debit') {
                monthlyMap[monthKey].expenses += tx.amount;
            }
        });
        
        // Convert to array and sort by date
        return Object.values(monthlyMap)
            .sort((a, b) => a.date - b.date)
            .slice(-6) // Last 6 months
            .map(item => ({
                month: item.month,
                income: convertCurrency(item.income, 'INR', userCurrency),
                expenses: convertCurrency(item.expenses, 'INR', userCurrency)
            }));
    };

    const monthlyData = getMonthlyData();

    const categoryData = CATEGORIES.map(cat => ({
        name: cat,
        value: convertCurrency(
            expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
            'INR',
            userCurrency
        )
    })).filter(c => c.value > 0);

    const displayCategoryData = categoryData;
    const displayCategoryTotal = displayCategoryData.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <Layout>
            <Header 
                title={`Good morning, ${userName}`}
                subtitle="Here is your financial summary for this Month."
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
                        <h3 className="text-[32px] font-bold text-slate-900 tracking-tight mb-4 truncate">
                            {formatCurrency(displayRemaining, userCurrency)}
                        </h3>
                        {hasData && monthlyChanges.hasLastMonthData && (
                            <div className="flex items-center">
                                <span className={`${monthlyChanges.balanceChange >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} px-2.5 py-1 rounded-md font-medium text-xs mr-2`}>
                                    {monthlyChanges.balanceChange >= 0 ? '+' : ''}{monthlyChanges.balanceChange}%
                                </span>
                                <span className="text-slate-400 text-xs">vs last month</span>
                            </div>
                        )}
                    </div>
                    {/* Total Income */}
                    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm">
                        <p className="text-slate-500 text-[15px] font-medium mb-3">Total Income</p>
                        <h3 className="text-[32px] font-bold text-slate-900 tracking-tight mb-4 truncate">
                            {formatCurrency(displayTotalIncome, userCurrency)}
                        </h3>
                        {hasData && totalIncome > 0 && monthlyChanges.hasLastMonthData && (
                            <div className="flex items-center">
                                <span className={`${monthlyChanges.incomeChange >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} px-2.5 py-1 rounded-md font-medium text-xs mr-2`}>
                                    {monthlyChanges.incomeChange >= 0 ? '+' : ''}{monthlyChanges.incomeChange}%
                                </span>
                                <span className="text-slate-400 text-xs">vs last month</span>
                            </div>
                        )}
                    </div>
                    {/* Total Expenses */}
                    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm">
                        <p className="text-slate-500 text-[15px] font-medium mb-3">Total Expenses</p>
                        <h3 className="text-[32px] font-bold text-slate-900 tracking-tight mb-4 truncate">
                            {formatCurrency(displayTotalSpent, userCurrency)}
                        </h3>
                        {hasData && monthlyChanges.hasLastMonthData && (
                            <div className="flex items-center">
                                <span className={`${monthlyChanges.expensesChange <= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} px-2.5 py-1 rounded-md font-medium text-xs mr-2`}>
                                    {monthlyChanges.expensesChange >= 0 ? '+' : ''}{monthlyChanges.expensesChange}%
                                </span>
                                <span className="text-slate-400 text-xs">vs last month</span>
                            </div>
                        )}
                    </div>
                    {/* Total Savings */}
                    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm">
                        <p className="text-slate-500 text-[15px] font-medium mb-3">Total Savings</p>
                        <h3 className="text-[32px] font-bold text-slate-900 tracking-tight mb-4 truncate">
                            {formatCurrency(displaySavings, userCurrency)}
                        </h3>
                        {hasData && monthlyChanges.hasLastMonthData && (
                            <div className="flex items-center">
                                <span className={`${monthlyChanges.savingsChange >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} px-2.5 py-1 rounded-md font-medium text-xs mr-2`}>
                                    {monthlyChanges.savingsChange >= 0 ? '+' : ''}{monthlyChanges.savingsChange}%
                                </span>
                                <span className="text-slate-400 text-xs">vs last month</span>
                            </div>
                        )}
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
                            {hasData ? (
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
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <BarChart size={28} className="text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 text-sm mb-2">No transaction data yet</p>
                                    <p className="text-slate-400 text-xs">Add your first transaction to see insights</p>
                                </div>
                            )}
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
                        {hasData && displayCategoryData.length > 0 ? (
                            <>
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
                                        <div key={cat.name} className="flex justify-between items-center gap-2">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></div>
                                                <span className="text-slate-600 text-[15px] truncate">{cat.name}</span>
                                            </div>
                                            <span className="font-semibold text-slate-900 text-[15px] shrink-0">
                                                {formatCurrency(cat.value, userCurrency)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center flex-1">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <PieChart size={28} className="text-slate-400" />
                                </div>
                                <p className="text-slate-500 text-sm mb-2">No expenses yet</p>
                                <p className="text-slate-400 text-xs text-center">Start tracking your spending by category</p>
                            </div>
                        )}
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

                            {/* Income Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-3">Add Income</h3>
                                <form onSubmit={handleAddIncome} className="space-y-3">
                                    <input 
                                        type="text" 
                                        value={incomeForm.description} 
                                        onChange={e => setIncomeForm({...incomeForm, description: e.target.value})} 
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-black" 
                                        placeholder="Description" 
                                        required
                                    />
                                    <input 
                                        type="number" 
                                        value={incomeForm.amount} 
                                        onChange={e => setIncomeForm({...incomeForm, amount: e.target.value})} 
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-black" 
                                        placeholder="Amount" 
                                        required
                                    />
                                    <input 
                                        type="date" 
                                        value={incomeForm.date} 
                                        onChange={e => setIncomeForm({...incomeForm, date: e.target.value})} 
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-black text-slate-600" 
                                        required
                                    />
                                    <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition">
                                        Add Income
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

