import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, List, LogOut, User, Sparkles } from 'lucide-react';

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
        { path: '/transactions', label: 'Transactions', icon: <List size={20} /> },
        { path: '/reports', label: 'AI Reports', icon: <Sparkles size={20} /> },
        { path: '/profile', label: 'Profile', icon: <User size={20} /> },
    ];

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Sidebar */}
            <div className="w-72 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col shadow-2xl">
                <div className="h-24 flex items-center justify-center border-b border-white/10 shrink-0 px-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center overflow-hidden border-2 border-white/20 shadow-lg">
                            {user?.picture ? (
                                <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={24} />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="font-bold text-lg tracking-wide truncate">{user?.name || 'User'}</h1>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 py-8 space-y-2 px-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center space-x-3 px-5 py-3.5 rounded-xl transition-all duration-200 group ${
                                location.pathname.startsWith(item.path)
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <span className={location.pathname.startsWith(item.path) ? '' : 'group-hover:scale-110 transition-transform'}>
                                {item.icon}
                            </span>
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10 shrink-0">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full px-5 py-3 rounded-xl group"
                    >
                        <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto py-8 px-8">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Layout;
