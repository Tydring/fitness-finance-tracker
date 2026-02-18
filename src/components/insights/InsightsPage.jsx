import { useState } from 'react';
import { BarChart3, Sparkles } from 'lucide-react';
import { useWorkouts, useTransactions } from '../../hooks/useFirestore';
import { useWeeklyInsights } from '../../hooks/useWeeklyInsights';
import { useInsightsData } from './useInsightsData';
import WorkoutFrequencyChart from './WorkoutFrequencyChart';
import VolumeProgressionChart from './VolumeProgressionChart';
import CategoryBreakdownChart from './CategoryBreakdownChart';
import RPETrendChart from './RPETrendChart';
import SpendingTrendChart from './SpendingTrendChart';
import SpendingByCategoryChart from './SpendingByCategoryChart';
import IncomeVsExpensesChart from './IncomeVsExpensesChart';
import WeeklyInsightsCard from './WeeklyInsightsCard';
import './InsightsPage.css';

const TABS = ['All', 'Fitness', 'Finance', 'AI'];

const InsightsPage = () => {
    const [activeTab, setActiveTab] = useState('All');
    const { data: workouts, loading: wLoading } = useWorkouts(200);
    const { data: transactions, loading: tLoading } = useTransactions(200);
    const { insights, loading: insightsLoading } = useWeeklyInsights();
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
    const showAI = activeTab === 'AI';
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
                        className={`tab-pill${activeTab === tab ? ' active' : ''}${tab === 'AI' ? ' tab-pill-ai' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'AI' && <Sparkles size={11} style={{ marginRight: '0.25rem' }} />}
                        {tab}
                    </button>
                ))}
            </div>

            {/* AI Tab */}
            {showAI && (
                <div className="chart-grid">
                    {insightsLoading ? (
                        <div className="weekly-insights glass-card insights-skeleton">
                            <div className="skeleton-line" style={{ width: '40%' }} />
                            <div className="skeleton-line" style={{ width: '100%' }} />
                            <div className="skeleton-line" style={{ width: '85%' }} />
                            <div className="skeleton-line" style={{ width: '60%', marginTop: '0.5rem' }} />
                            <div className="skeleton-line" style={{ width: '100%' }} />
                            <div className="skeleton-line" style={{ width: '75%' }} />
                        </div>
                    ) : insights ? (
                        <WeeklyInsightsCard insights={insights} />
                    ) : (
                        <div className="weekly-insights glass-card insights-not-ready">
                            <Sparkles size={32} />
                            <p>
                                AI insights are generated automatically every Monday.
                                Check back after your first full week of data!
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Charts Tabs */}
            {!showAI && !hasData && (
                <div className="insights-empty">
                    <BarChart3 className="empty-icon" />
                    <p>Log some workouts or expenses to see your insights here.</p>
                </div>
            )}

            {!showAI && hasData && (
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
