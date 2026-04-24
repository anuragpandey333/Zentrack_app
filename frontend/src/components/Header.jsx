import { Link } from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';
import { useUser } from '../context/UserContext';
import Avatar from './Avatar';

const Header = ({ title, subtitle, actions }) => {
    const { user } = useUser();

    return (
        <div className="bg-white border-b border-slate-200 px-8 py-4 mb-6 -mx-10 -mt-8 sticky top-0 z-20">
            <div className="flex items-center justify-between">
                {/* Left: Title & Subtitle */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
                    {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
                </div>

                {/* Right: Actions & Profile */}
                <div className="flex items-center gap-4">
                    {/* Custom Actions */}
                    {actions && <div className="flex items-center gap-2">{actions}</div>}

                    {/* Settings */}
                    <Link to="/settings" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <SettingsIcon size={20} className="text-slate-600" />
                    </Link>

                    {/* Profile */}
                    <Link to="/settings" className="flex items-center gap-3 pl-4 border-l border-slate-200">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-slate-800">{user?.name || 'User'}</p>
                            <p className="text-xs text-slate-500">{user?.email}</p>
                        </div>
                        <Avatar src={user?.picture} alt={user?.email || user?.name} size="lg" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Header;
