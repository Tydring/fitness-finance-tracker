import { NavLink } from 'react-router-dom';
import { Dumbbell, Wallet, LayoutDashboard, BarChart3 } from 'lucide-react';

const BottomNav = () => {
    const navItems = [
        { path: '/workouts', icon: Dumbbell, label: 'Workouts' },
        { path: '/expenses', icon: Wallet, label: 'Expenses' },
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/insights', icon: BarChart3, label: 'Insights' }
    ];

    return (
        <nav className="bottom-nav glass">
            {navItems.map(({ path, icon: Icon, label }) => (
                <NavLink
                    key={path}
                    to={path}
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                        }`
                    }
                >
                    <Icon className="w-6 h-6 mb-1" />
                    <span>{label}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default BottomNav;
