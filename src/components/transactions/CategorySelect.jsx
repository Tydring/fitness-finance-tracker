import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../config/categories';

const CategorySelect = ({ value, onChange, incomeMode = false }) => {
    if (incomeMode) {
        return (
            <select id="category" name="category" value={value} onChange={onChange} required>
                <option value="">Select source...</option>
                {INCOME_CATEGORIES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                ))}
            </select>
        );
    }

    return (
        <select id="category" name="category" value={value} onChange={onChange} required>
            <option value="">Select category...</option>
            {EXPENSE_CATEGORIES.map((group) => (
                <optgroup key={group.group} label={group.group}>
                    {group.items.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </optgroup>
            ))}
        </select>
    );
};

export default CategorySelect;
