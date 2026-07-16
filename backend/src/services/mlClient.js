const axios = require('axios')

const client = axios.create({
  baseURL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  timeout: 3000,
})

async function predict(expenses, asOf) {
  const { data } = await client.post('/predict', { as_of: asOf, expenses })
  return data
}

async function classify(history, text) {
  const { data } = await client.post('/classify', { history, text })
  return data
}

async function detectAnomalies(expenses) {
  const { data } = await client.post('/anomalies', { expenses })
  return data
}

module.exports = { predict, classify, detectAnomalies }
