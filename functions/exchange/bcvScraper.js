import { load } from 'cheerio';

const BCV_URL = 'https://www.bcv.org.ve/';
const SCRAPER_API_BASE = 'https://api.scraperapi.com';
const FETCH_TIMEOUT_MS = 30_000; // ScraperAPI can be slower than direct fetch

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
 * Build the fetch URL — routes through ScraperAPI with a Venezuelan IP
 * when an API key is provided, otherwise fetches directly.
 */
function buildFetchUrl(apiKey) {
    if (!apiKey) return BCV_URL;
    const params = new URLSearchParams({
        api_key: apiKey,
        url: BCV_URL,
        country_code: 've',
    });
    return `${SCRAPER_API_BASE}?${params}`;
}

/**
 * Scrape BCV official exchange rates for USD/VES and EUR/VES.
 * @param {string} [scraperApiKey] — ScraperAPI key for geo-proxied requests.
 * Returns { usd, eur } or throws on failure.
 */
export async function fetchBcvRates(scraperApiKey) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        const url = buildFetchUrl(scraperApiKey);
        const res = await fetch(url, { signal: controller.signal });
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
