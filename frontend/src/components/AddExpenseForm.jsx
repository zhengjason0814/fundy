import { useState } from 'react'
import client from '../api/client'
import { CURRENCIES } from '../currencies'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function AddExpenseForm({ onAdded, baseCurrency }) {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState(baseCurrency)
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
        note: note || undefined,
      })
      onAdded(response.data.expense)
      setAmount('')
      setCurrency(baseCurrency)
      setCategory('')
      setDate(todayISO())
      setNote('')
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
      <h2 className="text-lg font-medium text-ink mb-4">Add expense</h2>
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
          <input
            type="text"
            required
            placeholder="Groceries"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClasses}
          />
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
          <span className="text-sm text-slate-600">Note (optional)</span>
          <input
            type="text"
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
        {submitting ? 'Adding…' : 'Add expense'}
      </button>
    </form>
  )
}

export default AddExpenseForm
