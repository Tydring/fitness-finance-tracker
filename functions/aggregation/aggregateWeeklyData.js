import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { requireAuthToken } from '../shared/authMiddleware.js';

const COLLECTION = 'weekly_summaries';

/**
 * Returns the ISO week key (YYYY-Www) for a given Monday date.
 * Uses the standard ISO 8601 week number algorithm.
 */
function getIsoWeekKey(monday) {
    // ISO week: week containing first Thursday of the year
    const thursday = new Date(monday);
    thursday.setUTCDate(monday.getUTCDate() + 3); // Monday + 3 = Thursday
    const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil(((thursday - yearStart) / 86400000 + 1) / 7);
    const year = thursday.getUTCFullYear();
    return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Returns { prevWeekStart, prevWeekEnd, weekKey } for the week that just ended.
 * Called on Monday — so "previous week" is Mon–Sun of the prior week.
 */
function getPrevWeekRange(now) {
    // Start of today (Monday at 00:00 UTC)
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Previous Monday = 7 days back
    const prevWeekStart = new Date(todayStart);
    prevWeekStart.setUTCDate(todayStart.getUTCDate() - 7);

    // Previous Sunday 23:59:59.999 = 1ms before today
    const prevWeekEnd = new Date(todayStart.getTime() - 1);

    const weekKey = getIsoWeekKey(prevWeekStart);
    return { prevWeekStart, prevWeekEnd, weekKey };
}

/**
 * Aggregate workout documents into stats.
 */
function aggregateWorkouts(docs) {
    const stats = {
        count: docs.length,
        volume_total: 0,
        rpe_avg: null,
        rpe_min: null,
        rpe_max: null,
        by_category: {},
        by_exercise: {},
        details: [],
    };

    let rpeSum = 0;
    let rpeCount = 0;

    for (const doc of docs) {
        const data = doc.data();
        stats.details.push({ id: doc.id, ...data });

        // by_category
        if (data.category) {
            stats.by_category[data.category] = (stats.by_category[data.category] ?? 0) + 1;
        }

        // by_exercise
        if (data.exercise) {
            stats.by_exercise[data.exercise] = (stats.by_exercise[data.exercise] ?? 0) + 1;
        }

        // volume: sets * reps * weight_kg
        const sets = data.sets ?? null;
        const reps = data.reps ?? null;
        const weight = data.weight_kg ?? null;
        if (sets !== null && reps !== null && weight !== null) {
            stats.volume_total += sets * reps * weight;
        }

        // RPE
        const rpe = data.rpe ?? null;
        if (rpe !== null) {
            rpeSum += rpe;
            rpeCount++;
            if (stats.rpe_min === null || rpe < stats.rpe_min) stats.rpe_min = rpe;
            if (stats.rpe_max === null || rpe > stats.rpe_max) stats.rpe_max = rpe;
        }
    }

    if (rpeCount > 0) {
        stats.rpe_avg = rpeSum / rpeCount;
    }

    return stats;
}

/**
 * Aggregate transaction documents into stats.
 */
function aggregateTransactions(docs) {
    const stats = {
        income_total: 0,
        expense_total: 0,
        net: 0,
        by_category: {},
        by_payment_method: {},
        details: [],
    };

    for (const doc of docs) {
        const data = doc.data();
        stats.details.push({ id: doc.id, ...data });

        const amount = data.amount ?? 0;
        const type = data.type; // 'income' | 'expense'

        if (type === 'income') {
            stats.income_total += amount;
        } else if (type === 'expense') {
            stats.expense_total += amount;
        }

        // by_category (keyed by category, summed by amount)
        if (data.category) {
            stats.by_category[data.category] = (stats.by_category[data.category] ?? 0) + amount;
        }

        // by_payment_method (keyed by method, counted)
        if (data.payment_method) {
            stats.by_payment_method[data.payment_method] =
                (stats.by_payment_method[data.payment_method] ?? 0) + 1;
        }
    }

    stats.net = stats.income_total - stats.expense_total;
    return stats;
}

/**
 * Core aggregation logic — extracted for testability.
 */
async function runAggregation() {
    const now = new Date();
    const { prevWeekStart, prevWeekEnd, weekKey } = getPrevWeekRange(now);

    const db = getFirestore();
    const startTs = Timestamp.fromDate(prevWeekStart);
    const endTs = Timestamp.fromDate(prevWeekEnd);

    // Parallel Firestore queries
    const [workoutSnap, transactionSnap] = await Promise.all([
        db.collection('workouts')
            .where('date', '>=', startTs)
            .where('date', '<=', endTs)
            .get(),
        db.collection('transactions')
            .where('date', '>=', startTs)
            .where('date', '<=', endTs)
            .get(),
    ]);

    const workouts = aggregateWorkouts(workoutSnap.docs);
    const transactions = aggregateTransactions(transactionSnap.docs);

    const summaryDoc = {
        week_key: weekKey,
        week_start: startTs,
        week_end: endTs,
        generated_at: FieldValue.serverTimestamp(),
        workouts,
        transactions,
    };

    // Atomic batch write: dated doc + latest pointer
    const batch = db.batch();
    batch.set(db.collection(COLLECTION).doc(weekKey), summaryDoc);
    batch.set(db.collection(COLLECTION).doc('latest'), {
        ...summaryDoc,
        source_week_key: weekKey,
    });
    await batch.commit();

    return { weekKey, workoutCount: workoutSnap.size, transactionCount: transactionSnap.size };
}

/**
 * Scheduled Cloud Function — runs every Monday at 06:00 UTC.
 * Aggregates the previous Mon–Sun ISO week.
 */
export const aggregateWeeklyData = onSchedule(
    { schedule: '0 6 * * 1', timeZone: 'UTC', retryCount: 3 },
    async () => {
        const { weekKey, workoutCount, transactionCount } = await runAggregation();
        console.log(
            `Weekly aggregation complete for ${weekKey}: ` +
            `${workoutCount} workouts, ${transactionCount} transactions`
        );
    }
);

/**
 * HTTP trigger for manual testing.
 */
export const manualAggregateWeeklyData = onRequest(
    { cors: true },
    async (req, res) => {
        const decoded = await requireAuthToken(req, res);
        if (!decoded) return;
        try {
            const { weekKey, workoutCount, transactionCount } = await runAggregation();
            res.json({ ok: true, weekKey, workoutCount, transactionCount });
        } catch (err) {
            console.error('manualAggregateWeeklyData error:', err);
            res.status(500).json({ ok: false, error: err.message });
        }
    }
);
