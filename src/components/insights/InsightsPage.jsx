import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useWorkouts, useTransactions } from '../../hooks/useFirestore';
import { useInsightsData } from './useInsightsData';
import WorkoutFrequencyChart from './WorkoutFrequencyChart';
import VolumeProgressionChart from './VolumeProgressionChart';
import CategoryBreakdownChart from './CategoryBreakdownChart';
import RPETrendChart from './RPETrendChart';
import SpendingTrendChart from './SpendingTrendChart';
import SpendingByCategoryChart from './SpendingByCategoryChart';
import IncomeVsExpensesChart from './IncomeVsExpensesChart';
import './InsightsPage.css';

const TABS = ['All', 'Fitness', 'Finance'];

const InsightsPage = () => {
    const [activeTab, setActiveTab] = useState('All');
    const { data: workouts, loading: wLoading } = useWorkouts(200);
    const { data: transactions, loading: tLoading } = useTransactions(200);
    const loading = wLoading || tLoading;

    const {
        workoutFrequency,
        volumeProgression,
        categoryBreakdown,
        rpeTrend,
        spendingTrend,
        spendingByCategory,
        incomeVsExpenses,
        totalWorkouts,
        totalSpent,
        totalIncome,
    } = useInsightsData(workouts, transactions);

    const showFitness = activeTab === 'All' || activeTab === 'Fitness';
    const showFinance = activeTab === 'All' || activeTab === 'Finance';
    const hasData = workouts.length > 0 || transactions.length > 0;

    if (loading) {
        return (
            <div className="page-container">
                <h1 className="insights-title">Insights</h1>
                <div className="insights-empty">
                    <p>Loading your data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1 className="insights-title">Insights</h1>

            <div className="tab-pills">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        className={`tab-pill${activeTab === tab ? ' active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {!hasData ? (
                <div className="insights-empty">
                    <BarChart3 className="empty-icon" />
                    <p>Log some workouts or expenses to see your insights here.</p>
                </div>
            ) : (
                <>
                    <div className="summary-stats">
                        {showFitness && (
                            <div className="summary-stat glass-card">
                                <div className="stat-value indigo">{totalWorkouts}</div>
                                <div className="stat-label">Workouts</div>
                            </div>
                        )}
                        {showFinance && (
                            <div className="summary-stat glass-card">
                                <div className="stat-value pink">${totalSpent.toFixed(2)}</div>
                                <div className="stat-label">Total Spent</div>
                            </div>
                        )}
                        {showFinance && totalIncome > 0 && (
                            <div className="summary-stat glass-card">
                                <div className="stat-value green">${totalIncome.toFixed(2)}</div>
                                <div className="stat-label">Total Income</div>
                            </div>
                        )}
                    </div>

                    <div className="chart-grid">
                        {showFitness && workouts.length > 0 && (
                            <>
                                <WorkoutFrequencyChart data={workoutFrequency} />
                                <VolumeProgressionChart data={volumeProgression} />
                                <CategoryBreakdownChart data={categoryBreakdown} />
                                <RPETrendChart data={rpeTrend} />
                            </>
                        )}
                        {showFinance && transactions.length > 0 && (
                            <>
                                <IncomeVsExpensesChart data={incomeVsExpenses} />
                                <SpendingTrendChart data={spendingTrend} />
                                <SpendingByCategoryChart data={spendingByCategory} />
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default InsightsPage;
