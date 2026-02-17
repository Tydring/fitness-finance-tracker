import { useExchangeRates } from '../../hooks/useExchangeRates';
import { DollarSign, Euro, ArrowLeftRight, AlertTriangle } from 'lucide-react';
import './ExchangeRateWidget.css';

function formatRate(value) {
    if (value === null || value === undefined) return '—';
    return Number(value).toFixed(2);
}

function formatTimestamp(ts) {
    if (!ts) return null;
    // Firestore Timestamp has toDate(), plain Date or seconds-based object
    const date = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
    return date.toLocaleString('es-VE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const ExchangeRateWidget = () => {
    const { rates, loading, error } = useExchangeRates();

    if (loading) {
        return (
            <div className="exchange-widget glass-card">
                <div className="exchange-loading">Loading exchange rates...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="exchange-widget glass-card exchange-error-state">
                <AlertTriangle size={18} />
                <span>Could not load exchange rates</span>
            </div>
        );
    }

    if (!rates) {
        return (
            <div className="exchange-widget glass-card exchange-empty-state">
                <span>No exchange rate data yet</span>
            </div>
        );
    }

    const bcvFailed = rates.bcv?.status === 'rejected';
    const binanceFailed = rates.binance?.status === 'rejected';

    return (
        <div className="exchange-widget glass-card">
            <div className="exchange-header">
                <span className="exchange-title">VES Exchange Rates</span>
                {rates.fetched_at && (
                    <span className="exchange-timestamp">
                        {formatTimestamp(rates.fetched_at)}
                    </span>
                )}
            </div>

            <div className="exchange-grid">
                <div className={`exchange-item ${bcvFailed ? 'exchange-warn' : ''}`}>
                    <div className="exchange-icon icon-usd">
                        <DollarSign size={18} />
                    </div>
                    <div className="exchange-data">
                        <span className="exchange-value">{formatRate(rates.bcv_usd)}</span>
                        <span className="exchange-label">BCV USD</span>
                    </div>
                    {bcvFailed && <AlertTriangle size={14} className="exchange-warn-icon" />}
                </div>

                <div className={`exchange-item ${bcvFailed ? 'exchange-warn' : ''}`}>
                    <div className="exchange-icon icon-eur">
                        <Euro size={18} />
                    </div>
                    <div className="exchange-data">
                        <span className="exchange-value">{formatRate(rates.bcv_eur)}</span>
                        <span className="exchange-label">BCV EUR</span>
                    </div>
                    {bcvFailed && <AlertTriangle size={14} className="exchange-warn-icon" />}
                </div>

                <div className={`exchange-item ${binanceFailed ? 'exchange-warn' : ''}`}>
                    <div className="exchange-icon icon-usdt">
                        <ArrowLeftRight size={18} />
                    </div>
                    <div className="exchange-data">
                        <span className="exchange-value">{formatRate(rates.binance_usdt)}</span>
                        <span className="exchange-label">Binance USDT</span>
                    </div>
                    {binanceFailed && <AlertTriangle size={14} className="exchange-warn-icon" />}
                </div>
            </div>

            {(bcvFailed || binanceFailed) && (
                <div className="exchange-warning">
                    <AlertTriangle size={12} />
                    <span>
                        {bcvFailed && binanceFailed
                            ? 'BCV & Binance sources unavailable'
                            : bcvFailed
                              ? 'BCV source unavailable'
                              : 'Binance source unavailable'}
                    </span>
                </div>
            )}
        </div>
    );
};

export default ExchangeRateWidget;
