import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { fetchBcvRates } from './bcvScraper.js';
import { fetchBinanceP2PRate } from './binanceFetcher.js';
import { requireAuthToken } from '../shared/authMiddleware.js';

const COLLECTION = 'exchange_rates';
const scraperApiKey = defineSecret('SCRAPER_API_KEY');

/**
 * Build the Firestore document from fetched results.
 * Uses Promise.allSettled so one source failing doesn't block the other.
 */
async function buildRatesDocument() {
    const apiKey = scraperApiKey.value();
    const [bcvResult, binanceResult] = await Promise.allSettled([
        fetchBcvRates(apiKey),
        fetchBinanceP2PRate(),
    ]);

    const doc = {
        fetched_at: FieldValue.serverTimestamp(),
        bcv: {
            status: bcvResult.status,
            error: bcvResult.status === 'rejected' ? bcvResult.reason?.message : null,
        },
        binance: {
            status: binanceResult.status,
            error: binanceResult.status === 'rejected' ? binanceResult.reason?.message : null,
        },
        bcv_usd: null,
        bcv_eur: null,
        binance_usdt: null,
    };

    if (bcvResult.status === 'fulfilled') {
        doc.bcv_usd = bcvResult.value.usd;
        doc.bcv_eur = bcvResult.value.eur;
    }

    if (binanceResult.status === 'fulfilled') {
        doc.binance_usdt = binanceResult.value.usdt;
    }

    // If both sources failed, throw so Cloud Functions can retry
    if (bcvResult.status === 'rejected' && binanceResult.status === 'rejected') {
        throw new Error(
            `All exchange rate sources failed. ` +
            `BCV: ${bcvResult.reason?.message}; ` +
            `Binance: ${binanceResult.reason?.message}`
        );
    }

    return doc;
}

/**
 * Write rates to both the dated doc and the `latest` doc atomically.
 */
async function writeRates() {
    const ratesDoc = await buildRatesDocument();
    const db = getFirestore();

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const batch = db.batch();

    batch.set(db.collection(COLLECTION).doc(today), ratesDoc);
    batch.set(db.collection(COLLECTION).doc('latest'), ratesDoc);

    await batch.commit();
    return { today, ratesDoc };
}

/**
 * Scheduled function — runs daily at 12:30 UTC (08:30 VET).
 */
export const scheduledFetchRates = onSchedule(
    { schedule: '30 12 * * *', timeZone: 'UTC', retryCount: 3, secrets: [scraperApiKey] },
    async () => {
        const { today } = await writeRates();
        console.log(`Exchange rates fetched and stored for ${today}`);
    }
);

/**
 * HTTP function for manual testing.
 */
export const manualFetchRates = onRequest(
    { cors: true, secrets: [scraperApiKey] },
    async (req, res) => {
        const decoded = await requireAuthToken(req, res);
        if (!decoded) return;
        try {
            const { today, ratesDoc } = await writeRates();
            res.json({
                ok: true,
                date: today,
                bcv_usd: ratesDoc.bcv_usd,
                bcv_eur: ratesDoc.bcv_eur,
                binance_usdt: ratesDoc.binance_usdt,
                bcv_status: ratesDoc.bcv.status,
                binance_status: ratesDoc.binance.status,
            });
        } catch (err) {
            console.error('manualFetchRates error:', err);
            res.status(500).json({ ok: false, error: err.message });
        }
    }
);
