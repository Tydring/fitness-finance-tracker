/**
 * Expense and income categories for transaction logging.
 */

export const INCOME_CATEGORIES = [
    'School Salary', 'La Consulta Psicologica Salary', 'Private Practice Salary', 'Classes', 'Freelance', 'Investment', 'Gift', 'Refund', 'Other Income'
];

export const ACCOUNTS = ['Facebank', 'Bolivares', 'Cash'];

export const ACCOUNT_CURRENCY_MAP = {
    'Facebank': 'USD',
    'Cash': 'USD',
    'Bolivares': 'VES'
};

export const getCurrencyForAccount = (account) => ACCOUNT_CURRENCY_MAP[account] || 'USD';

export const EXPENSE_CATEGORIES = [
    { group: 'Health & Fitness', items: ['Gym Membership', 'Supplements', 'Sportswear', 'Personal Training'] },
    { group: 'Food & Drink', items: ['Groceries', 'Eating Out', 'Coffee', 'Meal Prep'] },
    { group: 'Transport', items: ['Fuel', 'Public Transit', 'Ride Share', 'Parking'] },
    { group: 'Health', items: ['Healthcare', 'Pharmacy', 'Insurance'] },
    { group: 'Living', items: ['Rent', 'Utilities', 'Subscriptions', 'Phone'] },
    { group: 'Lifestyle', items: ['Entertainment', 'Shopping', 'Travel', 'Education'] },
    { group: 'Other', items: ['Other'] }
];

export const PAYMENT_METHODS = ['Cash', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Mobile Pay'];

export const ALL_CATEGORIES = EXPENSE_CATEGORIES.flatMap((g) => g.items);

/**
 * Map category to its group for display purposes.
 */
export const CATEGORY_GROUP_MAP = Object.fromEntries(
    EXPENSE_CATEGORIES.flatMap((g) => g.items.map((item) => [item, g.group]))
);

/**
 * Check if a category belongs to Health & Fitness group.
 */
export const isFitnessCategory = (category) =>
    CATEGORY_GROUP_MAP[category] === 'Health & Fitness';
