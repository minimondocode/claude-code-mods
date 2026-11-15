import express from 'express'
import { users } from './routes/users.js'

const app = express()
app.use(express.json())
app.get('/health', (req, res) => res.json({ ok: true }))
app.use('/users', users)

const port = process.env.PORT ?? 3000
app.listen(port, () => console.log(`acme-api listening on ${port}`))
