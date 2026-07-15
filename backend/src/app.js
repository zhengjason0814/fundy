const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const expenseRoutes = require('./routes/expenses')

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/expenses', expenseRoutes)

module.exports = app
