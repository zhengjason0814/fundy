const PRIMARY_CATEGORY_MAP = {
  INCOME: 'Income',
  LOAN_PAYMENTS: 'Financial/Legal',
  BANK_FEES: 'Financial/Legal',
  ENTERTAINMENT: 'Entertainment',
  GENERAL_MERCHANDISE: 'Shopping/Retail',
  HOME_IMPROVEMENT: 'Housing/Utilities',
  RENT_AND_UTILITIES: 'Housing/Utilities',
  MEDICAL: 'Health/Personal Care',
  PERSONAL_CARE: 'Health/Personal Care',
  GENERAL_SERVICES: 'General Services',
  TRANSPORTATION: 'Transportation',
  TRAVEL: 'Travel',
  GOVERNMENT_AND_NON_PROFIT: 'Other',
}

function mapPlaidCategory(personalFinanceCategory) {
  const primary = personalFinanceCategory?.primary
  const detailed = personalFinanceCategory?.detailed || ''

  if (!primary) return 'Other'

  if (primary === 'FOOD_AND_DRINK') {
    return detailed.includes('GROCERIES') ? 'Groceries' : 'Dining'
  }

  if (primary === 'TRANSFER_IN') {
    return detailed.includes('ACCOUNT_TRANSFER') ? 'Transfer' : 'Deposit'
  }

  if (primary === 'TRANSFER_OUT') {
    return detailed.includes('ACCOUNT_TRANSFER') ? 'Transfer' : 'Withdrawal'
  }

  return PRIMARY_CATEGORY_MAP[primary] || 'Other'
}

module.exports = { mapPlaidCategory }
