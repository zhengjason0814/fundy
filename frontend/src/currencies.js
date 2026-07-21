export const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'MXN']

export function formatMoney(amount, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount)
}

export function formatSignedMoney(amount, currency, type) {
  const signedAmount = type === 'income' ? amount : -amount
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    signDisplay: 'exceptZero',
  }).format(signedAmount)
}
