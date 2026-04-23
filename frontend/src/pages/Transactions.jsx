import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Plus, Trash2 } from 'lucide-react';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [formData, setFormData] = useState({ type: 'debit', amount: '', category: '', description: '' });

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

    useEffect(() => {
        fetchTransactions();
    }, []);

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
            setFormData({ type: 'debit', amount: '', category: '', description: '' });
            fetchTransactions();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8000/api/transactions/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTransactions();
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <Layout>
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Transactions</h1>
                    <p className="text-slate-500">Manage and track your daily expenses.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Add Transaction</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="block w-full py-2.5 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary bg-white/50 outline-none transition"
                                >
                                    <option value="debit">Debit (Expense)</option>
                                    <option value="credit">Credit (Income)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                                <input
                                    type="number"
                                    name="amount"
                                    required
                                    value={formData.amount}
                                    onChange={handleChange}
                                    className="block w-full py-2.5 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary bg-white/50 outline-none transition"
                                    placeholder="e.g. 500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                <input
                                    type="text"
                                    name="category"
                                    required
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="block w-full py-2.5 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary bg-white/50 outline-none transition"
                                    placeholder="e.g. Groceries"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                                <input
                                    type="text"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="block w-full py-2.5 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary bg-white/50 outline-none transition"
                                    placeholder="e.g. Weekly supermarket"
                                />
                            </div>
                            <button type="submit" className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-brand-primary hover:bg-brand-dark transition-all">
                                <Plus size={18} className="mr-2" />
                                Add Record
                            </button>
                        </form>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="py-4 px-6 text-sm font-medium text-slate-500">Date</th>
                                        <th className="py-4 px-6 text-sm font-medium text-slate-500">Category</th>
                                        <th className="py-4 px-6 text-sm font-medium text-slate-500">Description</th>
                                        <th className="py-4 px-6 text-sm font-medium text-slate-500 text-right">Amount</th>
                                        <th className="py-4 px-6 text-sm font-medium text-slate-500 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.length > 0 ? transactions.map((t) => (
                                        <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                                            <td className="py-4 px-6 text-sm text-slate-600">
                                                {new Date(t.date).toLocaleDateString()}
                                            </td>
                                            <td className="py-4 px-6 text-sm font-medium text-slate-800">
                                                {t.category}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-slate-500">
                                                {t.description || '-'}
                                            </td>
                                            <td className={`py-4 px-6 text-sm font-bold text-right ${t.type === 'credit' ? 'text-green-600' : 'text-orange-600'}`}>
                                                {t.type === 'credit' ? '+' : '-'}₹{t.amount?.toLocaleString()}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-center">
                                                <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-red-500 transition">
                                                    <Trash2 size={18} className="mx-auto" />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="py-8 text-center text-slate-500 text-sm">
                                                No transactions found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Transactions;
