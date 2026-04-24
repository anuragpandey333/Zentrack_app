import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { useUser } from '../context/UserContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Calendar as CalendarIcon, Sparkles, Loader, Activity } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    const [aiInsights, setAiInsights] = useState(null);
    const [loadingAI, setLoadingAI] = useState(false);

    const token = localStorage.getItem('token');

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
            setTransactions(txRes.data || []);
            setBudget(budgetRes.data.amount || 0);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // Calculate metrics dynamically based on transactions
    const expenses = transactions.filter(t => t.type === 'debit');
    const income = transactions.filter(t => t.type === 'credit');
    const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const hasData = expenses.length > 0;

    // Calculate monthly changes for Reports KPIs
    const calculateReportsMonthlyChanges = () => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        
        // Current month data
        const currentMonthExpenses = expenses.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
        }).reduce((sum, tx) => sum + tx.amount, 0);
        
        const currentMonthIncome = income.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
        }).reduce((sum, tx) => sum + tx.amount, 0);
        
        // Last month data
        const lastMonthExpenses = expenses.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate.getMonth() === lastMonth && txDate.getFullYear() === lastMonthYear;
        }).reduce((sum, tx) => sum + tx.amount, 0);
        
        const lastMonthIncome = income.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate.getMonth() === lastMonth && txDate.getFullYear() === lastMonthYear;
        }).reduce((sum, tx) => sum + tx.amount, 0);
        
        // Calculate avg daily spend change
        const currentAvgDaily = currentMonthExpenses / 30;
        const lastAvgDaily = lastMonthExpenses / 30;
        const avgDailyChange = lastAvgDaily > 0 
            ? ((currentAvgDaily - lastAvgDaily) / lastAvgDaily * 100).toFixed(1)
            : 0;
        
        // Calculate income trend change
        const incomeChange = lastMonthIncome > 0 
            ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome * 100).toFixed(1)
            : 0;
        
        // Calculate savings rate change
        const currentSavingsRate = currentMonthIncome > 0 ? ((currentMonthIncome - currentMonthExpenses) / currentMonthIncome * 100) : 0;
        const lastSavingsRate = lastMonthIncome > 0 ? ((lastMonthIncome - lastMonthExpenses) / lastMonthIncome * 100) : 0;
        const savingsRateChange = (currentSavingsRate - lastSavingsRate).toFixed(1);
        
        return {
            avgDailyChange: parseFloat(avgDailyChange),
            incomeChange: parseFloat(incomeChange),
            savingsRateChange: parseFloat(savingsRateChange),
            hasLastMonthData: lastMonthExpenses > 0 || lastMonthIncome > 0
        };
    };
    
    const reportsMonthlyChanges = calculateReportsMonthlyChanges();

    const avgDailySpend = hasData ? (totalSpent / 30) : 0;
    
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
    const highestCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : 'N/A';
    const highestCategoryAmount = sortedCategories.length > 0 ? sortedCategories[0][1] : 0;
    const highestCategoryPercent = totalSpent > 0 ? (highestCategoryAmount / totalSpent) * 100 : 0;

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0;

    // Dynamic Chart Data
    const dynamicChartData = useMemo(() => {
        if (!hasData) {
            return [];
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
    }, [expenses, hasData]);

    // Top Categories List
    const topCategoriesData = sortedCategories.length > 0 ? sortedCategories.slice(0, 5).map(c => ({
        name: c[0],
        amount: convertCurrency(c[1], 'INR', userCurrency),
        percent: ((c[1] / totalSpent) * 100).toFixed(0)
    })) : [];

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

    const finalIntensity = intensityMatrix;

    const downloadReport = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        
        // Header
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('Analytics Report', pageWidth / 2, 25, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 35, { align: 'center' });
        
        let yPos = 55;
        
        // Financial Summary
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Financial Summary', 14, yPos);
        yPos += 10;
        
        autoTable(doc, {
            startY: yPos,
            head: [['Metric', 'Amount']],
            body: [
                ['Total Spent', formatCurrency(displayTotalSpent, userCurrency)],
                ['Monthly Budget', formatCurrency(displayBudget, userCurrency)],
                ['Remaining', formatCurrency(displayBudget - displayTotalSpent, userCurrency)],
                ['Transactions', transactions.length.toString()],
                ['Avg Daily Spend', formatCurrency(displayAvgDailySpend, userCurrency)],
                ['Savings Rate', `${savingsRate.toFixed(1)}%`]
            ],
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42] }
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
        
        // Top Categories
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Top Spending Categories', 14, yPos);
        yPos += 10;
        
        const categoryRows = topCategoriesData.map(cat => [
            cat.name,
            formatCurrency(cat.amount, userCurrency),
            `${cat.percent}%`
        ]);
        
        autoTable(doc, {
            startY: yPos,
            head: [['Category', 'Amount', 'Percentage']],
            body: categoryRows,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42] }
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
        
        // AI Analysis Section
        if (aiInsights) {
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }
            
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('AI Analysis', 14, yPos);
            yPos += 10;
            
            // Key Observations
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Key Observations:', 14, yPos);
            yPos += 7;
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            aiInsights.observations.forEach((obs, idx) => {
                const obsText = doc.splitTextToSize(`${idx + 1}. ${obs}`, pageWidth - 28);
                doc.text(obsText, 14, yPos);
                yPos += obsText.length * 5 + 3;
            });
            yPos += 5;
            
            // Spending Patterns
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }
            
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Spending Patterns:', 14, yPos);
            yPos += 7;
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            aiInsights.patterns.forEach((pattern, idx) => {
                const patternText = doc.splitTextToSize(`${idx + 1}. ${pattern}`, pageWidth - 28);
                doc.text(patternText, 14, yPos);
                yPos += patternText.length * 5 + 3;
            });
            yPos += 5;
            
            // Improvement Suggestions
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }
            
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Improvement Suggestions:', 14, yPos);
            yPos += 7;
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            aiInsights.suggestions.forEach((sug, idx) => {
                const sugText = doc.splitTextToSize(`${idx + 1}. ${sug}`, pageWidth - 28);
                doc.text(sugText, 14, yPos);
                yPos += sugText.length * 5 + 3;
            });
            yPos += 5;
            
            // Budget Comparison
            if (aiInsights.budgetComparison) {
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }
                
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text('Budget Comparison:', 14, yPos);
                yPos += 7;
                
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                const compText = doc.splitTextToSize(aiInsights.budgetComparison, pageWidth - 28);
                doc.text(compText, 14, yPos);
            }
        }
        
        // Footer
        const totalPages = doc.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
            doc.text('Generated by Zentrack Analytics', pageWidth / 2, doc.internal.pageSize.height - 5, { align: 'center' });
        }
        
        doc.save(`Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        notificationManager.success('Report downloaded successfully!');
    };

    const generateAIInsights = async () => {
        if (expenses.length === 0) {
            notificationManager.warning('No transactions to analyze');
            return;
        }

        try {
            setLoadingAI(true);
            const { data } = await axios.get('http://localhost:8000/api/reports/ai-insights', config);
            setAiInsights(data);
            notificationManager.success('AI insights generated!');
        } catch (error) {
            console.error('Error generating AI insights:', error);
            notificationManager.error('Failed to generate insights');
        } finally {
            setLoadingAI(false);
        }
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
                        <h3 className="text-[28px] font-bold text-slate-900 tracking-tight mb-4 truncate">
                            {formatCurrency(displayAvgDailySpend, userCurrency)}
                        </h3>
                        {hasData && reportsMonthlyChanges.hasLastMonthData && (
                            <div className="flex items-center text-xs">
                                <span className={`${reportsMonthlyChanges.avgDailyChange <= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} px-2 py-0.5 rounded font-medium mr-2`}>
                                    {reportsMonthlyChanges.avgDailyChange >= 0 ? '+' : ''}{reportsMonthlyChanges.avgDailyChange}%
                                </span>
                                <span className="text-slate-400">vs last month</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm">
                        <p className="text-slate-500 text-sm font-medium mb-3">Highest Category</p>
                        <h3 className="text-[28px] font-bold text-slate-900 tracking-tight mb-4 truncate">
                            {highestCategory}
                        </h3>
                        {hasData && highestCategoryPercent > 0 && (
                            <div className="flex items-center text-xs">
                                <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded font-medium mr-2">{highestCategoryPercent.toFixed(0)}%</span>
                                <span className="text-slate-400">of total expenses</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm">
                        <p className="text-slate-500 text-sm font-medium mb-3">Income Trend</p>
                        <h3 className="text-[28px] font-bold text-slate-900 tracking-tight mb-4 truncate">
                            {formatCurrency(convertCurrency(totalIncome, 'INR', userCurrency), userCurrency)}
                        </h3>
                        {hasData && totalIncome > 0 && reportsMonthlyChanges.hasLastMonthData && (
                            <div className="flex items-center text-xs">
                                <span className={`${reportsMonthlyChanges.incomeChange >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} px-2 py-0.5 rounded font-medium mr-2`}>
                                    {reportsMonthlyChanges.incomeChange >= 0 ? '+' : ''}{reportsMonthlyChanges.incomeChange}%
                                </span>
                                <span className="text-slate-400">vs last month</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm">
                        <p className="text-slate-500 text-sm font-medium mb-3">Savings Rate</p>
                        <h3 className="text-[28px] font-bold text-slate-900 tracking-tight mb-4 truncate">
                            {savingsRate.toFixed(1)}%
                        </h3>
                        {hasData && totalIncome > 0 && reportsMonthlyChanges.hasLastMonthData && (
                            <div className="flex items-center text-xs">
                                <span className={`${reportsMonthlyChanges.savingsRateChange >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} px-2 py-0.5 rounded font-medium mr-2`}>
                                    {reportsMonthlyChanges.savingsRateChange >= 0 ? '+' : ''}{reportsMonthlyChanges.savingsRateChange}%
                                </span>
                                <span className="text-slate-400">vs last month</span>
                            </div>
                        )}
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
                        {hasData && dynamicChartData.length > 0 ? (
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
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <Sparkles size={28} className="text-slate-400" />
                                </div>
                                <p className="text-slate-500 text-sm mb-2">No spending data yet</p>
                                <p className="text-slate-400 text-xs">Add transactions to see your spending trends</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Analysis Section */}
                <div className="bg-white border border-slate-100 rounded-[20px] p-8 shadow-sm mb-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-[17px] font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles size={18} className="text-slate-900" />
                                AI Analysis
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">Get intelligent insights about your spending</p>
                        </div>
                        <button
                            onClick={generateAIInsights}
                            disabled={loadingAI || expenses.length === 0}
                            className="px-4 py-2 bg-slate-900 text-white rounded-full flex items-center gap-2 hover:bg-black transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                            {loadingAI ? (
                                <>
                                    <Loader className="animate-spin" size={16} />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Generate Insights
                                </>
                            )}
                        </button>
                    </div>

                    {aiInsights ? (
                        <div className="space-y-6">
                            {/* Key Observations */}
                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                <h3 className="text-sm font-semibold text-slate-900 mb-3">Key Observations</h3>
                                <ul className="space-y-2">
                                    {aiInsights.observations.map((obs, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                            <span className="text-slate-400 mt-0.5">•</span>
                                            <span>{obs}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Spending Patterns */}
                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                <h3 className="text-sm font-semibold text-slate-900 mb-3">Spending Patterns</h3>
                                <ul className="space-y-2">
                                    {aiInsights.patterns.map((pattern, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                            <span className="text-slate-400 mt-0.5">•</span>
                                            <span>{pattern}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Improvement Suggestions */}
                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                <h3 className="text-sm font-semibold text-slate-900 mb-3">Improvement Suggestions</h3>
                                <ul className="space-y-2">
                                    {aiInsights.suggestions.map((sug, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                            <span className="text-slate-400 mt-0.5">•</span>
                                            <span>{sug}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Budget Comparison */}
                            {aiInsights.budgetComparison && (
                                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Budget Comparison</h3>
                                    <p className="text-sm text-slate-700">{aiInsights.budgetComparison}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Sparkles size={24} className="text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-500">Click "Generate Insights" to analyze your spending</p>
                        </div>
                    )}
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
                        
                        {topCategoriesData.length > 0 ? (
                            <div className="space-y-6">
                                {topCategoriesData.map((cat, idx) => (
                                    <div key={idx} className="group">
                                        <div className="flex justify-between items-end mb-2 gap-2">
                                            <span className="text-[15px] font-medium text-slate-800 truncate">{cat.name}</span>
                                            <div className="flex items-center gap-3 shrink-0">
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
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Activity size={28} className="text-slate-400" />
                                </div>
                                <p className="text-slate-500 text-sm mb-2">No category data yet</p>
                                <p className="text-slate-400 text-xs">Add expenses to see top categories</p>
                            </div>
                        )}
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
