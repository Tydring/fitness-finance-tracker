import { load } from 'cheerio';

const BCV_URL = 'https://www.bcv.org.ve/';
const FETCH_TIMEOUT_MS = 15_000;

/**
 * Parse Venezuelan number format: "XX,XXXXXXXX" → JS float.
 * BCV uses comma as decimal separator and period as thousands separator.
 */
function parseVenezuelanNumber(raw) {
    if (!raw) return null;
    const cleaned = raw.trim().replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : null;
}

/**
 * Scrape BCV official exchange rates for USD/VES and EUR/VES.
 * Returns { usd, eur } or throws on failure.
 */
export async function fetchBcvRates() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        const res = await fetch(BCV_URL, { signal: controller.signal });
        if (!res.ok) {
            throw new Error(`BCV returned HTTP ${res.status}`);
        }

        const html = await res.text();
        const $ = load(html);

        const rawUsd = $('#dolar strong').first().text();
        const rawEur = $('#euro strong').first().text();

        const usd = parseVenezuelanNumber(rawUsd);
        const eur = parseVenezuelanNumber(rawEur);

        if (usd === null && eur === null) {
            throw new Error(
                `BCV parsing failed — could not extract any rates. ` +
                `Raw USD: "${rawUsd}", Raw EUR: "${rawEur}"`
            );
        }

        return { usd, eur };
    } finally {
        clearTimeout(timeout);
    }
}
