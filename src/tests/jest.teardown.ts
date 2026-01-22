import dotenv from 'dotenv'

export default async function globalTeardown() {
  dotenv.config({ path: '.env.test' })

  const mod = await import('../db/prisma')
  await mod.prisma.$disconnect()
}
