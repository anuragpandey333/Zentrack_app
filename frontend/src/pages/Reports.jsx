import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { useUser } from '../context/UserContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Calendar as CalendarIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { notificationManager } from '../utils/notifications';
import { convertCurrency, formatCurrency, getCurrencySymbol } from '../utils/currency';

const CATEGORIES = ['Housing', 'Food & Dining', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'];

const Reports = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const userCurrency = user?.currency || 'USD';
    const [transactions, setTransactions] = useState([]);
    const [budget, setBudget] = useState(0);
    const [timeFilter, setTimeFilter] = useState('3M'); // 1W, 1M, 3M, 1Y, ALL

    const token = localStorage.getItem('token');

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
            setTransactions(txRes.data || []);
            setBudget(budgetRes.data.amount || 8250);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // Calculate metrics dynamically based on transactions
    const expenses = transactions.filter(t => t.type === 'debit');
    const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);

    const avgDailySpend = expenses.length > 0 ? (totalSpent / 30) : 112.50; // simple approximation
    
    // Convert to user currency
    const displayAvgDailySpend = convertCurrency(avgDailySpend, 'INR', userCurrency);
    const displayTotalSpent = convertCurrency(totalSpent, 'INR', userCurrency);
    const displayBudget = convertCurrency(budget, 'INR', userCurrency);
    
    // Group by category
    const categoryTotals = {};
    expenses.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const highestCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : 'Housing';
    const highestCategoryAmount = sortedCategories.length > 0 ? sortedCategories[0][1] : 0;
    const highestCategoryPercent = totalSpent > 0 ? (highestCategoryAmount / totalSpent) * 100 : 35;

    const savingsRate = budget > 0 ? ((budget - totalSpent) / budget) * 100 : 57.6;

    // Dynamic Chart Data
    const dynamicChartData = useMemo(() => {
        const hasExpenses = expenses.length > 0;
        if (!hasExpenses) {
            return [
                { name: 'May 1', value: 1000 },
                { name: 'Jun 15', value: 1600 },
                { name: 'Jul 20', value: 1200 },
                { name: 'Aug 15', value: 3850 },
                { name: 'Sep 10', value: 1400 },
                { name: 'Oct 5', value: 2600 },
            ];
        }

        const grouped = {};
        expenses.forEach(t => {
            const dateStr = new Date(t.date).toISOString().split('T')[0];
            grouped[dateStr] = (grouped[dateStr] || 0) + t.amount;
        });
        
        const sortedDates = Object.keys(grouped).sort();
        return sortedDates.map(d => {
            const dateObj = new Date(d);
            const month = dateObj.toLocaleString('default', { month: 'short' });
            const day = dateObj.getDate();
            return {
                name: `${month} ${day}`,
                value: grouped[d]
            };
        });
    }, [expenses]);

    // Top Categories List
    const topCategoriesData = sortedCategories.length > 0 ? sortedCategories.slice(0, 5).map(c => ({
        name: c[0],
        amount: convertCurrency(c[1], 'INR', userCurrency),
        percent: ((c[1] / totalSpent) * 100).toFixed(0)
    })) : [
        { name: 'Housing', amount: convertCurrency(1200, 'INR', userCurrency), percent: 35 },
        { name: 'Food & Dining', amount: convertCurrency(850, 'INR', userCurrency), percent: 24 },
        { name: 'Transportation', amount: convertCurrency(450, 'INR', userCurrency), percent: 13 },
        { name: 'Entertainment', amount: convertCurrency(320, 'INR', userCurrency), percent: 9 },
        { name: 'Shopping', amount: convertCurrency(250, 'INR', userCurrency), percent: 7 },
    ];

    // Spending Intensity Data (Days x Time)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const times = ['Morning', 'Afternoon', 'Evening'];
    
    // Pre-calculate intensity matrix based on expenses
    const intensityMatrix = Array(3).fill(null).map(() => Array(7).fill(0));
    
    expenses.forEach(t => {
        const date = new Date(t.date);
        let dayIdx = date.getDay() - 1; // 0 for Mon, 6 for Sun
        if (dayIdx === -1) dayIdx = 6; // Sunday
        
        // Mocking time since transaction might not have specific time, use random or just fallback
        const hour = Math.floor(Math.random() * 24); 
        let timeIdx = 0; // Morning
        if (hour >= 12 && hour < 17) timeIdx = 1; // Afternoon
        if (hour >= 17 || hour < 5) timeIdx = 2; // Evening
        
        intensityMatrix[timeIdx][dayIdx] += t.amount;
    });

    const getIntensityColor = (amount) => {
        if (amount === 0) return 'bg-slate-200';
        if (amount < 50) return 'bg-slate-300';
        if (amount < 150) return 'bg-slate-400';
        if (amount < 300) return 'bg-slate-600';
        return 'bg-slate-900';
    };

    // Use dummy data if no expenses
    const hasExpenses = expenses.length > 0;
    const finalIntensity = hasExpenses ? intensityMatrix : [
        [30, 100, 40, 200, 120, 400, 250], // Morning
        [200, 150, 400, 250, 40, 120, 100], // Afternoon
        [150, 40, 100, 200, 250, 400, 400]  // Evening
    ];

    const downloadReport = () => {
        const doc = new jsPDF();
        doc.text("Analytics Report", 20, 20);
        doc.text(`Total Spent: ${formatCurrency(displayTotalSpent, userCurrency)}`, 20, 30);
        doc.save("Analytics_Report.pdf");
        notificationManager.success('Report downloaded successfully!');
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xl">
                    {`${formatCurrency(convertCurrency(payload[0].value, 'INR', userCurrency), userCurrency)} on ${label}`}
                </div>
            );
        }
        return null;
    };

    return (
        <Layout>
            <Header 
                title="Analytics"
                subtitle="Deep dive into your financial trends and habits."
                actions={
                    <button 
                        onClick={downloadReport} 
                        className="px-4 py-2 bg-slate-900 text-white rounded-full flex items-center gap-2 hover:bg-black transition shadow-sm"
                    >
                        <Download size={18} />
                        Export
                    </button>
                }
            />
            <div className="font-sans max-w-7xl mx-auto">

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm">
                        <p className="text-slate-500 text-sm font-medium mb-3">Avg. Daily Spend</p>
                        <h3 className="text-[28px] font-bold text-slate-900 tracking-tight mb-4">
                            {formatCurrency(displayAvgDailySpend, userCurrency)}
                        </h3>
                        <div className="flex items-center text-xs">
                            <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded font-medium mr-2">-5.2%</span>
                            <span className="text-slate-400">vs last month</span>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm">
                        <p className="text-slate-500 text-sm font-medium mb-3">Highest Category</p>
                        <h3 className="text-[28px] font-bold text-slate-900 tracking-tight mb-4 truncate">
                            {highestCategory}
                        </h3>
                        <div className="flex items-center text-xs">
                            <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded font-medium mr-2">{highestCategoryPercent.toFixed(0)}%</span>
                            <span className="text-slate-400">of total expenses</span>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm">
                        <p className="text-slate-500 text-sm font-medium mb-3">Income Trend</p>
                        <h3 className="text-[28px] font-bold text-slate-900 tracking-tight mb-4">
                            {formatCurrency(displayBudget, userCurrency)}
                        </h3>
                        <div className="flex items-center text-xs">
                            <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded font-medium mr-2">+12.5%</span>
                            <span className="text-slate-400">vs last month</span>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm">
                        <p className="text-slate-500 text-sm font-medium mb-3">Savings Rate</p>
                        <h3 className="text-[28px] font-bold text-slate-900 tracking-tight mb-4">
                            {savingsRate.toFixed(1)}%
                        </h3>
                        <div className="flex items-center text-xs">
                            <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded font-medium mr-2">+2.1%</span>
                            <span className="text-slate-400">of total income</span>
                        </div>
                    </div>
                </div>

                {/* Spending Over Time Chart */}
                <div className="bg-white border border-slate-100 rounded-[20px] p-8 shadow-sm mb-8 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <h2 className="text-[17px] font-bold text-slate-900">Spending Over Time</h2>
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                            {['1W', '1M', '3M', '1Y', 'ALL'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTimeFilter(t)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${timeFilter === t ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="h-[280px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dynamicChartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#171717" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#171717" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748b', fontSize: 13 }} 
                                    dy={15}
                                    padding={{ left: 20, right: 20 }}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748b', fontSize: 13 }} 
                                    tickFormatter={(val) => `${getCurrencySymbol(userCurrency)}${(convertCurrency(val, 'INR', userCurrency)/1000).toFixed(0)}k`}
                                    dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="#171717" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorValue)" 
                                    activeDot={{ r: 6, fill: '#171717', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Categories */}
                    <div className="bg-white border border-slate-100 rounded-[20px] p-8 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-[17px] font-bold text-slate-900">Top Categories</h2>
                            <button className="text-xs font-medium text-slate-500 hover:text-slate-900 transition">
                                View All
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            {topCategoriesData.map((cat, idx) => (
                                <div key={idx} className="group">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-[15px] font-medium text-slate-800">{cat.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-slate-400">{cat.percent}%</span>
                                            <span className="text-[15px] font-semibold text-slate-900">{formatCurrency(cat.amount, userCurrency)}</span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-slate-900 rounded-full" 
                                            style={{ width: `${cat.percent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Spending Intensity */}
                    <div className="bg-white border border-slate-100 rounded-[20px] p-8 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-[17px] font-bold text-slate-900">Spending Intensity</h2>
                            <button className="text-slate-400 hover:text-slate-900 transition">
                                <CalendarIcon size={18} />
                            </button>
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="grid grid-cols-8 gap-y-4 gap-x-2">
                                {/* Header Row */}
                                <div></div>
                                {days.map(d => (
                                    <div key={d} className="text-center text-xs font-medium text-slate-400">{d}</div>
                                ))}

                                {/* Matrix Rows */}
                                {times.map((time, rowIdx) => (
                                    <React.Fragment key={time}>
                                        <div className="text-xs font-medium text-slate-400 flex items-center">{time}</div>
                                        {days.map((d, colIdx) => {
                                            const amount = finalIntensity[rowIdx][colIdx];
                                            return (
                                                <div 
                                                    key={`${time}-${d}`} 
                                                    className={`aspect-square rounded-lg ${getIntensityColor(amount)} transition-all hover:scale-105 cursor-pointer`}
                                                    title={`${formatCurrency(convertCurrency(amount, 'INR', userCurrency), userCurrency)} spent`}
                                                ></div>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex justify-end items-center gap-2 mt-8 text-xs font-medium text-slate-400">
                            <span>Less</span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 rounded-[3px] bg-slate-200"></div>
                                <div className="w-3 h-3 rounded-[3px] bg-slate-300"></div>
                                <div className="w-3 h-3 rounded-[3px] bg-slate-400"></div>
                                <div className="w-3 h-3 rounded-[3px] bg-slate-600"></div>
                                <div className="w-3 h-3 rounded-[3px] bg-slate-900"></div>
                            </div>
                            <span>More</span>
                        </div>
                    </div>
                </div>

            </div>
        </Layout>
    );
};

export default Reports;
