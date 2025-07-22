import { PrismaClient } from '@prisma/client'
import { env } from './environment'

export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'colorless'
})

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})