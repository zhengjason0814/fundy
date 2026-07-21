import { useEffect, useState } from 'react'
import client from '../api/client'
import { CURRENCIES } from '../currencies'
import { CATEGORIES, isNoneLikeNote } from '../categories'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function AddExpenseForm({ onAdded, baseCurrency }) {
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState(baseCurrency)
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [suggestion, setSuggestion] = useState(null)

  useEffect(() => {
    if (!note.trim() || category) {
      setSuggestion(null)
      return
    }
    if (isNoneLikeNote(note)) {
      setSuggestion({ category: 'Other' })
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const response = await client.get('/insights/suggest-category', {
          params: { text: note },
        })
        if (!cancelled) {
          setSuggestion(response.data.status === 'ok' ? response.data : null)
        }
      } catch {
        if (!cancelled) {
          setSuggestion(null)
        }
      }
    }, 500)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [note, category])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const response = await client.post('/expenses', {
        amount: Number(amount),
        currency,
        category,
        date,
        note,
        type,
      })
      onAdded(response.data.expense)
      setType('expense')
      setAmount('')
      setCurrency(baseCurrency)
      setCategory('')
      setDate(todayISO())
      setNote('')
      setSuggestion(null)
    } catch (err) {
      setError(err.response?.data?.error ?? 'Could not add expense')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClasses =
    'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
    >
      <h2 className="text-lg font-medium text-ink mb-4">Add transaction</h2>
      <div className="mb-4 inline-flex rounded-md border border-slate-300 overflow-hidden">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`px-4 py-2 text-sm font-medium ${
            type === 'expense' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600'
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={`px-4 py-2 text-sm font-medium ${
            type === 'income' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600'
          }`}
        >
          Income
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <label className="block">
          <span className="text-sm text-slate-600">Amount</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClasses}
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Currency</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={inputClasses}
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Category</span>
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClasses}
          >
            <option value="" disabled>
              Select a category
            </option>
            {CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {suggestion && !category && (
            <button
              type="button"
              onClick={() => {
                setCategory(suggestion.category)
                setSuggestion(null)
              }}
              className="mt-1 inline-block rounded-full bg-brand-50 text-brand-700 px-2.5 py-0.5 text-xs font-medium hover:bg-brand-100"
            >
              Suggested: {suggestion.category}
            </button>
          )}
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Date</span>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClasses}
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Note</span>
          <input
            type="text"
            required
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClasses}
          />
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? 'Adding…' : type === 'income' ? 'Add income' : 'Add expense'}
      </button>
    </form>
  )
}

export default AddExpenseForm
