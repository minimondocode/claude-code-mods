import { Router } from 'express'

export const users = Router()

const all = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' },
]

users.get('/', (req, res) => res.json(all))
users.get('/:id', (req, res) => {
  const user = all.find(u => u.id === Number(req.params.id))
  if (!user) return res.status(404).json({ error: 'not found' })
  res.json(user)
})
