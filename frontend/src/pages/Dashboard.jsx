import { useNavigate } from 'react-router-dom'
import { clearToken } from '../auth'

function Dashboard() {
  const navigate = useNavigate()

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
      <main className="max-w-4xl mx-auto px-6 py-8">
        <p className="text-slate-600">Dashboard coming next.</p>
      </main>
    </div>
  )
}

export default Dashboard
