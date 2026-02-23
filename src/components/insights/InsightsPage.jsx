import { useState } from "react";
import { BarChart3, Sparkles } from "lucide-react";
import { useWorkouts, useTransactions } from "../../hooks/useFirestore";
import { useWeeklyInsights } from "../../hooks/useWeeklyInsights";
import { useExchangeRates } from "../../hooks/useExchangeRates";
import { useInsightsData } from "./useInsightsData";
import WorkoutFrequencyChart from "./WorkoutFrequencyChart";
import VolumeProgressionChart from "./VolumeProgressionChart";
import CategoryBreakdownChart from "./CategoryBreakdownChart";
import RPETrendChart from "./RPETrendChart";
import SpendingTrendChart from "./SpendingTrendChart";
import SpendingByCategoryChart from "./SpendingByCategoryChart";
import IncomeVsExpensesChart from "./IncomeVsExpensesChart";
import IncomeSplitChart from "./IncomeSplitChart";
import WeeklyInsightsCard from "./WeeklyInsightsCard";
import "./InsightsPage.css";

const TABS = ["All", "Fitness", "Finance", "AI"];

const InsightsPage = () => {
  const [activeTab, setActiveTab] = useState("All");
  const { data: workouts, loading: wLoading } = useWorkouts(200);
  const { data: transactions, loading: tLoading } = useTransactions(200);
  const { insights, loading: insightsLoading } = useWeeklyInsights();
  const { rates } = useExchangeRates();
  const loading = wLoading || tLoading;

  const bcvUsd = rates?.bcv_usd || null;

  const {
    workoutFrequency,
    volumeProgression,
    categoryBreakdown,
    rpeTrend,
    totalWorkouts,

    spendingTrendUSD,
    spendingByCategoryUSD,
    incomeVsExpensesUSD,
    incomeSplitUSD,
    totalSpentUSD,
    totalIncomeUSD,
    currentMonthIncomeUSD,
    currentMonthExpensesUSD,
    currentMonthNetUSD,

    spendingTrendVES,
    spendingByCategoryVES,
    incomeVsExpensesVES,
    incomeSplitVES,
    totalSpentVES,
    totalIncomeVES,
    currentMonthIncomeVES,
    currentMonthExpensesVES,
    currentMonthNetVES,
  } = useInsightsData(workouts, transactions);

  const showFitness = activeTab === "All" || activeTab === "Fitness";
  const showFinance = activeTab === "All" || activeTab === "Finance";
  const showAI = activeTab === "AI";
  const hasData = workouts.length > 0 || transactions.length > 0;

  // Local toggle for Finance viewing
  const [financeCurrency, setFinanceCurrency] = useState("USD");

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
            className={`tab-pill${activeTab === tab ? " active" : ""}${tab === "AI" ? " tab-pill-ai" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "AI" && (
              <Sparkles size={11} style={{ marginRight: "0.25rem" }} />
            )}
            {tab}
          </button>
        ))}
      </div>

      {/* AI Tab */}
      {showAI && (
        <div className="chart-grid">
          {insightsLoading ? (
            <div className="weekly-insights glass-card insights-skeleton">
              <div className="skeleton-line" style={{ width: "40%" }} />
              <div className="skeleton-line" style={{ width: "100%" }} />
              <div className="skeleton-line" style={{ width: "85%" }} />
              <div
                className="skeleton-line"
                style={{ width: "60%", marginTop: "0.5rem" }}
              />
              <div className="skeleton-line" style={{ width: "100%" }} />
              <div className="skeleton-line" style={{ width: "75%" }} />
            </div>
          ) : insights ? (
            <WeeklyInsightsCard insights={insights} />
          ) : (
            <div className="weekly-insights glass-card insights-not-ready">
              <Sparkles size={32} />
              <p>
                AI insights are generated automatically every Monday. Check back
                after your first full week of data!
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
          {showFinance && (
            <div className="currency-toggle-wrapper">
              <div className="tab-pills mini">
                <button
                  className={`tab-pill ${financeCurrency === "USD" ? "active" : ""}`}
                  onClick={() => setFinanceCurrency("USD")}
                >
                  USD $
                </button>
                <button
                  className={`tab-pill ${financeCurrency === "VES" ? "active" : ""}`}
                  onClick={() => setFinanceCurrency("VES")}
                >
                  VES Bs.
                </button>
              </div>
            </div>
          )}

          <div className="summary-stats-container">
            {showFitness && (
              <div className="summary-stats">
                <div className="summary-stat glass-card">
                  <div className="stat-value indigo">{totalWorkouts}</div>
                  <div className="stat-label">Workouts</div>
                </div>
              </div>
            )}

            {showFinance && financeCurrency === "USD" && (
              <>
                <div className="summary-stats">
                  <div className="summary-stat glass-card">
                    <div className="stat-value pink">
                      ${currentMonthExpensesUSD.toFixed(2)}
                    </div>
                    <div className="stat-label">Spent (This Mth)</div>
                  </div>
                  <div className="summary-stat glass-card">
                    <div className="stat-value green">
                      ${currentMonthIncomeUSD.toFixed(2)}
                    </div>
                    <div className="stat-label">Income (This Mth)</div>
                  </div>
                </div>
                <div
                  className="summary-stats"
                  style={{ gridTemplateColumns: "1fr", marginTop: "-0.5rem" }}
                >
                  <div className="summary-stat glass-card">
                    <div className="stat-value indigo">
                      ${currentMonthNetUSD.toFixed(2)}
                    </div>
                    <div className="stat-label">Net Cashflow</div>
                    <div
                      className="stat-subtitle"
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--text-muted)",
                        marginTop: "0.25rem",
                      }}
                    >
                      All-time Net: $
                      {(totalIncomeUSD - totalSpentUSD).toFixed(2)}
                    </div>
                  </div>
                </div>
              </>
            )}

            {showFinance && financeCurrency === "VES" && (
              <>
                <div className="summary-stats">
                  <div className="summary-stat glass-card">
                    <div className="stat-value pink">
                      Bs. {currentMonthExpensesVES.toFixed(2)}
                    </div>
                    {bcvUsd && (
                      <div className="summary-sub" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.3rem', marginBottom: '0.25rem' }}>
                        ≈ ${(currentMonthExpensesVES / bcvUsd).toFixed(2)} USD
                      </div>
                    )}
                    <div className="stat-label">Spent (This Mth)</div>
                  </div>
                  <div className="summary-stat glass-card">
                    <div className="stat-value green">
                      Bs. {currentMonthIncomeVES.toFixed(2)}
                    </div>
                    {bcvUsd && (
                      <div className="summary-sub" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.3rem', marginBottom: '0.25rem' }}>
                        ≈ ${(currentMonthIncomeVES / bcvUsd).toFixed(2)} USD
                      </div>
                    )}
                    <div className="stat-label">Income (This Mth)</div>
                  </div>
                </div>
                <div
                  className="summary-stats"
                  style={{ gridTemplateColumns: "1fr", marginTop: "-0.5rem" }}
                >
                  <div className="summary-stat glass-card">
                    <div className="stat-value indigo">
                      Bs. {currentMonthNetVES.toFixed(2)}
                    </div>
                    {bcvUsd && (
                      <div className="summary-sub" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.3rem', marginBottom: '0.25rem' }}>
                        ≈ ${(currentMonthNetVES / bcvUsd).toFixed(2)} USD
                      </div>
                    )}
                    <div className="stat-label">Net Cashflow</div>
                    <div
                      className="stat-subtitle"
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--text-muted)",
                        marginTop: "0.25rem",
                      }}
                    >
                      All-time Net: Bs.{" "}
                      {(totalIncomeVES - totalSpentVES).toFixed(2)}
                      {bcvUsd && ` (≈ $${((totalIncomeVES - totalSpentVES) / bcvUsd).toFixed(2)} USD)`}
                    </div>
                  </div>
                </div>
              </>
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
            {showFinance &&
              transactions.length > 0 &&
              financeCurrency === "USD" && (
                <>
                  <IncomeSplitChart data={incomeSplitUSD} currency="USD" />
                  <IncomeVsExpensesChart
                    data={incomeVsExpensesUSD}
                    currency="USD"
                  />
                  <SpendingTrendChart data={spendingTrendUSD} currency="USD" />
                  <SpendingByCategoryChart
                    data={spendingByCategoryUSD}
                    currency="USD"
                  />
                </>
              )}
            {showFinance &&
              transactions.length > 0 &&
              financeCurrency === "VES" && (
                <>
                  <IncomeSplitChart data={incomeSplitVES} currency="VES" />
                  <IncomeVsExpensesChart
                    data={incomeVsExpensesVES}
                    currency="VES"
                  />
                  <SpendingTrendChart data={spendingTrendVES} currency="VES" />
                  <SpendingByCategoryChart
                    data={spendingByCategoryVES}
                    currency="VES"
                  />
                </>
              )}
          </div>
        </>
      )}
    </div>
  );
};

export default InsightsPage;
