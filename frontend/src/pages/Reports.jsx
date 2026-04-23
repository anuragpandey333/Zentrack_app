import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { reportService } from '../services/api';
import { notificationManager } from '../utils/notifications';
import { 
    TrendingUp, 
    TrendingDown, 
    AlertTriangle, 
    CheckCircle, 
    DollarSign, 
    PieChart, 
    Download,
    Sparkles,
    Target,
    Calendar,
    ArrowLeft,
    Loader
} from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6', '#f97316'];

const Reports = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState(null);
    const [chartType, setChartType] = useState('pie');

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const data = await reportService.generateReport();
            setReport(data);
        } catch (error) {
            console.error('Error fetching report:', error);
            notificationManager.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = () => {
        if (!report) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        
        // Header
        doc.setFillColor(139, 92, 246);
        doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('AI Financial Report', pageWidth / 2, 25, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Generated: ${new Date(report.generatedAt).toLocaleDateString()}`, pageWidth / 2, 35, { align: 'center' });
        
        let yPos = 55;
        
        // Summary Section
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Financial Summary', 14, yPos);
        yPos += 10;
        
        doc.autoTable({
            startY: yPos,
            head: [['Metric', 'Amount']],
            body: [
                ['Total Expenses', `₹${report.summary.totalExpenses.toFixed(2)}`],
                ['Monthly Budget', `₹${report.summary.monthlyBudget.toFixed(2)}`],
                ['Remaining', `₹${report.summary.remaining.toFixed(2)}`],
                ['Transactions', report.summary.transactionCount]
            ],
            theme: 'striped',
            headStyles: { fillColor: [139, 92, 246] }
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
        
        // Category Breakdown
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Category Breakdown', 14, yPos);
        yPos += 10;
        
        const categoryRows = report.summary.categoryTotals.map(({ category, amount }) => [
            category,
            `₹${amount.toFixed(2)}`,
            `${((amount / report.summary.totalExpenses) * 100).toFixed(1)}%`
        ]);
        
        doc.autoTable({
            startY: yPos,
            head: [['Category', 'Amount', 'Percentage']],
            body: categoryRows,
            theme: 'striped',
            headStyles: { fillColor: [139, 92, 246] }
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
        
        // AI Analysis
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
        
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('AI Financial Analysis', 14, yPos);
        yPos += 10;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        const summaryText = doc.splitTextToSize(report.aiAnalysis.summary, pageWidth - 28);
        doc.text(summaryText, 14, yPos);
        yPos += summaryText.length * 7 + 10;
        
        // Why Expenses High
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Why Expenses Are High:', 14, yPos);
        yPos += 7;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const whyText = doc.splitTextToSize(report.aiAnalysis.whyExpensesHigh, pageWidth - 28);
        doc.text(whyText, 14, yPos);
        yPos += whyText.length * 6 + 10;
        
        // Suggestions
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Recommendations', 14, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        report.aiAnalysis.suggestions.forEach((sug, idx) => {
            const sugText = doc.splitTextToSize(`${idx + 1}. ${sug}`, pageWidth - 28);
            doc.text(sugText, 14, yPos);
            yPos += sugText.length * 6 + 3;
        });
        
        // Footer
        const totalPages = doc.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
            doc.text('Generated by Zentrack AI', pageWidth / 2, doc.internal.pageSize.height - 5, { align: 'center' });
        }
        
        doc.save(`Zentrack_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        notificationManager.success('Report downloaded successfully!');
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <Loader className="animate-spin mx-auto mb-4 text-purple-600" size={48} />
                        <p className="text-slate-600 font-medium">Generating AI Report...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!report) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Failed to Load Report</h2>
                    <button onClick={fetchReport} className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        Retry
                    </button>
                </div>
            </Layout>
        );
    }

    const chartData = report.summary.categoryTotals.map(({ category, amount }) => ({
        name: category,
        value: amount
    }));

    const isOverBudget = report.summary.remaining < 0;

    return (
        <Layout>
            {/* Header */}
            <div className="mb-8">
                <button 
                    onClick={() => navigate('/dashboard')} 
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition"
                >
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>
                
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <Sparkles className="text-purple-600" size={32} />
                            AI Financial Report
                        </h1>
                        <p className="text-slate-500 mt-2">
                            Generated on {new Date(report.generatedAt).toLocaleDateString()} at {new Date(report.generatedAt).toLocaleTimeString()}
                        </p>
                    </div>
                    <button 
                        onClick={downloadPDF}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg transition-all transform hover:scale-105"
                    >
                        <Download size={20} />
                        Download PDF
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center gap-2 text-purple-700 mb-2">
                        <DollarSign size={20} />
                        <p className="text-sm font-medium">Monthly Budget</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-900">₹{report.summary.monthlyBudget.toFixed(2)}</p>
                </div>
                
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 border border-pink-200">
                    <div className="flex items-center gap-2 text-pink-700 mb-2">
                        <TrendingDown size={20} />
                        <p className="text-sm font-medium">Total Expenses</p>
                    </div>
                    <p className="text-3xl font-bold text-pink-900">₹{report.summary.totalExpenses.toFixed(2)}</p>
                </div>
                
                <div className={`bg-gradient-to-br rounded-xl p-6 border ${isOverBudget ? 'from-red-50 to-red-100 border-red-200' : 'from-green-50 to-green-100 border-green-200'}`}>
                    <div className={`flex items-center gap-2 mb-2 ${isOverBudget ? 'text-red-700' : 'text-green-700'}`}>
                        {isOverBudget ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                        <p className="text-sm font-medium">Remaining</p>
                    </div>
                    <p className={`text-3xl font-bold ${isOverBudget ? 'text-red-900' : 'text-green-900'}`}>
                        ₹{report.summary.remaining.toFixed(2)}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                        <Calendar size={20} />
                        <p className="text-sm font-medium">Transactions</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-900">{report.summary.transactionCount}</p>
                </div>
            </div>

            {/* Category Budget Status */}
            {report.categoryBudgetStatus && report.categoryBudgetStatus.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Target size={24} className="text-purple-600" />
                        Category Budget Tracking
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {report.categoryBudgetStatus.map((cat) => (
                            <div key={cat.category} className={`p-4 rounded-lg border ${
                                cat.status === 'exceeded' ? 'bg-red-50 border-red-200' :
                                cat.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                                'bg-green-50 border-green-200'
                            }`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-slate-800">{cat.category}</h3>
                                        <p className="text-sm text-slate-600">Limit: ₹{cat.limit.toFixed(2)}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        cat.status === 'exceeded' ? 'bg-red-200 text-red-800' :
                                        cat.status === 'warning' ? 'bg-yellow-200 text-yellow-800' :
                                        'bg-green-200 text-green-800'
                                    }`}>
                                        {cat.percentage}%
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Spent: ₹{cat.spent.toFixed(2)}</span>
                                        <span className={cat.remaining < 0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                                            {cat.remaining < 0 ? 'Over' : 'Left'}: ₹{Math.abs(cat.remaining).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full ${
                                                cat.status === 'exceeded' ? 'bg-red-500' :
                                                cat.status === 'warning' ? 'bg-yellow-500' :
                                                'bg-green-500'
                                            }`}
                                            style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Charts Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <PieChart size={24} className="text-purple-600" />
                        Spending Breakdown
                    </h2>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setChartType('pie')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${chartType === 'pie' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                        >
                            Pie Chart
                        </button>
                        <button 
                            onClick={() => setChartType('bar')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${chartType === 'bar' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                        >
                            Bar Chart
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={300}>
                            {chartType === 'pie' ? (
                                <RechartsPie>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </RechartsPie>
                            ) : (
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill="#8b5cf6" />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-3">
                        {report.summary.categoryTotals.map((cat, idx) => (
                            <div key={cat.category} className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div 
                                        className="w-4 h-4 rounded-full" 
                                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                    ></div>
                                    <span className="font-medium text-slate-700">{cat.category}</span>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-800">₹{cat.amount.toFixed(2)}</p>
                                    <p className="text-xs text-slate-500">
                                        {((cat.amount / report.summary.totalExpenses) * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* AI Analysis Section */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-sm border border-purple-200 mb-8">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Sparkles size={24} className="text-purple-600" />
                    AI Financial Analysis
                </h2>
                
                <div className="bg-white rounded-lg p-4 mb-4">
                    <h3 className="font-bold text-slate-800 mb-2">Summary</h3>
                    <p className="text-slate-700 leading-relaxed">{report.aiAnalysis.summary}</p>
                </div>

                <div className="bg-white rounded-lg p-4 mb-4">
                    <h3 className="font-bold text-slate-800 mb-2">Why Expenses Are High</h3>
                    <p className="text-slate-700 leading-relaxed">{report.aiAnalysis.whyExpensesHigh}</p>
                </div>

                <div className="bg-white rounded-lg p-4">
                    <h3 className="font-bold text-slate-800 mb-3">Spending Patterns</h3>
                    <div className="space-y-2">
                        {report.aiAnalysis.spendingPatterns.map((pattern, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                                <span className="text-purple-600 mt-1">•</span>
                                <p className="text-slate-700">{pattern}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Suggestions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    💡 Smart Recommendations
                </h2>
                <div className="space-y-3">
                    {report.aiAnalysis.suggestions.map((sug, idx) => (
                        <div key={idx} className="flex gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100 hover:bg-purple-100 transition">
                            <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {idx + 1}
                            </span>
                            <p className="text-slate-700 pt-1">{sug}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Warnings */}
            {report.aiAnalysis.warnings && report.aiAnalysis.warnings.length > 0 && (
                <div className="bg-red-50 rounded-xl p-6 shadow-sm border border-red-200 mb-8">
                    <h2 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
                        <AlertTriangle size={24} />
                        Alerts & Warnings
                    </h2>
                    <div className="space-y-2">
                        {report.aiAnalysis.warnings.map((warning, idx) => (
                            <div key={idx} className="flex items-start gap-2 p-3 bg-white rounded-lg">
                                <span className="text-red-600 mt-1">⚠️</span>
                                <p className="text-red-800 font-medium">{warning}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Budget Advice */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-200">
                <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <TrendingUp size={24} className="text-blue-600" />
                    Budget Optimization Advice
                </h2>
                <p className="text-slate-700 leading-relaxed">{report.aiAnalysis.budgetAdvice}</p>
            </div>
        </Layout>
    );
};

export default Reports;
