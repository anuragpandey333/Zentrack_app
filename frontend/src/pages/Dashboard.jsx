import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import AIReportModal from '../components/AIReportModal';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Trash2, Sparkles, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6', '#f97316'];
const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other'];

const Dashboard = () => {
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState([]);
    const [budget, setBudget] = useState(0);
    const [monthlyBudget, setMonthlyBudget] = useState('');
    const [form, setForm] = useState({ description: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0] });
    const [chartType, setChartType] = useState('bar');
    const [aiReport, setAiReport] = useState(null);
    const [loading, setLoading] = useState(false);
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

    const handleAnalyze = async () => {
        setShowReportModal(true);
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
                <h1 className="text-3xl font-bold text-slate-800 mb-8">💰 Expense Tracker</h1>

                {/* Add Expense Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Add Expense</h2>
                    <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <input type="text" placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="px-4 py-2 border rounded-lg" required />
                        <input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="px-4 py-2 border rounded-lg" required />
                        <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="px-4 py-2 border rounded-lg">
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="px-4 py-2 border rounded-lg" />
                        <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 font-semibold">Add</button>
                    </form>
                </div>

                {/* Budget & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <p className="text-sm text-slate-500 mb-2">Monthly Budget</p>
                        <div className="flex gap-2">
                            <input type="number" value={monthlyBudget} onChange={e => setMonthlyBudget(e.target.value)} className="px-3 py-1 border rounded-lg w-full" placeholder="Set budget" />
                            <button onClick={handleBudgetUpdate} className="bg-slate-800 text-white px-4 py-1 rounded-lg text-sm">Set</button>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <p className="text-sm text-slate-500 mb-2">Total Spent</p>
                        <h3 className="text-2xl font-bold text-slate-800">₹{totalSpent.toFixed(2)}</h3>
                    </div>
                    <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 ${remaining < 0 ? 'border-red-500' : ''}`}>
                        <p className="text-sm text-slate-500 mb-2">Remaining</p>
                        <h3 className={`text-2xl font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>₹{remaining.toFixed(2)}</h3>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <p className="text-sm text-slate-500 mb-2">Largest Expense</p>
                        <h3 className="text-2xl font-bold text-slate-800">₹{largestExpense.toFixed(2)}</h3>
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

                {/* AI Analysis */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl shadow-sm border border-purple-100 p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Sparkles className="text-purple-600" /> AI Financial Assistant
                            </h2>
                            <p className="text-sm text-slate-600 mt-1">Get personalized insights and recommendations</p>
                        </div>
                        <button 
                            onClick={handleAnalyze} 
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold flex items-center gap-2 shadow-lg transition-all transform hover:scale-105"
                        >
                            <Sparkles size={18} /> View Report
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

                {/* AI Report Modal */}
                <AIReportModal 
                    isOpen={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    reportData={aiReport}
                    expenses={expenses}
                    budget={budget}
                />
            </div>
        </Layout>
    );
};

export default Dashboard;
