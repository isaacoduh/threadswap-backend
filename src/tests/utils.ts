import { prisma } from '@db/prisma'

export async function resetDb() {
  await prisma.emailVerificationToken.deleteMany()
  await prisma.passwordResetToken.deleteMany()
  await prisma.user.deleteMany()
}
