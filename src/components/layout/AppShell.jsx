import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import BottomNav from './BottomNav';

const AppShell = () => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-slate-400">
                Loading...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100">
            <main className="flex-1 pb-20 overflow-y-auto">
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
};

export default AppShell;
