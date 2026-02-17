import { EXPENSE_CATEGORIES } from '../../config/categories';

const CategorySelect = ({ value, onChange }) => {
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
