import { prisma } from '../config/database'
import { redis } from '../config/redis'

// Test database setup
beforeAll(async () => {
  // Connect to test database
  await prisma.$connect()
  
  // Connect to Redis
  await redis.ping()
})

afterAll(async () => {
  // Clean up test data
  await prisma.session.deleteMany()
  await prisma.workspaceUser.deleteMany()
  await prisma.user.deleteMany()
  await prisma.workspace.deleteMany()
  
  // Disconnect
  await prisma.$disconnect()
  redis.disconnect()
})

beforeEach(async () => {
  // Clean up before each test
  await prisma.session.deleteMany()
  await prisma.workspaceUser.deleteMany()
  await prisma.user.deleteMany()
  await prisma.workspace.deleteMany()
})