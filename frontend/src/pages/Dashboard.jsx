import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { clearToken } from '../auth'
import { CURRENCIES } from '../currencies'
import AddExpenseForm from '../components/AddExpenseForm'
import ExpenseList from '../components/ExpenseList'
import AccountsPanel from '../components/AccountsPanel'
import PredictionCard from '../components/PredictionCard'
import AnomalyStrip from '../components/AnomalyStrip'

function Dashboard() {
  const [expenses, setExpenses] = useState([])
  const [accounts, setAccounts] = useState([])
  const [prediction, setPrediction] = useState(null)
  const [anomalies, setAnomalies] = useState([])
  const [baseCurrency, setBaseCurrency] = useState('USD')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const navigate = useNavigate()

  const loadData = useCallback(async () => {
    try {
      const [meResponse, expensesResponse, accountsResponse, predictionResponse, anomaliesResponse] =
        await Promise.all([
          client.get('/auth/me'),
          client.get('/expenses'),
          client.get('/accounts'),
          client.get('/insights/prediction').catch(() => null),
          client.get('/insights/anomalies').catch(() => null),
        ])
      setBaseCurrency(meResponse.data.user.baseCurrency)
      setExpenses(expensesResponse.data.expenses)
      setAccounts(accountsResponse.data.accounts)
      setPrediction(predictionResponse?.data ?? { status: 'unavailable' })
      setAnomalies(anomaliesResponse?.data?.anomalies ?? [])
    } catch (err) {
      if (err.response?.status === 401) {
        clearToken()
        navigate('/login')
      } else {
        setError('Could not load your data')
      }
    }
  }, [navigate])

  useEffect(() => {
    loadData().finally(() => setLoading(false))
  }, [loadData])

  function handleExpenseAdded(expense) {
    setExpenses((current) =>
      [expense, ...current].sort((a, b) => new Date(b.date) - new Date(a.date))
    )
  }

  async function handleExpenseDeleted(id) {
    await client.delete(`/expenses/${id}`)
    setExpenses((current) => current.filter((expense) => expense._id !== id))
  }

  async function handleDismissAnomaly(id) {
    await client.post(`/expenses/${id}/dismiss-anomaly`)
    setAnomalies((current) => current.filter((anomaly) => anomaly.id !== id))
  }

  async function handleSync() {
    setSyncing(true)
    try {
      await client.post('/plaid/sync')
      await loadData()
    } finally {
      setSyncing(false)
    }
  }

  async function handleBaseCurrencyChange(event) {
    const next = event.target.value
    setBaseCurrency(next)
    await client.patch('/auth/me', { baseCurrency: next })
    await loadData()
  }

  function handleLogout() {
    clearToken()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-700">Fundy</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-500">
            Home currency
            <select
              value={baseCurrency}
              onChange={handleBaseCurrencyChange}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Log out
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {loading ? (
          <p className="text-slate-500 text-center">Loading…</p>
        ) : error ? (
          <p className="text-red-600 text-center">{error}</p>
        ) : (
          <>
            <AccountsPanel
              accounts={accounts}
              onConnected={loadData}
              onSync={handleSync}
              syncing={syncing}
            />
            <AnomalyStrip
              anomalies={anomalies}
              baseCurrency={baseCurrency}
              onDismiss={handleDismissAnomaly}
            />
            <PredictionCard prediction={prediction} baseCurrency={baseCurrency} />
            <AddExpenseForm onAdded={handleExpenseAdded} baseCurrency={baseCurrency} />
            <ExpenseList
              expenses={expenses}
              baseCurrency={baseCurrency}
              onDelete={handleExpenseDeleted}
              anomalyIds={new Set(anomalies.map((anomaly) => anomaly.id))}
            />
          </>
        )}
      </main>
    </div>
  )
}

export default Dashboard
