import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, List, LogOut, User } from 'lucide-react';

const Layout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/reports', label: 'Reports', icon: <FileText size={20} /> },
        { path: '/transactions', label: 'Transactions', icon: <List size={20} /> },
    ];

    return (
        <div className="flex h-screen bg-transparent">
            {/* Sidebar */}
            <div className="w-64 bg-brand-dark text-white flex flex-col shadow-xl">
                <div className="h-20 flex items-center justify-center border-b border-white/10 shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center overflow-hidden border-2 border-white">
                            {user?.picture ? (
                                <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={20} />
                            )}
                        </div>
                        <div>
                            <h1 className="font-bold text-lg tracking-wide">{user?.name || 'User'}</h1>
                            <p className="text-xs text-slate-400 truncate w-32">{user?.email}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 py-6 space-y-2 px-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                location.pathname.startsWith(item.path)
                                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30'
                                    : 'text-brand-light hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {item.icon}
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10 shrink-0">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 text-slate-400 hover:text-red-400 transition-colors w-full px-4 py-2"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto bg-transparent relative">
                <div className="max-w-7xl mx-auto py-8 px-8">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Layout;
