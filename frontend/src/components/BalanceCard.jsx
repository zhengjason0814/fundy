import { formatMoney } from '../currencies'

function BalanceCard({ accounts, baseCurrency }) {
  const depositoryAccounts = accounts.filter((account) => account.type === 'depository')
  const creditAccounts = accounts.filter((account) => account.type === 'credit')

  if (depositoryAccounts.length === 0 && creditAccounts.length === 0) {
    return null
  }

  const bankBalance = depositoryAccounts.reduce(
    (sum, account) =>
      typeof account.convertedBalance === 'number' ? sum + account.convertedBalance : sum,
    0
  )

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-wrap items-center gap-x-10 gap-y-4">
      <div>
        <p className="text-sm text-slate-500">Bank Balance</p>
        <p className="text-2xl font-semibold text-ink">{formatMoney(bankBalance, baseCurrency)}</p>
      </div>
      {creditAccounts.map((account) => (
        <div key={account._id}>
          <p className="text-sm text-slate-500">{account.name} owed</p>
          <p className="text-2xl font-semibold text-red-600">
            {typeof account.balance === 'number'
              ? formatMoney(account.balance, account.currency)
              : '—'}
          </p>
        </div>
      ))}
    </div>
  )
}

export default BalanceCard
