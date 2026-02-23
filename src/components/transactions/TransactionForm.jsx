import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTransactions } from '../../hooks/useFirestore';
import { PAYMENT_METHODS, CATEGORY_GROUP_MAP, ACCOUNTS, getCurrencyForAccount } from '../../config/categories';
import { todayISO, dateInputToTimestamp } from '../../utils/dateHelpers';
import CategorySelect from './CategorySelect';
import './TransactionForm.css';

const INITIAL_STATE = {
    type: 'expense',
    description: '',
    amount: '',
    category: '',
    date: todayISO(),
    payment_method: '',
    account: '',
    notes: ''
};

const TransactionForm = () => {
    const [form, setForm] = useState(INITIAL_STATE);
    const [saving, setSaving] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addItem, updateItem } = useTransactions();

    const editId = searchParams.get('edit');

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const isIncome = form.type === 'income';
            const txData = {
                type: form.type,
                description: form.description,
                amount: Number(form.amount),
                category: form.category,
                category_group: isIncome ? 'Income' : (CATEGORY_GROUP_MAP[form.category] || ''),
                date: dateInputToTimestamp(form.date),
                payment_method: isIncome ? null : (form.payment_method || null),
                account: form.account,
                currency: getCurrencyForAccount(form.account),
                notes: form.notes
            };

            if (editId) {
                await updateItem(editId, txData);
            } else {
                await addItem(txData);
            }

            navigate('/expenses');
        } catch (err) {
            console.error('Failed to save transaction:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page-container">
            <h2 className="form-title">
                {editId ? 'Edit' : 'Log'} {form.type === 'income' ? 'Income' : 'Expense'}
            </h2>

            <form onSubmit={handleSubmit} className="transaction-form">
                {/* Type toggle */}
                <div className="type-toggle">
                    <button
                        type="button"
                        className={`type-btn${form.type === 'expense' ? ' active expense' : ''}`}
                        onClick={() => setForm((p) => ({ ...p, type: 'expense', category: '' }))}
                    >
                        Expense
                    </button>
                    <button
                        type="button"
                        className={`type-btn${form.type === 'income' ? ' active income' : ''}`}
                        onClick={() => setForm((p) => ({ ...p, type: 'income', category: '' }))}
                    >
                        Income
                    </button>
                </div>

                {/* Description */}
                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <input
                        id="description"
                        name="description"
                        type="text"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="e.g. Protein powder"
                        required
                    />
                </div>

                {/* Account Selection */}
                <div className="form-group">
                    <label htmlFor="account">Account</label>
                    <select
                        id="account"
                        name="account"
                        value={form.account}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select account...</option>
                        {ACCOUNTS.map((acc) => (
                            <option key={acc} value={acc}>{acc}</option>
                        ))}
                    </select>
                </div>

                {/* Amount + Date row */}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="amount">Amount ($)</label>
                        <input
                            id="amount"
                            name="amount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.amount}
                            onChange={handleChange}
                            placeholder="0.00"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="date">Date</label>
                        <input
                            id="date"
                            name="date"
                            type="date"
                            value={form.date}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                {/* Category */}
                <div className="form-group">
                    <label htmlFor="category">
                        {form.type === 'income' ? 'Income Source' : 'Category'}
                    </label>
                    <CategorySelect
                        value={form.category}
                        onChange={handleChange}
                        incomeMode={form.type === 'income'}
                    />
                </div>

                {/* Category group badge — expenses only */}
                {form.type === 'expense' && form.category && CATEGORY_GROUP_MAP[form.category] && (
                    <div className="category-group-badge">
                        {CATEGORY_GROUP_MAP[form.category]}
                    </div>
                )}

                {/* Payment Method — expenses only */}
                {form.type === 'expense' && (
                    <div className="form-group">
                        <label htmlFor="payment_method">Payment Method</label>
                        <select
                            id="payment_method"
                            name="payment_method"
                            value={form.payment_method}
                            onChange={handleChange}
                        >
                            <option value="">Select method...</option>
                            {PAYMENT_METHODS.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Notes */}
                <div className="form-group">
                    <label htmlFor="notes">Notes</label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Any additional notes..."
                    />
                </div>

                {/* Submit */}
                <button type="submit" className="btn btn-primary btn-submit" disabled={saving}>
                    {saving ? 'Saving...' : editId
                        ? `Update ${form.type === 'income' ? 'Income' : 'Expense'}`
                        : `Log ${form.type === 'income' ? 'Income' : 'Expense'}`}
                </button>
            </form>
        </div>
    );
};

export default TransactionForm;
