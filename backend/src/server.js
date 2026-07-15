require('dotenv').config({ quiet: true })
const app = require('./app')
const connectDB = require('./config/db')

const PORT = process.env.PORT || 4000

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})
