import { useMemo } from 'react';
import { startOfWeek, startOfMonth, subWeeks, subMonths, subDays, format, differenceInCalendarWeeks, differenceInCalendarMonths } from 'date-fns';
import { toDate } from '../../utils/dateHelpers';

const WEEKS = 8;
const DAYS = 30;
const MONTHS = 6;

export const useInsightsData = (workouts = [], transactions = []) => {
    return useMemo(() => {
        const now = new Date();
        const eightWeeksAgo = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), WEEKS - 1);
        const thirtyDaysAgo = subDays(now, DAYS - 1);

        // --- Workout Frequency (workouts per week, last 8 weeks) ---
        const weekBuckets = Array.from({ length: WEEKS }, (_, i) => {
            const weekStart = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), WEEKS - 1 - i);
            return { week: format(weekStart, 'MMM d'), count: 0 };
        });

        const categoryMap = {};
        let rpeWeekTotals = Array.from({ length: WEEKS }, () => ({ sum: 0, count: 0 }));
        let volumeWeekTotals = Array.from({ length: WEEKS }, () => 0);

        workouts.forEach((w) => {
            const d = toDate(w.date);
            if (!d) return;

            // Category breakdown (all time)
            const cat = w.category || 'Other';
            categoryMap[cat] = (categoryMap[cat] || 0) + 1;

            // Weekly stats
            if (d >= eightWeeksAgo) {
                const weekIdx = differenceInCalendarWeeks(d, eightWeeksAgo, { weekStartsOn: 1 });
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
            '#818cf8', '#c084fc', '#f472b6', '#fb923c', '#34d399', '#60a5fa', '#fbbf24'
        ];
        const categoryBreakdown = Object.entries(categoryMap).map(([name, value], i) => ({
            name,
            value,
            fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
        }));

        const rpeTrend = weekBuckets.map((bucket, i) => ({
            week: bucket.week,
            rpe: rpeWeekTotals[i].count > 0
                ? Math.round((rpeWeekTotals[i].sum / rpeWeekTotals[i].count) * 10) / 10
                : null
        }));

        const volumeProgression = weekBuckets.map((bucket, i) => ({
            week: bucket.week,
            volume: Math.round(volumeWeekTotals[i])
        }));

        // --- Spending Trend (daily spend, last 30 days) ---
        const dayBuckets = {};
        for (let i = 0; i < DAYS; i++) {
            const day = format(subDays(now, DAYS - 1 - i), 'MMM d');
            dayBuckets[day] = 0;
        }

        // --- Income vs Expenses (monthly, last 6 months) ---
        const monthStart = startOfMonth(subMonths(now, MONTHS - 1));
        const monthBuckets = Array.from({ length: MONTHS }, (_, i) => {
            const d = subMonths(startOfMonth(now), MONTHS - 1 - i);
            return { month: format(d, 'MMM'), income: 0, expenses: 0 };
        });

        const spendCategoryMap = {};

        transactions.forEach((t) => {
            const d = toDate(t.date);
            if (!d) return;
            const amount = Number(t.amount) || 0;
            const isIncome = t.type === 'income';

            // Daily spending (expenses only)
            if (!isIncome && d >= thirtyDaysAgo) {
                const key = format(d, 'MMM d');
                if (key in dayBuckets) {
                    dayBuckets[key] += amount;
                }
            }

            // Monthly income vs expenses
            if (d >= monthStart) {
                const mIdx = differenceInCalendarMonths(d, monthStart);
                if (mIdx >= 0 && mIdx < MONTHS) {
                    if (isIncome) monthBuckets[mIdx].income += amount;
                    else monthBuckets[mIdx].expenses += amount;
                }
            }

            // Category group spending (all time, expenses only)
            if (!isIncome) {
                const group = t.category_group || 'Other';
                spendCategoryMap[group] = (spendCategoryMap[group] || 0) + amount;
            }
        });

        const spendingTrend = Object.entries(dayBuckets).map(([day, amount]) => ({
            day,
            amount: Math.round(amount * 100) / 100
        }));

        const spendingByCategory = Object.entries(spendCategoryMap)
            .map(([name, amount]) => ({
                name,
                amount: Math.round(amount * 100) / 100
            }))
            .sort((a, b) => b.amount - a.amount);

        const incomeVsExpenses = monthBuckets.map(({ month, income, expenses }) => ({
            month,
            income: Math.round(income * 100) / 100,
            expenses: Math.round(expenses * 100) / 100,
        }));

        // --- Summary stats ---
        const totalWorkouts = workouts.length;
        const expenses = transactions.filter((t) => t.type !== 'income');
        const incomes = transactions.filter((t) => t.type === 'income');
        const totalSpent = Math.round(expenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) * 100) / 100;
        const totalIncome = Math.round(incomes.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) * 100) / 100;

        return {
            workoutFrequency,
            volumeProgression,
            categoryBreakdown,
            spendingTrend,
            spendingByCategory,
            incomeVsExpenses,
            rpeTrend,
            totalWorkouts,
            totalSpent,
            totalIncome
        };
    }, [workouts, transactions]);
};
