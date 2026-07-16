import { useEffect, useState } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import client from '../api/client'

function ConnectBank({ onConnected }) {
  const [linkToken, setLinkToken] = useState(null)
  const [busy, setBusy] = useState(false)

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken) => {
      setBusy(true)
      try {
        await client.post('/plaid/exchange', { public_token: publicToken })
        setLinkToken(null)
        onConnected()
      } finally {
        setBusy(false)
      }
    },
  })

  useEffect(() => {
    if (linkToken && ready) {
      open()
    }
  }, [linkToken, ready, open])

  async function handleClick() {
    setBusy(true)
    try {
      const response = await client.post('/plaid/link-token')
      setLinkToken(response.data.link_token)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="rounded-lg bg-brand-600 text-white text-sm font-medium px-4 py-2 hover:bg-brand-700 disabled:opacity-50"
    >
      {busy ? 'Connecting…' : '+ Connect a bank'}
    </button>
  )
}

export default ConnectBank
