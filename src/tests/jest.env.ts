import dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })
process.env.POSTGRES_URL = process.env.POSTGRES_URL ?? process.env.DATABASE_URL
process.env.DB_URL = process.env.DB_URL ?? process.env.DATABASE_URL
process.env.DATABASE_DIRECT_URL = process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL
process.env.DIRECT_URL = process.env.DIRECT_URL ?? process.env.DATABASE_URL

if (!process.env.DATABASE_URL) {
   
  console.error('[jest.env] DATABASE_URL missing. Did .env.test load?')
  process.exit(1)
}

 
console.log('[jest.env] DATABASE_URL loaded:', process.env.DATABASE_URL)
