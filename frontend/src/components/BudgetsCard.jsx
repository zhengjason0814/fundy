import { useState, useRef } from 'react'
import { budgetStatuses } from '../budgets'
import { BUDGETABLE_CATEGORIES } from '../categories'
import { formatMoney } from '../currencies'

const LEVEL_COLORS = { ok: '#2a78d6', warn: '#fab219', over: '#d03b3b' }
const LEVEL_NOTES = { warn: '⚠ close to limit', over: '✖ over budget' }
const LEVEL_NOTE_COLORS = { warn: '#b45309', over: '#d03b3b' }

function ProgressBar({ ratio, level }) {
  return (
    <div className="h-2 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.min(ratio, 1) * 100}%`, backgroundColor: LEVEL_COLORS[level] }}
      />
    </div>
  )
}

function BudgetRow({ status, baseCurrency, onSet, onRemove }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(status.limit))
  const escapeCancelled = useRef(false)

  async function save() {
    if (escapeCancelled.current) {
      escapeCancelled.current = false
      return
    }
    const amount = Number(draft)
    setEditing(false)
    if (Number.isFinite(amount) && amount > 0 && amount !== status.limit) {
      try {
        await onSet(status.category, amount)
      } catch {
        setDraft(String(status.limit))
      }
    } else {
      setDraft(String(status.limit))
    }
  }

  return (
    <li className="space-y-1">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-ink font-medium">{status.category}</span>
        {LEVEL_NOTES[status.level] && (
          <span className="text-xs" style={{ color: LEVEL_NOTE_COLORS[status.level] }}>
            {LEVEL_NOTES[status.level]}
          </span>
        )}
        <span className="ml-auto text-slate-600">
          {formatMoney(status.spent, baseCurrency)} /{' '}
          {editing ? (
            <input
              type="number"
              min="1"
              value={draft}
              autoFocus
              onChange={(event) => setDraft(event.target.value)}
              onBlur={save}
              onKeyDown={(event) => { if (event.key === 'Enter') event.target.blur(); if (event.key === 'Escape') { escapeCancelled.current = true; setDraft(String(status.limit)); setEditing(false); } }}
              aria-label={`${status.category} monthly limit`}
              className="w-20 rounded border border-slate-300 px-1 py-0.5 text-sm"
            />
          ) : (
            <button
              type="button"
              onClick={() => { escapeCancelled.current = false; setDraft(String(status.limit)); setEditing(true); }}
              aria-label={`Edit ${status.category} budget limit`}
              className="underline decoration-dotted hover:text-ink"
            >
              {formatMoney(status.limit, baseCurrency)} <span aria-hidden="true">✎</span>
            </button>
          )}
        </span>
        <span className="w-10 text-right text-slate-400 text-xs">
          {Math.round(status.ratio * 100)}%
        </span>
        <button
          type="button"
          onClick={() => onRemove(status.category).catch(() => {})}
          aria-label={`Remove ${status.category} budget`}
          className="text-slate-400 hover:text-red-600"
        >
          ✕
        </button>
      </div>
      <ProgressBar ratio={status.ratio} level={status.level} />
    </li>
  )
}

function AddBudgetForm({ available, onSet, onDone }) {
  const [category, setCategory] = useState(available[0] || '')
  const [amount, setAmount] = useState('')

  async function submit(event) {
    event.preventDefault()
    const value = Number(amount)
    if (!category || !Number.isFinite(value) || value <= 0) return
    try {
      await onSet(category, value)
      onDone()
    } catch {}
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 text-sm">
      <select
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        aria-label="Budget category"
        className="rounded-md border border-slate-300 px-2 py-1"
      >
        {available.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <input
        type="number"
        min="1"
        placeholder="Monthly limit"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        aria-label="Monthly limit amount"
        className="w-32 rounded-md border border-slate-300 px-2 py-1"
      />
      <button
        type="submit"
        className="rounded-md bg-brand-600 px-3 py-1 text-white hover:bg-brand-700"
      >
        Save
      </button>
      <button type="button" onClick={onDone} className="text-slate-500 hover:text-slate-700">
        Cancel
      </button>
    </form>
  )
}

function BudgetsCard({ expenses, baseCurrency, budgets, onSet, onRemove }) {
  const [adding, setAdding] = useState(false)
  const statuses = budgetStatuses(expenses, budgets)
  const available = BUDGETABLE_CATEGORIES.filter((name) => !(budgets && name in budgets))

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-ink">Budgets</h2>
        {!adding && available.length > 0 && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-sm text-brand-600 hover:text-brand-700"
          >
            + Set budget
          </button>
        )}
      </div>
      {adding && (
        <div className="mb-4">
          <AddBudgetForm available={available} onSet={onSet} onDone={() => setAdding(false)} />
        </div>
      )}
      {statuses.length === 0 ? (
        !adding && (
          <p className="text-sm text-slate-500">
            Set a monthly budget per category to track your spending against it.
          </p>
        )
      ) : (
        <ul className="space-y-3">
          {statuses.map((status) => (
            <BudgetRow
              key={status.category}
              status={status}
              baseCurrency={baseCurrency}
              onSet={onSet}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

export default BudgetsCard
