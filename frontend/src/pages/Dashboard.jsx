import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center space-x-4">
        <div className={`p-4 rounded-xl ${colorClass}`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const [summary, setSummary] = useState({ count: 0, totalCredit: 0, totalDebit: 0, balance: 0 });
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const summaryRes = await axios.get('http://localhost:8000/api/transactions/summary', config);
                setSummary(summaryRes.data);

                const txRes = await axios.get('http://localhost:8000/api/transactions', config);
                // process chart data (group by date)
                const dataByDate = {};
                txRes.data.forEach(tx => {
                    const date = new Date(tx.date).toISOString().split('T')[0];
                    if (!dataByDate[date]) {
                        dataByDate[date] = 0;
                    }
                    dataByDate[date] += tx.amount; // total activity
                });

                // Generate last 30 days
                const last30Days = Array.from({ length: 30 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (29 - i));
                    return d.toISOString().split('T')[0];
                });

                const formattedChart = last30Days.map(date => ({
                    date,
                    Amount: dataByDate[date] || 0
                }));
                setChartData(formattedChart);

            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    return (
        <Layout>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Overview</h1>
                <p className="text-slate-500">Welcome back! Here's your financial summary.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Transaction"
                    value={summary.count}
                    icon={Activity}
                    colorClass="bg-pink-100 text-pink-600"
                    subtitle={summary.count + " Estimate"}
                />
                <StatCard
                    title="Total Credit"
                    value={`₹${summary.totalCredit.toLocaleString()}`}
                    icon={TrendingUp}
                    colorClass="bg-green-100 text-green-600"
                    subtitle="Funds Received"
                />
                <StatCard
                    title="Total Debit"
                    value={`₹${summary.totalDebit.toLocaleString()}`}
                    icon={TrendingDown}
                    colorClass="bg-orange-100 text-orange-600"
                    subtitle="Funds Spent"
                />
                <StatCard
                    title="Balance"
                    value={`₹${summary.balance.toLocaleString()}`}
                    icon={DollarSign}
                    colorClass="bg-purple-100 text-purple-600"
                    subtitle="Current Available"
                />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="mb-6 flex items-center space-x-2">
                    <div className="p-2 bg-brand-light text-brand-primary rounded-lg">
                        <Activity size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">Daily Transaction Summary (Last 30 Days)</h2>
                </div>

                <div className="h-80 w-full" style={{ minHeight: 320 }}>
                    <ResponsiveContainer width="100%" height={320}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-brand-primary)" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="var(--color-brand-primary)" stopOpacity={0.05}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="Amount" 
                                stroke="var(--color-brand-primary)" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorAmount)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
