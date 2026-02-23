import { Link, useLocation } from 'react-router-dom';
import { Home, Activity, CreditCard, BarChart3, Calculator } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: Home },
        { name: 'Workouts', path: '/workouts', icon: Activity },
        { name: 'Expenses', path: '/expenses', icon: CreditCard },
        { name: 'Insights', path: '/insights', icon: BarChart3 },
        { name: 'Calc', path: '/calculator', icon: Calculator },
    ];

    return (
        <div className="bottom-nav-wrapper">
            <div className="bottom-nav-container">
                <nav className="bottom-nav">
                    {navItems.map((item) => {
                        // The 'log' route is usually /expenses/new or similar in this app depending on user path. 
                        // Wait, looking at the App.jsx routing, it says /expenses/new or /workouts/new.
                        // I will set Log to '/workouts/new' as a default if it doesn't match a generic path.
                        // However, let's keep the existing paths that were in the original file:
                        // { name: 'Dashboard', path: '/', icon: Home },
                        // { name: 'Log', path: '/log', icon: PlusCircle }, BUT wait, /log doesn't exist maybe? 
                        // Actually I'll use the original paths but apply the active logic correctly.
                        const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/');
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                                aria-label={item.name}
                            >
                                <div className="nav-active-bg"></div>
                                <div className="nav-content">
                                    <Icon className="nav-icon" />
                                    <span className="nav-indicator"></span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};

export default BottomNav;
