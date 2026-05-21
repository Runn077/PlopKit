import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import bcrypt from 'bcryptjs'

const router = Router()

router.get('/me', requireAuth, async (req, res) => {
  const { user } = res.locals.session
  const hasPassword = await prisma.account.findFirst({
    where: { userId: user.id, providerId: 'credential' },
  })
  res.json({ hasPassword: !!hasPassword })
})

router.patch('/name', requireAuth, async (req, res) => {
  try {
    const { user } = res.locals.session
    const { name } = req.body
    if (!name?.trim()) {
      res.status(400).json({ error: 'Name is required' })
      return
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { name },
    })
    res.json({ success: true })
  } catch (err) {
    console.error('PATCH /account/name error:', err)
    res.status(500).json({ error: 'Failed to update name' })
  }
})

router.patch('/password', requireAuth, async (req, res) => {
  try {
    const { user } = res.locals.session
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Both passwords are required' })
      return
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters' })
      return
    }

    const account = await prisma.account.findFirst({
      where: { userId: user.id, providerId: 'credential' },
    })
    if (!account?.password) {
      res.status(400).json({ error: 'No password set on this account' })
      return
    }

    const valid = await bcrypt.compare(currentPassword, account.password)
    if (!valid) {
      res.status(400).json({ error: 'Current password is incorrect' })
      return
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.account.update({
      where: { id: account.id },
      data: { password: hashed },
    })
    res.json({ success: true })
  } catch (err) {
    console.error('PATCH /account/password error:', err)
    res.status(500).json({ error: 'Failed to update password' })
  }
})

router.delete('/', requireAuth, async (req, res) => {
  try {
    const { user } = res.locals.session
    await prisma.user.delete({ where: { id: user.id } })
    res.json({ success: true })
  } catch (err) {
    console.error('DELETE /account error:', err)
    res.status(500).json({ error: 'Failed to delete account' })
  }
})

export default router