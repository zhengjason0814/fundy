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
