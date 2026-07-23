const CATEGORIES = [
  'Groceries',
  'Dining',
  'Entertainment',
  'Housing/Utilities',
  'Transportation',
  'Shopping/Retail',
  'Health/Personal Care',
  'Travel',
  'General Services',
  'Financial/Legal',
  'Withdrawal',
  'Deposit',
  'Income',
  'Transfer',
  'Credit Card Payment',
  'Other',
]

const NON_BUDGETABLE_CATEGORIES = ['Income', 'Deposit', 'Withdrawal', 'Transfer', 'Credit Card Payment']

const BUDGETABLE_CATEGORIES = CATEGORIES.filter(
  (category) => !NON_BUDGETABLE_CATEGORIES.includes(category)
)

module.exports = { CATEGORIES, BUDGETABLE_CATEGORIES }
