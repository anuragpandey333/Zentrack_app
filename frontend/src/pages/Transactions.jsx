import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { useUser } from '../context/UserContext';
import { 
    Plus, Filter, Download, 
    ShoppingBag, Briefcase, Tv, Car, 
    RefreshCw, Coffee, Package, Activity,
    X, Trash2
} from 'lucide-react';
import { notificationManager } from '../utils/notifications';
import { convertCurrency, formatCurrency, getCurrencySymbol } from '../utils/currency';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other'];

const getCategoryIcon = (category) => {
    switch(category?.toLowerCase()) {
        case 'food': return <Coffee size={18} />;
        case 'transport': return <Car size={18} />;
        case 'shopping': return <ShoppingBag size={18} />;
        case 'bills': return <RefreshCw size={18} />;
        case 'entertainment': return <Tv size={18} />;
        case 'health': return <Activity size={18} />;
        case 'education': return <Briefcase size={18} />;
        default: return <Package size={18} />;
    }
};

const Transactions = () => {
    const { user } = useUser();
    const userCurrency = user?.currency || 'USD';
    const [transactions, setTransactions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({ 
        type: 'debit', 
        amount: '', 
        category: 'Food', 
        description: '' 
    });
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        fetchTransactions();
    }, []);

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
            setShowAddModal(false);
            fetchTransactions();
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
            fetchTransactions();
            notificationManager.success('Transaction deleted');
        } catch (error) {
            console.error(error);
            notificationManager.error('Failed to delete transaction');
        }
    };

    // Filtering
    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              t.category.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesTab = true;
        if (activeTab === 'Income') matchesTab = t.type === 'credit';
        if (activeTab === 'Expenses') matchesTab = t.type === 'debit';
        if (activeTab === 'Transfers') matchesTab = t.category.toLowerCase() === 'transfer'; // Mock transfer logic

        return matchesSearch && matchesTab;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

    const formatDate = (dateString) => {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    return (
        <Layout>
            <Header 
                title="Transactions"
                subtitle="View and manage your recent financial activity."
                actions={
                    <>
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                            <Filter size={16} />
                            Filter
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                            <Download size={16} />
                            Export
                        </button>
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-slate-900 text-white rounded-full flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm"
                        >
                            <Plus size={18} />
                            Add
                        </button>
                    </>
                }
            />
            <div className="w-full space-y-8">

                {/* Main Content Area */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Tabs and Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-slate-100 gap-4">
                        <div className="flex items-center gap-1 bg-slate-50/80 p-1 rounded-xl border border-slate-100">
                            {['All', 'Income', 'Expenses', 'Transfers'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setActiveTab(tab);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-5 py-1.5 text-sm font-medium rounded-lg transition-all ${
                                        activeTab === tab 
                                            ? 'bg-white text-slate-900 shadow-sm' 
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                                <Filter size={16} />
                                Filter
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                                <Download size={16} />
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="py-4 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Description</th>
                                    <th className="py-4 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Category</th>
                                    <th className="py-4 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="py-4 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Account</th>
                                    <th className="py-4 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                    <th className="py-4 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="py-4 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {currentItems.map((t) => (
                                    <tr key={t._id || t.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100 shrink-0">
                                                    {getCategoryIcon(t.category)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">{t.description || t.category}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">{t.category}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-100">
                                                {t.category}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-slate-500 font-medium">
                                            {formatDate(t.date)}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-slate-500 font-medium">
                                            {t.type === 'credit' ? 'Chase Checking' : 'Credit Card'}
                                        </td>
                                        <td className={`py-4 px-6 text-sm font-semibold text-right ${
                                            t.type === 'credit' ? 'text-emerald-500' : 'text-slate-900'
                                        }`}>
                                            {t.type === 'credit' ? '+' : '-'}{formatCurrency(convertCurrency(t.amount, 'INR', userCurrency), userCurrency)}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-xs font-medium text-slate-500">
                                                Completed
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <button 
                                                onClick={() => handleDelete(t._id || t.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {currentItems.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="py-16 text-center text-slate-500">
                                            No transactions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {filteredTransactions.length > 0 && (
                        <div className="flex items-center justify-between p-5 border-t border-slate-100 bg-white">
                            <p className="text-sm text-slate-500">
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTransactions.length)} of {filteredTransactions.length} results
                            </p>
                            <div className="flex items-center gap-1.5">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <div className="flex items-center gap-1 px-2">
                                    {Array.from({ length: totalPages }).map((_, i) => {
                                        // Simple pagination logic to avoid too many buttons
                                        if (totalPages > 5 && i !== 0 && i !== totalPages - 1 && Math.abs(currentPage - 1 - i) > 1) {
                                            if (i === 1 || i === totalPages - 2) return <span key={i} className="px-1 text-slate-400">...</span>;
                                            return null;
                                        }
                                        
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-xl transition-colors ${
                                                    currentPage === i + 1
                                                        ? 'bg-slate-100 text-slate-900'
                                                        : 'text-slate-500 hover:bg-slate-50'
                                                }`}
                                            >
                                                {i + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Transaction Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-semibold text-slate-900">Add Transaction</h2>
                            <button 
                                onClick={() => setShowAddModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                                >
                                    <option value="debit">Expense</option>
                                    <option value="credit">Income</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{getCurrencySymbol(userCurrency)}</span>
                                    <input
                                        type="number"
                                        name="amount"
                                        required
                                        value={formData.amount}
                                        onChange={handleChange}
                                        className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
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
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. Whole Foods Market"
                                />
                            </div>
                            <div className="pt-2">
                                <button 
                                    type="submit" 
                                    className="w-full py-3 px-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-semibold shadow-md transition-colors"
                                >
                                    Save Transaction
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Transactions;
