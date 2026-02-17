const BINANCE_P2P_URL = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';
const FETCH_TIMEOUT_MS = 15_000;

/**
 * Calculate median of a sorted numeric array.
 */
function median(sorted) {
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Fetch Binance P2P USDT/VES buy ads and return the median price.
 * Queries 20 ads (1 page), sorted by price ascending.
 */
export async function fetchBinanceP2PRate() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        const body = {
            fiat: 'VES',
            page: 1,
            rows: 20,
            tradeType: 'BUY',
            asset: 'USDT',
            countries: [],
            proMerchantAds: false,
            shieldMerchantAds: false,
            publisherType: null,
            payTypes: [],
            classifies: ['mass', 'profession', 'fiat_trade'],
        };

        const res = await fetch(BINANCE_P2P_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        if (!res.ok) {
            throw new Error(`Binance P2P returned HTTP ${res.status}`);
        }

        const json = await res.json();
        const ads = json?.data;

        if (!Array.isArray(ads) || ads.length === 0) {
            throw new Error('Binance P2P returned no ads');
        }

        const prices = ads
            .map((ad) => parseFloat(ad.adv?.price))
            .filter((p) => Number.isFinite(p))
            .sort((a, b) => a - b);

        if (prices.length === 0) {
            throw new Error('Binance P2P: no valid prices found in ads');
        }

        return { usdt: median(prices) };
    } finally {
        clearTimeout(timeout);
    }
}
