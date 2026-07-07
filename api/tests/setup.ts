import prisma from '../src/lib/prisma.js'

export async function resetDatabase() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "Comment", "CommentWidget", "Widget", "Site",
      "Session", "Account", "Verification", "User"
    RESTART IDENTITY CASCADE;
  `)
}

export { prisma }