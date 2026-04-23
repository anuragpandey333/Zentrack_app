import React, { useState, useEffect } from 'react';
import { reportService } from '../services/api';
import { notificationManager } from '../utils/notifications';
import { Target, Plus, Trash2, Save } from 'lucide-react';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other'];

const BudgetManager = () => {
    const [categoryBudgets, setCategoryBudgets] = useState([]);
    const [newBudget, setNewBudget] = useState({ category: 'Food', limit: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCategoryBudgets();
    }, []);

    const fetchCategoryBudgets = async () => {
        try {
            const data = await reportService.getCategoryBudgets();
            setCategoryBudgets(data);
        } catch (error) {
            console.error('Error fetching category budgets:', error);
        }
    };

    const handleAddBudget = async (e) => {
        e.preventDefault();
        if (!newBudget.limit || parseFloat(newBudget.limit) <= 0) {
            notificationManager.error('Please enter a valid budget amount');
            return;
        }

        try {
            setLoading(true);
            await reportService.setCategoryBudget(newBudget.category, parseFloat(newBudget.limit));
            notificationManager.success(`Budget set for ${newBudget.category}`);
            setNewBudget({ category: 'Food', limit: '' });
            fetchCategoryBudgets();
        } catch (error) {
            notificationManager.error('Failed to set budget');
        } finally {
            setLoading(false);
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

    const availableCategories = CATEGORIES.filter(
        cat => !categoryBudgets.find(b => b.category === cat)
    );

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Target size={24} className="text-purple-600" />
                Category Budget Manager
            </h2>
            <p className="text-slate-600 text-sm mb-6">
                Set spending limits for each category. You'll receive alerts when you reach 80% or exceed your budget.
            </p>

            {/* Add New Budget */}
            <form onSubmit={handleAddBudget} className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-slate-800 mb-3">Add Category Budget</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select
                        value={newBudget.category}
                        onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        disabled={availableCategories.length === 0}
                    >
                        {availableCategories.length > 0 ? (
                            availableCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))
                        ) : (
                            <option>All categories have budgets</option>
                        )}
                    </select>
                    <input
                        type="number"
                        placeholder="Budget limit (₹)"
                        value={newBudget.limit}
                        onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        disabled={availableCategories.length === 0}
                    />
                    <button
                        type="submit"
                        disabled={loading || availableCategories.length === 0}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
                    >
                        <Plus size={18} />
                        Add Budget
                    </button>
                </div>
            </form>

            {/* Existing Budgets */}
            <div className="space-y-3">
                {categoryBudgets.length > 0 ? (
                    categoryBudgets.map((budget) => (
                        <div key={budget.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition">
                            <div>
                                <h4 className="font-semibold text-slate-800">{budget.category}</h4>
                                <p className="text-sm text-slate-600">Monthly Limit: ₹{budget.limit.toFixed(2)}</p>
                            </div>
                            <button
                                onClick={() => handleDeleteBudget(budget.category)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        <Target size={48} className="mx-auto mb-3 opacity-50" />
                        <p>No category budgets set yet.</p>
                        <p className="text-sm">Add budgets above to start tracking your spending limits.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BudgetManager;
