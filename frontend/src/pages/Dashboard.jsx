import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { clearToken } from '../auth'
import AddExpenseForm from '../components/AddExpenseForm'
import ExpenseList from '../components/ExpenseList'

function Dashboard() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    client
      .get('/expenses')
      .then((response) => setExpenses(response.data.expenses))
      .catch((err) => {
        if (err.response?.status === 401) {
          clearToken()
          navigate('/login')
        } else {
          setError('Could not load expenses')
        }
      })
      .finally(() => setLoading(false))
  }, [navigate])

  function handleExpenseAdded(expense) {
    setExpenses((current) =>
      [expense, ...current].sort((a, b) => new Date(b.date) - new Date(a.date))
    )
  }

  async function handleExpenseDeleted(id) {
    await client.delete(`/expenses/${id}`)
    setExpenses((current) => current.filter((expense) => expense._id !== id))
  }

  function handleLogout() {
    clearToken()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-700">Fundy</h1>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Log out
        </button>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <AddExpenseForm onAdded={handleExpenseAdded} />
        {loading ? (
          <p className="text-slate-500 text-center">Loading…</p>
        ) : error ? (
          <p className="text-red-600 text-center">{error}</p>
        ) : (
          <ExpenseList expenses={expenses} onDelete={handleExpenseDeleted} />
        )}
      </main>
    </div>
  )
}

export default Dashboard
