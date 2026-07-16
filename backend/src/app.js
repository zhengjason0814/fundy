const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const expenseRoutes = require('./routes/expenses')
const plaidRoutes = require('./routes/plaid')
const accountRoutes = require('./routes/accounts')

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/plaid', plaidRoutes)
app.use('/api/accounts', accountRoutes)

module.exports = app
