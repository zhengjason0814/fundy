import ConnectBank from './ConnectBank'
import { formatMoney } from '../currencies'

function AccountsPanel({ accounts, onConnected, onSync, syncing }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-medium text-ink">Accounts</h2>
        <div className="flex items-center gap-2">
          {accounts.length > 0 && (
            <button
              type="button"
              onClick={onSync}
              disabled={syncing}
              className="rounded-lg border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-50 disabled:opacity-50"
            >
              {syncing ? 'Syncing…' : 'Sync'}
            </button>
          )}
          <ConnectBank onConnected={onConnected} />
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="px-6 py-8 text-center text-slate-500">
          No linked accounts yet. Connect a bank to import transactions automatically.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {accounts.map((account) => (
            <li key={account._id} className="px-6 py-3 flex items-center justify-between">
              <div>
                <span className="font-medium text-ink">{account.name}</span>
                {account.mask && (
                  <span className="text-slate-400 text-sm"> ••{account.mask}</span>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 capitalize">
                  {account.subtype || account.type}
                </div>
                {typeof account.balance === 'number' && (
                  <div className="text-sm text-ink">
                    {formatMoney(account.balance, account.currency)}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default AccountsPanel
