import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkouts, useTransactions } from '../../hooks/useFirestore';
import { toDate } from '../../utils/dateHelpers';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Dumbbell, Wallet, TrendingUp, ArrowRight } from 'lucide-react';
import './OverviewDashboard.css';

const OverviewDashboard = () => {
    const { data: workouts, loading: loadingW } = useWorkouts();
    const { data: transactions, loading: loadingT } = useTransactions();
    const navigate = useNavigate();

    const now = new Date();
    const weekInterval = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    const monthInterval = { start: startOfMonth(now), end: endOfMonth(now) };

    const stats = useMemo(() => {
        const weekWorkouts = workouts.filter((w) => {
            const d = toDate(w.date);
            return d && isWithinInterval(d, weekInterval);
        });

        const monthTransactions = transactions.filter((tx) => {
            const d = toDate(tx.date);
            return d && isWithinInterval(d, monthInterval);
        });

        const monthTotal = monthTransactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

        const fitnessSpend = monthTransactions
            .filter((tx) => tx.category_group === 'Health & Fitness')
            .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

        return {
            weekWorkoutCount: weekWorkouts.length,
            monthExpenseTotal: monthTotal,
            fitnessSpend,
            recentWorkouts: workouts.slice(0, 3),
            recentTransactions: transactions.slice(0, 3)
        };
    }, [workouts, transactions]);

    const loading = loadingW || loadingT;

    return (
        <div className="page-container">
            <h2 className="dashboard-title">Dashboard</h2>

            {loading && <div className="loading-text">Loading...</div>}

            {!loading && (
                <>
                    {/* Summary cards */}
                    <div className="summary-grid">
                        <div
                            className="summary-card glass-card"
                            onClick={() => navigate('/workouts')}
                        >
                            <div className="summary-icon icon-fitness">
                                <Dumbbell size={24} />
                            </div>
                            <div className="summary-content">
                                <span className="summary-value">{stats.weekWorkoutCount}</span>
                                <span className="summary-label">Workouts this week</span>
                            </div>
                            <ArrowRight size={16} className="summary-arrow" />
                        </div>

                        <div
                            className="summary-card glass-card"
                            onClick={() => navigate('/expenses')}
                        >
                            <div className="summary-icon icon-finance">
                                <Wallet size={24} />
                            </div>
                            <div className="summary-content">
                                <span className="summary-value">${stats.monthExpenseTotal.toFixed(2)}</span>
                                <span className="summary-label">Spent this month</span>
                            </div>
                            <ArrowRight size={16} className="summary-arrow" />
                        </div>

                        {stats.fitnessSpend > 0 && (
                            <div className="summary-card glass-card">
                                <div className="summary-icon icon-crossover">
                                    <TrendingUp size={24} />
                                </div>
                                <div className="summary-content">
                                    <span className="summary-value">${stats.fitnessSpend.toFixed(2)}</span>
                                    <span className="summary-label">Fitness spending this month</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Recent activity */}
                    <div className="recent-section">
                        {stats.recentWorkouts.length > 0 && (
                            <div className="recent-block">
                                <h3>Recent Workouts</h3>
                                <div className="recent-list">
                                    {stats.recentWorkouts.map((w) => (
                                        <div key={w.id} className="recent-item">
                                            <span className="recent-name">{w.exercise}</span>
                                            <span className="recent-meta">{w.category}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {stats.recentTransactions.length > 0 && (
                            <div className="recent-block">
                                <h3>Recent Expenses</h3>
                                <div className="recent-list">
                                    {stats.recentTransactions.map((tx) => (
                                        <div key={tx.id} className="recent-item">
                                            <span className="recent-name">{tx.description}</span>
                                            <span className="recent-meta">${Number(tx.amount).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default OverviewDashboard;
