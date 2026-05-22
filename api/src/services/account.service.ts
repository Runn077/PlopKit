import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma.js'
import { AppError } from '../errors/appError.js'
import { PROVIDER_IDS } from '../constants/index.js'

export async function getAccountMeta(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: PROVIDER_IDS.CREDENTIAL },
  })
  return { hasPassword: !!account }
}

export async function updateName(userId: string, name: string) {
  await prisma.user.update({ where: { id: userId }, data: { name } })
}

export async function updatePassword(userId: string, currentPassword: string, newPassword: string) {
  if (newPassword.length < 8) throw new AppError(400, 'New password must be at least 8 characters')

  const account = await prisma.account.findFirst({
    where: { userId, providerId: PROVIDER_IDS.CREDENTIAL },
  })
  if (!account?.password) throw new AppError(400, 'No password set on this account')

  const valid = await bcrypt.compare(currentPassword, account.password)
  if (!valid) throw new AppError(400, 'Current password is incorrect')

  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.account.update({ where: { id: account.id }, data: { password: hashed } })
}

export async function deleteAccount(userId: string) {
  await prisma.user.delete({ where: { id: userId } })
}