import { useState } from 'react';
import { useExchangeRates } from '../../hooks/useExchangeRates';
import { ArrowLeftRight, AlertTriangle } from 'lucide-react';
import './CalculatorPage.css';

const CalculatorPage = () => {
    const { rates, loading, error } = useExchangeRates();
    const [amount, setAmount] = useState('');
    const [baseCurrency, setBaseCurrency] = useState('VES');

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] text-slate-400">
                <div className="animate-pulse">Loading rates...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-red-400 p-4 text-center">
                <AlertTriangle size={32} className="mb-2" />
                <p>Failed to load exchange rates.</p>
                <p className="text-sm opacity-70">{error}</p>
            </div>
        );
    }

    const numAmount = Number(amount) || 0;
    const bcvUsd = rates?.bcv_usd;
    const bcvEur = rates?.bcv_eur;
    const binanceUsdt = rates?.binance_usdt;

    return (
        <div className="calculator-page animate-pop-in">
            <header className="page-header">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center gap-2">
                    <ArrowLeftRight size={24} className="text-indigo-400" />
                    Quick Calculator
                </h1>
                <p className="text-slate-400 mt-1">Convert instantly between currencies</p>
            </header>

            <div className="page-content">
                <div className="calc-card glass-card">
                    <div className="calc-input-section">
                        <label className="input-label">Amount</label>
                        <div className="calc-input-wrapper">
                            <input
                                type="number"
                                className="calc-main-input"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                autoFocus
                            />
                            <select
                                className="calc-currency-select"
                                value={baseCurrency}
                                onChange={(e) => setBaseCurrency(e.target.value)}
                            >
                                <option value="VES">VES (Bs.)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {numAmount > 0 && (
                    <div className="calc-results-section fade-in">
                        <h3 className="results-title">Conversion Results</h3>
                        <div className="results-grid">
                            {baseCurrency === 'VES' && (
                                <>
                                    {bcvUsd && (
                                        <div className="result-card glass-card">
                                            <span className="result-label">BCV USD</span>
                                            <span className="result-value">${(numAmount / bcvUsd).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {bcvEur && (
                                        <div className="result-card glass-card">
                                            <span className="result-label">BCV EUR</span>
                                            <span className="result-value">€{(numAmount / bcvEur).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {binanceUsdt && (
                                        <div className="result-card glass-card">
                                            <span className="result-label">Binance USDT</span>
                                            <span className="result-value">${(numAmount / binanceUsdt).toFixed(2)}</span>
                                        </div>
                                    )}
                                </>
                            )}

                            {baseCurrency === 'USD' && (
                                <>
                                    {bcvUsd && (
                                        <div className="result-card glass-card">
                                            <span className="result-label">BCV VES</span>
                                            <span className="result-value">Bs. {(numAmount * bcvUsd).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {binanceUsdt && (
                                        <div className="result-card glass-card">
                                            <span className="result-label">Binance VES</span>
                                            <span className="result-value">Bs. {(numAmount * binanceUsdt).toFixed(2)}</span>
                                        </div>
                                    )}
                                </>
                            )}

                            {baseCurrency === 'EUR' && (
                                <>
                                    {bcvEur && (
                                        <div className="result-card glass-card">
                                            <span className="result-label">BCV VES</span>
                                            <span className="result-value">Bs. {(numAmount * bcvEur).toFixed(2)}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalculatorPage;
