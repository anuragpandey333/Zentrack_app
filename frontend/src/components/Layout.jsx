import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, List, LogOut, PieChart, Settings, Wallet, ArrowLeftRight, Sparkles, BarChart2, User } from 'lucide-react';
import { useUser } from '../context/UserContext';
import Avatar from './Avatar';

const Layout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useUser();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', label: 'Overview', icon: <LayoutDashboard size={20} /> },
        { path: '/transactions', label: 'Transactions', icon: <ArrowLeftRight size={20} /> },
        { path: '/budgets', label: 'Budgets', icon: <PieChart size={20} /> },
        { path: '/reports', label: 'Reports', icon: <Sparkles size={20} /> },
        { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
    ];

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-slate-200 flex flex-col z-10">
                <div className="h-24 flex items-center px-8 border-b border-transparent shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-black text-white p-1.5 rounded-lg">
                            <Wallet size={20} />
                        </div>
                        <h1 className="font-bold text-xl tracking-tight text-black">Cashflow</h1>
                    </div>
                </div>

                <nav className="flex-1 py-4 px-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${
                                    isActive
                                        ? 'bg-slate-100 text-black'
                                        : 'text-slate-500 hover:text-black hover:bg-slate-50'
                                }`}
                            >
                                <span className={isActive ? 'text-black' : 'text-slate-400'}>
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile Section */}
                <div className="p-4 border-t border-slate-100">
                    <Link to="/settings" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-colors mb-2">
                        <Avatar src={user?.picture} alt={user?.name} size="md" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 text-slate-500 hover:text-black hover:bg-slate-50 transition-colors w-full px-4 py-3 rounded-xl text-[15px] font-medium"
                    >
                        <LogOut size={20} className="text-slate-400" />
                        <span>Log out</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto bg-slate-50">
                <div className="w-full py-8 px-10">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Layout;

