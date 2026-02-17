import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTransactions } from '../../hooks/useFirestore';
import { PAYMENT_METHODS, CATEGORY_GROUP_MAP } from '../../config/categories';
import { todayISO, dateInputToTimestamp } from '../../utils/dateHelpers';
import CategorySelect from './CategorySelect';
import './TransactionForm.css';

const INITIAL_STATE = {
    description: '',
    amount: '',
    category: '',
    date: todayISO(),
    payment_method: '',
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
            const txData = {
                description: form.description,
                amount: Number(form.amount),
                category: form.category,
                category_group: CATEGORY_GROUP_MAP[form.category] || '',
                date: dateInputToTimestamp(form.date),
                payment_method: form.payment_method || null,
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
            <h2 className="form-title">{editId ? 'Edit Expense' : 'Log Expense'}</h2>

            <form onSubmit={handleSubmit} className="transaction-form">
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
                    <label htmlFor="category">Category</label>
                    <CategorySelect value={form.category} onChange={handleChange} />
                </div>

                {/* Category group badge */}
                {form.category && CATEGORY_GROUP_MAP[form.category] && (
                    <div className="category-group-badge">
                        {CATEGORY_GROUP_MAP[form.category]}
                    </div>
                )}

                {/* Payment Method */}
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
                    {saving ? 'Saving...' : editId ? 'Update Expense' : 'Log Expense'}
                </button>
            </form>
        </div>
    );
};

export default TransactionForm;
