import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Trash2, Sparkles, BarChart3, PieChart as PieChartIcon, FileText, DollarSign, Calendar, Target } from 'lucide-react';

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6', '#f97316'];
const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other'];

const Dashboard = () => {
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState([]);
    const [budget, setBudget] = useState(0);
    const [monthlyBudget, setMonthlyBudget] = useState('');
    const [form, setForm] = useState({ description: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0] });
    const [chartType, setChartType] = useState('bar');
    const [showReportModal, setShowReportModal] = useState(false);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        if (!token) return navigate('/login');
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [txRes, budgetRes] = await Promise.all([
                axios.get('http://localhost:8000/api/transactions', config),
                axios.get('http://localhost:8000/api/budget', config)
            ]);
            const debitTx = txRes.data.filter(t => t.type === 'debit');
            setExpenses(debitTx);
            setBudget(budgetRes.data.amount || 0);
            setMonthlyBudget(budgetRes.data.amount || '');
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8000/api/transactions', { ...form, type: 'debit', amount: parseFloat(form.amount) }, config);
            setForm({ description: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0] });
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:8000/api/transactions/${id}`, config);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleBudgetUpdate = async () => {
        try {
            await axios.post('http://localhost:8000/api/budget', { amount: parseFloat(monthlyBudget) }, config);
            setBudget(parseFloat(monthlyBudget));
        } catch (error) {
            console.error(error);
        }
    };

    const handleAnalyze = () => {
        navigate('/reports');
    };

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = budget - totalSpent;
    const largestExpense = expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)) : 0;

    const categoryData = CATEGORIES.map(cat => ({
        name: cat,
        value: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
    })).filter(c => c.value > 0);

    const categoryBars = CATEGORIES.map(cat => {
        const spent = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
        const percentage = totalSpent > 0 ? (spent / totalSpent * 100).toFixed(1) : 0;
        return { category: cat, spent, percentage };
    }).filter(c => c.spent > 0);

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
                    <p className="text-slate-600 mt-2">Track your expenses and manage your budget</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Monthly Budget Card */}
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <DollarSign size={24} />
                            </div>
                        </div>
                        <p className="text-purple-100 text-sm mb-1">Monthly Budget</p>
                        <h3 className="text-3xl font-bold mb-3">₹{budget.toFixed(2)}</h3>
                        <div className="flex gap-2">
                            <input 
                                type="number" 
                                value={monthlyBudget} 
                                onChange={e => setMonthlyBudget(e.target.value)} 
                                className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 outline-none focus:bg-white/30" 
                                placeholder="Set budget" 
                            />
                            <button 
                                onClick={handleBudgetUpdate} 
                                className="px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition"
                            >
                                Set
                            </button>
                        </div>
                    </div>

                    {/* Total Spent Card */}
                    <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <TrendingDown size={24} />
                            </div>
                        </div>
                        <p className="text-pink-100 text-sm mb-1">Total Spent</p>
                        <h3 className="text-3xl font-bold">₹{totalSpent.toFixed(2)}</h3>
                        <p className="text-pink-100 text-sm mt-2">{expenses.length} transactions</p>
                    </div>

                    {/* Remaining Card */}
                    <div className={`bg-gradient-to-br rounded-2xl p-6 text-white shadow-lg ${
                        remaining < 0 
                            ? 'from-red-500 to-red-600' 
                            : 'from-green-500 to-green-600'
                    }`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Target size={24} />
                            </div>
                        </div>
                        <p className={`text-sm mb-1 ${
                            remaining < 0 ? 'text-red-100' : 'text-green-100'
                        }`}>
                            {remaining < 0 ? 'Over Budget' : 'Remaining'}
                        </p>
                        <h3 className="text-3xl font-bold">₹{Math.abs(remaining).toFixed(2)}</h3>
                        <p className={`text-sm mt-2 ${
                            remaining < 0 ? 'text-red-100' : 'text-green-100'
                        }`}>
                            {remaining < 0 ? 'Reduce spending' : 'Keep it up!'}
                        </p>
                    </div>

                    {/* Largest Expense Card */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Calendar size={24} />
                            </div>
                        </div>
                        <p className="text-blue-100 text-sm mb-1">Largest Expense</p>
                        <h3 className="text-3xl font-bold">₹{largestExpense.toFixed(2)}</h3>
                        <p className="text-blue-100 text-sm mt-2">This month</p>
                    </div>
                </div>

                {/* Charts */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Monthly Breakdown</h2>
                        <div className="flex gap-2">
                            <button onClick={() => setChartType('bar')} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${chartType === 'bar' ? 'bg-purple-600 text-white' : 'bg-slate-100'}`}>
                                <BarChart3 size={18} /> Bar
                            </button>
                            <button onClick={() => setChartType('pie')} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${chartType === 'pie' ? 'bg-purple-600 text-white' : 'bg-slate-100'}`}>
                                <PieChartIcon size={18} /> Donut
                            </button>
                        </div>
                    </div>

                    {chartType === 'bar' ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={categoryData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#8b5cf6" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label>
                                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}

                    {/* Category Bars */}
                    <div className="mt-6 space-y-3">
                        {categoryBars.map((cat, idx) => (
                            <div key={cat.category}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium">{cat.category}</span>
                                    <span className="text-slate-600">₹{cat.spent.toFixed(2)} ({cat.percentage}%)</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div className="h-2 rounded-full" style={{ width: `${cat.percentage}%`, backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Financial Assistant */}
                <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 rounded-2xl shadow-sm border border-purple-200 p-8 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-3">
                                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                                    <Sparkles className="text-white" size={24} />
                                </div>
                                AI Financial Assistant
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                Get comprehensive AI-powered financial insights, spending pattern analysis, 
                                personalized recommendations, and budget optimization advice.
                            </p>
                        </div>
                        <button 
                            onClick={() => navigate('/reports')} 
                            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg transition-all transform hover:scale-105"
                        >
                            <FileText size={20} />
                            View Full Report
                        </button>
                    </div>
                </div>

                {/* Recent Expenses */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Recent Expenses</h2>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                        {expenses.map(exp => (
                            <div key={exp.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100">
                                <div>
                                    <p className="font-semibold text-slate-800">{exp.description}</p>
                                    <p className="text-sm text-slate-500">{exp.category} • {new Date(exp.date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-slate-800">₹{exp.amount.toFixed(2)}</span>
                                    <button onClick={() => handleDelete(exp.id)} className="text-red-500 hover:text-red-700">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
