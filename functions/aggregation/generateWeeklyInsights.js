import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { requireAuthToken } from '../shared/authMiddleware.js';

const anthropicKey = defineSecret('CLAUDE_API_KEY');
const SUMMARIES_COLLECTION = 'weekly_summaries';
const INSIGHTS_COLLECTION = 'weekly_insights';
const MODEL = 'claude-haiku-4-5-20251001';

/**
 * Call Anthropic Messages API via native fetch.
 */
async function callClaude(apiKey, prompt) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: MODEL,
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }],
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Anthropic API ${res.status}: ${text.slice(0, 300)}`);
    }

    const data = await res.json();
    return data.content[0].text;
}

/**
 * Build the prompt from a weekly summary document.
 */
function buildPrompt(summary, weekKey) {
    const { workouts, transactions } = summary;

    const fitnessSection = workouts.count === 0
        ? 'No workouts logged this week.'
        : [
            `Total workouts: ${workouts.count}`,
            `Volume total: ${workouts.volume_total.toLocaleString()} kg`,
            `RPE — avg: ${workouts.rpe_avg?.toFixed(1) ?? 'N/A'}, min: ${workouts.rpe_min ?? 'N/A'}, max: ${workouts.rpe_max ?? 'N/A'}`,
            `By category: ${JSON.stringify(workouts.by_category)}`,
            `By exercise: ${JSON.stringify(workouts.by_exercise)}`,
        ].join('\n');

    const financeSection = (transactions.income_total === 0 && transactions.expense_total === 0)
        ? 'No transactions logged this week.'
        : [
            `Income: $${transactions.income_total.toFixed(2)}`,
            `Expenses: $${transactions.expense_total.toFixed(2)}`,
            `Net: $${transactions.net.toFixed(2)}`,
            `Spending by category: ${JSON.stringify(transactions.by_category)}`,
            `Payment methods: ${JSON.stringify(transactions.by_payment_method)}`,
        ].join('\n');

    return `You are a personal health and finance coach. Analyze this weekly data for ${weekKey} and provide brief, actionable insights.

FITNESS DATA:
${fitnessSection}

FINANCE DATA:
${financeSection}

Respond ONLY with a valid JSON object in this exact format (no markdown, no extra text):
{
  "fitness": {
    "summary": "2-3 sentence summary of workout performance this week",
    "highlights": ["key observation 1", "key observation 2"],
    "suggestion": "one specific, actionable improvement for next week"
  },
  "finance": {
    "summary": "2-3 sentence summary of financial activity this week",
    "highlights": ["key observation 1", "key observation 2"],
    "suggestion": "one specific, actionable financial tip for next week"
  },
  "combined": "1 sentence connecting fitness and finance themes if relevant, otherwise null"
}`;
}

/**
 * Core logic — extracted for clarity.
 */
async function runInsightGeneration(apiKey) {
    const db = getFirestore();

    // Read the latest weekly summary
    const latestSnap = await db.collection(SUMMARIES_COLLECTION).doc('latest').get();
    if (!latestSnap.exists) {
        console.log('No weekly summary found, skipping insights generation.');
        return null;
    }

    const summary = latestSnap.data();
    const weekKey = summary.week_key ?? summary.source_week_key;

    if (!weekKey) {
        throw new Error('Weekly summary is missing week_key field.');
    }

    // Idempotency: skip if already generated
    const existingSnap = await db.collection(INSIGHTS_COLLECTION).doc(weekKey).get();
    if (existingSnap.exists) {
        console.log(`Insights already exist for ${weekKey}, skipping.`);
        return { weekKey, skipped: true };
    }

    // Call Claude
    const prompt = buildPrompt(summary, weekKey);
    const rawText = await callClaude(apiKey, prompt);

    // Parse — strip any accidental markdown fences
    let parsed;
    try {
        const cleaned = rawText.replace(/^```(?:json)?\n?|\n?```$/g, '').trim();
        parsed = JSON.parse(cleaned);
    } catch {
        throw new Error(`Claude returned non-JSON: ${rawText.slice(0, 400)}`);
    }

    const insightDoc = {
        week_key: weekKey,
        source_week_key: weekKey,
        generated_at: FieldValue.serverTimestamp(),
        model: MODEL,
        fitness: parsed.fitness ?? null,
        finance: parsed.finance ?? null,
        combined: parsed.combined ?? null,
    };

    // Atomic write: dated doc + latest pointer
    const batch = db.batch();
    batch.set(db.collection(INSIGHTS_COLLECTION).doc(weekKey), insightDoc);
    batch.set(db.collection(INSIGHTS_COLLECTION).doc('latest'), insightDoc);
    await batch.commit();

    return { weekKey, skipped: false };
}

/**
 * Scheduled Cloud Function — runs every Monday at 06:30 UTC.
 * Fires 30 min after aggregateWeeklyData (06:00 UTC) to ensure data is ready.
 */
export const generateWeeklyInsights = onSchedule(
    { schedule: '30 6 * * 1', timeZone: 'UTC', retryCount: 3, secrets: [anthropicKey] },
    async () => {
        const apiKey = anthropicKey.value();
        const result = await runInsightGeneration(apiKey);

        if (!result) {
            console.log('No summary available — insights skipped.');
        } else if (result.skipped) {
            console.log(`Insights already generated for ${result.weekKey}.`);
        } else {
            console.log(`Weekly insights generated for ${result.weekKey}.`);
        }
    }
);

/**
 * HTTP trigger for manual testing.
 * Pass ?force=true to bypass idempotency and regenerate existing insights.
 */
export const manualGenerateInsights = onRequest(
    { cors: true, secrets: [anthropicKey] },
    async (req, res) => {
        const decoded = await requireAuthToken(req, res);
        if (!decoded) return;
        try {
            const force = req.query.force === 'true';
            const apiKey = anthropicKey.value();

            // If force, delete the existing insight doc so runInsightGeneration re-generates
            if (force) {
                const db = getFirestore();
                const latestSnap = await db.collection('weekly_summaries').doc('latest').get();
                if (latestSnap.exists) {
                    const weekKey = latestSnap.data().week_key ?? latestSnap.data().source_week_key;
                    if (weekKey) {
                        await db.collection('weekly_insights').doc(weekKey).delete();
                    }
                }
            }

            const result = await runInsightGeneration(apiKey);

            if (!result) {
                res.json({ ok: false, reason: 'No weekly_summaries/latest found' });
            } else {
                res.json({ ok: true, ...result });
            }
        } catch (err) {
            console.error('manualGenerateInsights error:', err);
            res.status(500).json({ ok: false, error: err.message });
        }
    }
);
