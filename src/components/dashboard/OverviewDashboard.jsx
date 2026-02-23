import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkouts, useTransactions } from "../../hooks/useFirestore";
import { toDate } from "../../utils/dateHelpers";
import { getCurrencyForAccount } from "../../config/categories";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import { Dumbbell, Wallet, TrendingUp, ArrowRight, Flame } from "lucide-react";
import ExchangeRateWidget from "./ExchangeRateWidget";
import { useUserStats } from "../../context/UserStatsContext";
import { useExchangeRates } from "../../hooks/useExchangeRates";
import "./OverviewDashboard.css";

const OverviewDashboard = () => {
  // ... (hooks remain same) ...
  // ... (stats calculation logic from previous step is implied to be here already in the file) ...

  // ... (rendering code) ...

  const { data: workouts, loading: loadingW } = useWorkouts();
  const { data: transactions, loading: loadingT } = useTransactions();
  const { stats: userStats } = useUserStats();
  const { rates } = useExchangeRates();
  const navigate = useNavigate();

  const bcvUsd = rates?.bcv_usd || null;

  const now = new Date();
  const weekInterval = {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  };
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

    // Initialize totals
    let expenseUSD = 0;
    let expenseVES = 0;

    // Calculate monthly expenses split by currency
    monthTransactions
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        const currency = getCurrencyForAccount(tx.account);
        const amount = Number(tx.amount) || 0;

        if (currency === "VES") {
          expenseVES += amount;
        } else {
          expenseUSD += amount;
        }
      });

    const accountBalances = transactions.reduce((acc, tx) => {
      const account = tx.account || "Unknown";
      const amount = Number(tx.amount) || 0;
      if (!acc[account]) acc[account] = 0;
      if (tx.type === "income") {
        acc[account] += amount;
      } else {
        acc[account] -= amount;
      }
      return acc;
    }, {});

    const fitnessSpend = monthTransactions
      .filter((tx) => tx.category_group === "Health & Fitness")
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    return {
      weekWorkoutCount: weekWorkouts.length,
      monthExpenseUSD: expenseUSD,
      monthExpenseVES: expenseVES,
      fitnessSpend,
      accountBalances,
      recentWorkouts: workouts.slice(0, 3),
      recentTransactions: transactions
        .filter((tx) => tx.type !== "income")
        .slice(0, 3),
    };
  }, [workouts, transactions]);

  const loading = loadingW || loadingT;

  return (
    <div className="page-container">
      <h2 className="dashboard-title">Dashboard</h2>

      <ExchangeRateWidget />

      {loading && <div className="loading-text">Loading...</div>}

      {!loading && (
        <>
          {/* Summary cards */}
          <div className="summary-grid">
            <div
              className="summary-card glass-card"
              onClick={() => navigate("/workouts")}
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

            {userStats && (
              <div
                className="summary-card streak-card glass-card"
                onClick={() => navigate("/achievements")}
              >
                <div
                  className="summary-icon"
                  style={{ background: 'rgba(255, 107, 107, 0.15)', color: '#ff6b6b' }}
                >
                  <Flame size={24} />
                </div>
                <div className="summary-content">
                  <span className="summary-value">{userStats.currentStreak} 🔥</span>
                  <span className="summary-label">Current Streak</span>
                </div>
              </div>
            )}

            {stats.monthExpenseUSD > 0 || stats.monthExpenseVES === 0 ? (
              <div
                className="summary-card glass-card"
                onClick={() => navigate("/expenses")}
              >
                <div className="summary-icon icon-finance">
                  <Wallet size={24} />
                </div>
                <div className="summary-content">
                  <span className="summary-value">
                    ${stats.monthExpenseUSD.toFixed(2)}
                  </span>
                  <span className="summary-label">Spent this month (USD)</span>
                </div>
                <ArrowRight size={16} className="summary-arrow" />
              </div>
            ) : null}

            {stats.monthExpenseVES > 0 ? (
              <div
                className="summary-card glass-card"
                onClick={() => navigate("/expenses")}
              >
                <div
                  className="summary-icon"
                  style={{
                    backgroundColor: "rgba(236, 72, 153, 0.1)",
                    color: "#ec4899",
                    padding: "0.5rem",
                    borderRadius: "0.5rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <Wallet size={24} />
                </div>
                <div className="summary-content">
                  <span className="summary-value text-sm-custom">
                    Bs. {stats.monthExpenseVES.toLocaleString("es-VE")}
                  </span>
                  {bcvUsd && (
                    <span className="summary-sub">
                      ≈ ${(stats.monthExpenseVES / bcvUsd).toFixed(2)} USD
                    </span>
                  )}
                  <span className="summary-label">Spent this month (VES)</span>
                </div>
                <ArrowRight size={16} className="summary-arrow" />
              </div>
            ) : null}

            {stats.fitnessSpend > 0 && (
              <div className="summary-card glass-card">
                <div className="summary-icon icon-crossover">
                  <TrendingUp size={24} />
                </div>
                <div className="summary-content">
                  <span className="summary-value">
                    ${stats.fitnessSpend.toFixed(2)}
                  </span>
                  <span className="summary-label">
                    Fitness spending this month
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Account Balances */}
          <div className="account-balances-grid">
            {Object.entries(stats.accountBalances).map(([account, balance]) => {
              const currency = getCurrencyForAccount(account);
              const symbol = currency === "VES" ? "Bs. " : "$";
              return (
                <div
                  key={account}
                  className={`account-card glass-card ${balance >= 0 ? "positive" : "negative"}`}
                >
                  <span className="account-name">{account}</span>
                  <span className="account-balance">
                    {symbol}
                    {balance.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  {currency === "VES" && bcvUsd && (
                    <span className="account-balance-sub">
                      ≈ ${(balance / bcvUsd).toFixed(2)} USD
                    </span>
                  )}
                </div>
              );
            })}
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
                  {stats.recentTransactions.map((tx) => {
                    const currency = getCurrencyForAccount(tx.account);
                    const symbol = currency === "VES" ? "Bs. " : "$";
                    return (
                      <div key={tx.id} className="recent-item">
                        <span className="recent-name">{tx.description}</span>
                        <div className="recent-amount-col">
                          <span className="recent-meta">
                            {symbol}
                            {Number(tx.amount).toFixed(2)}
                          </span>
                          {currency === "VES" && bcvUsd && (
                            <span className="recent-meta-sub">
                              ≈ ${(Number(tx.amount) / bcvUsd).toFixed(2)} USD
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
