import { NavLink } from 'react-router-dom';
import { Dumbbell, Wallet, LayoutDashboard } from 'lucide-react';

const BottomNav = () => {
    const navItems = [
        { path: '/workouts', icon: Dumbbell, label: 'Workouts' },
        { path: '/expenses', icon: Wallet, label: 'Expenses' },
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }
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
