import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../../hooks/useFirestore';
import { formatDate } from '../../utils/dateHelpers';
import { isFitnessCategory } from '../../config/categories';
import { Plus, Edit2, Trash2, Wallet, CreditCard, Banknote } from 'lucide-react';
import SyncStatusButton from '../sync/SyncStatusButton';
import './TransactionList.css';

const TransactionList = () => {
    const { data: transactions, loading, deleteItem } = useTransactions();
    const navigate = useNavigate();

    const handleDelete = async (id, description) => {
        if (window.confirm(`Delete "${description}"?`)) {
            await deleteItem(id);
        }
    };

    const getSyncBadge = (tx) => {
        if (tx._hasPendingWrites) return 'pending';
        if (tx.sync_status === 'conflict') return 'conflict';
        if (tx.sync_status === 'synced') return 'synced';
        return 'pending';
    };

    const getPaymentIcon = (method) => {
        if (!method) return null;
        if (method === 'Cash') return Banknote;
        if (method.includes('Card')) return CreditCard;
        return Wallet;
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Expenses</h2>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <SyncStatusButton />
                    <button
                        className="btn btn-primary btn-add"
                        onClick={() => navigate('/expenses/new')}
                    >
                        <Plus size={20} />
                        <span>Log</span>
                    </button>
                </div>
            </div>

            {loading && <div className="loading-text">Loading expenses...</div>}

            {!loading && transactions.length === 0 && (
                <div className="empty-state">
                    <Wallet size={48} className="empty-icon" />
                    <p>No expenses logged yet.</p>
                    <p className="empty-hint">Tap "Log" to track your first expense!</p>
                </div>
            )}

            <div className="transaction-cards">
                {transactions.map((tx) => {
                    const PayIcon = getPaymentIcon(tx.payment_method);
                    const fitness = isFitnessCategory(tx.category);

                    return (
                        <div key={tx.id} className="transaction-card glass-card">
                            <div className="card-header">
                                <div className="card-title-row">
                                    <span className="card-description">{tx.description}</span>
                                    <span className={`sync-dot sync-${getSyncBadge(tx)}`} />
                                </div>
                                <span className="card-date">{formatDate(tx.date)}</span>
                            </div>

                            <div className={`card-amount ${tx.type === 'income' ? 'card-amount-income' : ''}`}>
                                {tx.type === 'income' ? '+' : ''}${Number(tx.amount).toFixed(2)}
                            </div>

                            <div className="card-stats">
                                <div className={`tx-category ${tx.type === 'income' ? 'tx-income' : fitness ? 'tx-fitness' : ''}`}>
                                    {tx.category || (tx.type === 'income' ? 'Income' : '')}
                                </div>
                                {PayIcon && (
                                    <div className="stat">
                                        <PayIcon size={14} />
                                        <span>{tx.payment_method}</span>
                                    </div>
                                )}
                            </div>

                            {tx.notes && <p className="card-notes">{tx.notes}</p>}

                            <div className="card-actions">
                                <button
                                    className="btn-icon"
                                    onClick={() => navigate(`/expenses/new?edit=${tx.id}`)}
                                    title="Edit"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    className="btn-icon btn-danger"
                                    onClick={() => handleDelete(tx.id, tx.description)}
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TransactionList;
