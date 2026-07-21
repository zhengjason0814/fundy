const NON_SPEND_CATEGORIES = ['Credit Card Payment']

function isSpend(expense) {
  return expense.type === 'expense' && !NON_SPEND_CATEGORIES.includes(expense.category)
}

module.exports = { isSpend, NON_SPEND_CATEGORIES }
