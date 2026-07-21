export const CATEGORIES = [
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

const NONE_LIKE_NOTES = new Set([
  'none',
  'n/a',
  'na',
  'no note',
  'nothing',
  'nil',
  'null',
  'idk',
  'unknown',
])

export function isNoneLikeNote(note) {
  const normalized = note.trim().toLowerCase()
  if (!normalized) return false
  if (NONE_LIKE_NOTES.has(normalized)) return true
  return normalized.replace(/[^a-z0-9]/g, '').length === 0
}

const NON_SPEND_CATEGORIES = new Set(['Credit Card Payment'])

export function isSpend(expense) {
  return expense.type === 'expense' && !NON_SPEND_CATEGORIES.has(expense.category)
}
