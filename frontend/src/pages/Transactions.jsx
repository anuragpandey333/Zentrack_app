import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Plus, Trash2, Target, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { notificationManager } from '../utils/notifications';
import { reportService } from '../services/api';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other'];

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [categoryBudgets, setCategoryBudgets] = useState([]);
    const [formData, setFormData] = useState({ 
        type: 'debit', 
        amount: '', 
        category: 'Food', 
        description: '' 
    });
    const [budgetForm, setBudgetForm] = useState({ category: 'Food', limit: '' });
    const [showBudgetForm, setShowBudgetForm] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        await Promise.all([fetchTransactions(), fetchCategoryBudgets()]);
    };

    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('http://localhost:8000/api/transactions', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTransactions(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchCategoryBudgets = async () => {
        try {
            const data = await reportService.getCategoryBudgets();
            setCategoryBudgets(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:8000/api/transactions', {
                ...formData,
                amount: parseFloat(formData.amount)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFormData({ type: 'debit', amount: '', category: 'Food', description: '' });
            fetchData();
            notificationManager.success('Transaction added successfully!');
        } catch (error) {
            console.error(error);
            notificationManager.error('Failed to add transaction');
        }
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8000/api/transactions/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
            notificationManager.success('Transaction deleted');
        } catch (error) {
            console.error(error);
            notificationManager.error('Failed to delete transaction');
        }
    };

    const handleAddBudget = async (e) => {
        e.preventDefault();
        if (!budgetForm.limit || parseFloat(budgetForm.limit) <= 0) {
            notificationManager.error('Please enter a valid budget amount');
            return;
        }

        try {
            await reportService.setCategoryBudget(budgetForm.category, parseFloat(budgetForm.limit));
            notificationManager.success(`Budget set for ${budgetForm.category}`);
            setBudgetForm({ category: 'Food', limit: '' });
            setShowBudgetForm(false);
            fetchCategoryBudgets();
        } catch (error) {
            notificationManager.error('Failed to set budget');
        }
    };

    const handleDeleteBudget = async (category) => {
        try {
            await reportService.deleteCategoryBudget(category);
            notificationManager.success(`Budget removed for ${category}`);
            fetchCategoryBudgets();
        } catch (error) {
            notificationManager.error('Failed to delete budget');
        }
    };

    // Calculate spending per category
    const categorySpending = transactions
        .filter(t => t.type === 'debit')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

    // Calculate budget status
    const budgetStatus = categoryBudgets.map(cb => {
        const spent = categorySpending[cb.category] || 0;
        const percentage = (spent / cb.limit) * 100;
        return {
            ...cb,
            spent,
            remaining: cb.limit - spent,
            percentage: percentage.toFixed(1),
            status: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'good'
        };
    });

    const availableCategories = CATEGORIES.filter(
        cat => !categoryBudgets.find(b => b.category === cat)
    );

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">Transactions</h1>
                    <p className="text-slate-600 mt-2">Manage your expenses and track category budgets</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Forms */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Add Transaction Form */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Plus size={20} className="text-purple-600" />
                                Add Transaction
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                    >
                                        <option value="debit">Expense</option>
                                        <option value="credit">Income</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Amount</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        required
                                        value={formData.amount}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                        placeholder="₹ 0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                                    <input
                                        type="text"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                        placeholder="Optional"
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold shadow-md transition-all transform hover:scale-105"
                                >
                                    <Plus size={18} />
                                    Add Transaction
                                </button>
                            </form>
                        </div>

                        {/* Category Budget Manager */}
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-sm border border-purple-200">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Target size={20} className="text-purple-600" />
                                Category Budgets
                            </h2>
                            
                            {!showBudgetForm ? (
                                <button
                                    onClick={() => setShowBudgetForm(true)}
                                    disabled={availableCategories.length === 0}
                                    className="w-full py-2.5 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {availableCategories.length > 0 ? 'Add Budget Limit' : 'All Categories Set'}
                                </button>
                            ) : (
                                <form onSubmit={handleAddBudget} className="space-y-3">
                                    <select
                                        value={budgetForm.category}
                                        onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    >
                                        {availableCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="Budget limit (₹)"
                                        value={budgetForm.limit}
                                        onChange={(e) => setBudgetForm({ ...budgetForm, limit: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowBudgetForm(false);
                                                setBudgetForm({ category: 'Food', limit: '' });
                                            }}
                                            className="flex-1 py-2 px-4 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Budget Status & Transactions */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Budget Status Cards */}
                        {budgetStatus.length > 0 && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <TrendingUp size={20} className="text-purple-600" />
                                    Budget vs Spending
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {budgetStatus.map((budget) => (
                                        <div 
                                            key={budget.id} 
                                            className={`p-4 rounded-xl border-2 transition ${
                                                budget.status === 'exceeded' 
                                                    ? 'bg-red-50 border-red-300' 
                                                    : budget.status === 'warning' 
                                                    ? 'bg-yellow-50 border-yellow-300' 
                                                    : 'bg-green-50 border-green-300'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-bold text-slate-800">{budget.category}</h3>
                                                    <p className="text-sm text-slate-600">Limit: ₹{budget.limit.toFixed(2)}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                        budget.status === 'exceeded' 
                                                            ? 'bg-red-200 text-red-800' 
                                                            : budget.status === 'warning' 
                                                            ? 'bg-yellow-200 text-yellow-800' 
                                                            : 'bg-green-200 text-green-800'
                                                    }`}>
                                                        {budget.percentage}%
                                                    </span>
                                                    <button
                                                        onClick={() => handleDeleteBudget(budget.category)}
                                                        className="p-1 text-slate-400 hover:text-red-500 transition"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600">Spent:</span>
                                                    <span className="font-bold text-slate-800">₹{budget.spent.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600">
                                                        {budget.remaining < 0 ? 'Exceeded:' : 'Remaining:'}
                                                    </span>
                                                    <span className={`font-bold ${budget.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                        ₹{Math.abs(budget.remaining).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-200 rounded-full h-2.5 mt-2">
                                                    <div 
                                                        className={`h-2.5 rounded-full transition-all ${
                                                            budget.status === 'exceeded' 
                                                                ? 'bg-red-500' 
                                                                : budget.status === 'warning' 
                                                                ? 'bg-yellow-500' 
                                                                : 'bg-green-500'
                                                        }`}
                                                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            
                                            {budget.status === 'exceeded' && (
                                                <div className="mt-3 flex items-center gap-2 text-xs text-red-700 bg-red-100 px-3 py-2 rounded-lg">
                                                    <AlertTriangle size={14} />
                                                    Budget exceeded!
                                                </div>
                                            )}
                                            {budget.status === 'warning' && (
                                                <div className="mt-3 flex items-center gap-2 text-xs text-yellow-700 bg-yellow-100 px-3 py-2 rounded-lg">
                                                    <AlertTriangle size={14} />
                                                    Approaching limit
                                                </div>
                                            )}
                                            {budget.status === 'good' && (
                                                <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-100 px-3 py-2 rounded-lg">
                                                    <CheckCircle size={14} />
                                                    On track
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Transactions List */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-200">
                                <h2 className="text-lg font-bold text-slate-800">Recent Transactions</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="py-4 px-6 text-left text-sm font-semibold text-slate-600">Date</th>
                                            <th className="py-4 px-6 text-left text-sm font-semibold text-slate-600">Category</th>
                                            <th className="py-4 px-6 text-left text-sm font-semibold text-slate-600">Description</th>
                                            <th className="py-4 px-6 text-right text-sm font-semibold text-slate-600">Amount</th>
                                            <th className="py-4 px-6 text-center text-sm font-semibold text-slate-600">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {transactions.length > 0 ? transactions.map((t) => (
                                            <tr key={t.id} className="hover:bg-slate-50 transition">
                                                <td className="py-4 px-6 text-sm text-slate-600">
                                                    {new Date(t.date).toLocaleDateString()}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                                        {t.category}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-sm text-slate-700">
                                                    {t.description || '-'}
                                                </td>
                                                <td className={`py-4 px-6 text-sm font-bold text-right ${
                                                    t.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {t.type === 'credit' ? '+' : '-'}₹{t.amount?.toFixed(2)}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <button 
                                                        onClick={() => handleDelete(t.id)} 
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="5" className="py-12 text-center text-slate-500">
                                                    No transactions found. Add your first transaction above!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Transactions;
