import { useMemo } from "react";
import {
  startOfWeek,
  startOfMonth,
  subWeeks,
  subMonths,
  subDays,
  format,
  differenceInCalendarWeeks,
  differenceInCalendarMonths,
} from "date-fns";
import { toDate } from "../../utils/dateHelpers";

const WEEKS = 8;
const DAYS = 30;
const MONTHS = 6;

export const useInsightsData = (workouts = [], transactions = []) => {
  return useMemo(() => {
    const now = new Date();
    const eightWeeksAgo = subWeeks(
      startOfWeek(now, { weekStartsOn: 1 }),
      WEEKS - 1,
    );
    const thirtyDaysAgo = subDays(now, DAYS - 1);

    // --- Workout Frequency (workouts per week, last 8 weeks) ---
    const weekBuckets = Array.from({ length: WEEKS }, (_, i) => {
      const weekStart = subWeeks(
        startOfWeek(now, { weekStartsOn: 1 }),
        WEEKS - 1 - i,
      );
      return { week: format(weekStart, "MMM d"), count: 0 };
    });

    const categoryMap = {};
    let rpeWeekTotals = Array.from({ length: WEEKS }, () => ({
      sum: 0,
      count: 0,
    }));
    let volumeWeekTotals = Array.from({ length: WEEKS }, () => 0);

    workouts.forEach((w) => {
      const d = toDate(w.date);
      if (!d) return;

      // Category breakdown (all time)
      const cat = w.category || "Other";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;

      // Weekly stats
      if (d >= eightWeeksAgo) {
        const weekIdx = differenceInCalendarWeeks(d, eightWeeksAgo, {
          weekStartsOn: 1,
        });
        if (weekIdx >= 0 && weekIdx < WEEKS) {
          weekBuckets[weekIdx].count++;
          if (w.rpe != null) {
            rpeWeekTotals[weekIdx].sum += Number(w.rpe);
            rpeWeekTotals[weekIdx].count++;
          }
          // Volume: sets × reps × weight_kg (strength only)
          if (w.sets && w.reps && w.weight_kg) {
            volumeWeekTotals[weekIdx] += w.sets * w.reps * w.weight_kg;
          }
        }
      }
    });

    const workoutFrequency = weekBuckets;

    const CATEGORY_COLORS = [
      "#818cf8",
      "#c084fc",
      "#f472b6",
      "#fb923c",
      "#34d399",
      "#60a5fa",
      "#fbbf24",
    ];
    const categoryBreakdown = Object.entries(categoryMap).map(
      ([name, value], i) => ({
        name,
        value,
        fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      }),
    );

    const rpeTrend = weekBuckets.map((bucket, i) => ({
      week: bucket.week,
      rpe:
        rpeWeekTotals[i].count > 0
          ? Math.round((rpeWeekTotals[i].sum / rpeWeekTotals[i].count) * 10) /
            10
          : null,
    }));

    const volumeProgression = weekBuckets.map((bucket, i) => ({
      week: bucket.week,
      volume: Math.round(volumeWeekTotals[i]),
    }));

    // --- Spending Trend (daily spend, last 30 days) ---
    const dayBucketsUSD = {};
    const dayBucketsVES = {};
    for (let i = 0; i < DAYS; i++) {
      const day = format(subDays(now, DAYS - 1 - i), "MMM d");
      dayBucketsUSD[day] = 0;
      dayBucketsVES[day] = 0;
    }

    // --- Income vs Expenses (monthly, last 6 months) ---
    const monthStart = startOfMonth(subMonths(now, MONTHS - 1));
    const monthBucketsUSD = Array.from({ length: MONTHS }, (_, i) => {
      const d = subMonths(startOfMonth(now), MONTHS - 1 - i);
      return { month: format(d, "MMM"), income: 0, expenses: 0 };
    });
    const monthBucketsVES = Array.from({ length: MONTHS }, (_, i) => {
      const d = subMonths(startOfMonth(now), MONTHS - 1 - i);
      return { month: format(d, "MMM"), income: 0, expenses: 0 };
    });

    // --- Income Split (monthly, last 6 months) ---
    const incomeSplitUSD = Array.from({ length: MONTHS }, (_, i) => {
      const d = subMonths(startOfMonth(now), MONTHS - 1 - i);
      return { month: format(d, "MMM") };
    });
    const incomeSplitVES = Array.from({ length: MONTHS }, (_, i) => {
      const d = subMonths(startOfMonth(now), MONTHS - 1 - i);
      return { month: format(d, "MMM") };
    });

    const spendCategoryMapUSD = {};
    const spendCategoryMapVES = {};

    transactions.forEach((t) => {
      const d = toDate(t.date);
      if (!d) return;
      const amount = Number(t.amount) || 0;
      const isIncome = t.type === "income";

      // Note: If t.currency is saved on the transaction we use that, otherwise default fallback
      // Phase 5.5 started saving `currency`, but just in case, we can assume USD if missing.
      const currency = t.currency || "USD";
      const isVES = currency === "VES";

      // Daily spending (expenses only)
      if (!isIncome && d >= thirtyDaysAgo) {
        const key = format(d, "MMM d");
        if (isVES) {
          if (key in dayBucketsVES) dayBucketsVES[key] += amount;
        } else {
          if (key in dayBucketsUSD) dayBucketsUSD[key] += amount;
        }
      }

      // Monthly income vs expenses AND Income split
      if (d >= monthStart) {
        const mIdx = differenceInCalendarMonths(d, monthStart);
        if (mIdx >= 0 && mIdx < MONTHS) {
          if (isVES) {
            if (isIncome) {
              monthBucketsVES[mIdx].income += amount;
              const category = t.category || "Other";
              incomeSplitVES[mIdx][category] =
                (incomeSplitVES[mIdx][category] || 0) + amount;
            } else {
              monthBucketsVES[mIdx].expenses += amount;
            }
          } else {
            if (isIncome) {
              monthBucketsUSD[mIdx].income += amount;
              const category = t.category || "Other";
              incomeSplitUSD[mIdx][category] =
                (incomeSplitUSD[mIdx][category] || 0) + amount;
            } else {
              monthBucketsUSD[mIdx].expenses += amount;
            }
          }
        }
      }

      // Category group spending (all time, expenses only)
      if (!isIncome) {
        const group = t.category_group || "Other";
        if (isVES) {
          spendCategoryMapVES[group] =
            (spendCategoryMapVES[group] || 0) + amount;
        } else {
          spendCategoryMapUSD[group] =
            (spendCategoryMapUSD[group] || 0) + amount;
        }
      }
    });

    const spendingTrendUSD = Object.entries(dayBucketsUSD).map(
      ([day, amount]) => ({
        day,
        amount: Math.round(amount * 100) / 100,
      }),
    );
    const spendingTrendVES = Object.entries(dayBucketsVES).map(
      ([day, amount]) => ({
        day,
        amount: Math.round(amount * 100) / 100,
      }),
    );

    const spendingByCategoryUSD = Object.entries(spendCategoryMapUSD)
      .map(([name, amount]) => ({
        name,
        amount: Math.round(amount * 100) / 100,
      }))
      .sort((a, b) => b.amount - a.amount);

    const spendingByCategoryVES = Object.entries(spendCategoryMapVES)
      .map(([name, amount]) => ({
        name,
        amount: Math.round(amount * 100) / 100,
      }))
      .sort((a, b) => b.amount - a.amount);

    const incomeVsExpensesUSD = monthBucketsUSD.map(
      ({ month, income, expenses }) => ({
        month,
        income: Math.round(income * 100) / 100,
        expenses: Math.round(expenses * 100) / 100,
      }),
    );
    const incomeVsExpensesVES = monthBucketsVES.map(
      ({ month, income, expenses }) => ({
        month,
        income: Math.round(income * 100) / 100,
        expenses: Math.round(expenses * 100) / 100,
      }),
    );

    // --- Summary stats ---
    const totalWorkouts = workouts.length;
    const expenses = transactions.filter((t) => t.type !== "income");
    const incomes = transactions.filter((t) => t.type === "income");

    const expensesUSD = expenses.filter((t) => (t.currency || "USD") === "USD");
    const expensesVES = expenses.filter((t) => (t.currency || "USD") === "VES");
    const incomesUSD = incomes.filter((t) => (t.currency || "USD") === "USD");
    const incomesVES = incomes.filter((t) => (t.currency || "USD") === "VES");

    const totalSpentUSD =
      Math.round(
        expensesUSD.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) * 100,
      ) / 100;
    const totalSpentVES =
      Math.round(
        expensesVES.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) * 100,
      ) / 100;
    const totalIncomeUSD =
      Math.round(
        incomesUSD.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) * 100,
      ) / 100;
    const totalIncomeVES =
      Math.round(
        incomesVES.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) * 100,
      ) / 100;

    // --- Current Month Cashflow ---
    const currentMonthIdx = MONTHS - 1; // latest month
    const currentMonthIncomeUSD = monthBucketsUSD[currentMonthIdx].income;
    const currentMonthExpensesUSD = monthBucketsUSD[currentMonthIdx].expenses;
    const currentMonthNetUSD =
      Math.round((currentMonthIncomeUSD - currentMonthExpensesUSD) * 100) / 100;

    const currentMonthIncomeVES = monthBucketsVES[currentMonthIdx].income;
    const currentMonthExpensesVES = monthBucketsVES[currentMonthIdx].expenses;
    const currentMonthNetVES =
      Math.round((currentMonthIncomeVES - currentMonthExpensesVES) * 100) / 100;

    return {
      workoutFrequency,
      volumeProgression,
      categoryBreakdown,
      rpeTrend,
      totalWorkouts,

      // USD Metrics
      spendingTrendUSD,
      spendingByCategoryUSD,
      incomeVsExpensesUSD,
      incomeSplitUSD,
      totalSpentUSD,
      totalIncomeUSD,
      currentMonthIncomeUSD,
      currentMonthExpensesUSD,
      currentMonthNetUSD,

      // VES Metrics
      spendingTrendVES,
      spendingByCategoryVES,
      incomeVsExpensesVES,
      incomeSplitVES,
      totalSpentVES,
      totalIncomeVES,
      currentMonthIncomeVES,
      currentMonthExpensesVES,
      currentMonthNetVES,
    };
  }, [workouts, transactions]);
};
