import { useMemo } from 'react';
import { startOfWeek, subWeeks, subDays, format, differenceInCalendarWeeks } from 'date-fns';
import { toDate } from '../../utils/dateHelpers';

const WEEKS = 8;
const DAYS = 30;

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

        // --- Spending Trend (daily spend, last 30 days) ---
        const dayBuckets = {};
        for (let i = 0; i < DAYS; i++) {
            const day = format(subDays(now, DAYS - 1 - i), 'MMM d');
            dayBuckets[day] = 0;
        }

        const spendCategoryMap = {};

        transactions.forEach((t) => {
            const d = toDate(t.date);
            if (!d) return;
            const amount = Number(t.amount) || 0;

            // Daily spending
            if (d >= thirtyDaysAgo) {
                const key = format(d, 'MMM d');
                if (key in dayBuckets) {
                    dayBuckets[key] += amount;
                }
            }

            // Category group spending (all time)
            const group = t.category_group || 'Other';
            spendCategoryMap[group] = (spendCategoryMap[group] || 0) + amount;
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

        // --- Summary stats ---
        const totalWorkouts = workouts.length;
        const totalSpent = Math.round(
            transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) * 100
        ) / 100;

        return {
            workoutFrequency,
            categoryBreakdown,
            spendingTrend,
            spendingByCategory,
            rpeTrend,
            totalWorkouts,
            totalSpent
        };
    }, [workouts, transactions]);
};
