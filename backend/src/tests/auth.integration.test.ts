import request from 'supertest'
import { app } from '../app'
import { prisma } from '../config/database'
import { redis } from '../config/redis'

describe('Auth Integration Tests', () => {
  let testUser: any
  const testUserData = {
    email: 'test@genflow.ai',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User'
  }

  beforeAll(async () => {
    // Ensure database and Redis are connected
    await prisma.$connect()
    
    try {
      await redis.ping()
    } catch (error) {
      console.warn('Redis connection failed:', error)
    }
  })

  beforeEach(async () => {
    // Clean up any existing test data before each test
    await cleanupTestUser()
  })

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestUser()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  async function cleanupTestUser() {
    try {
      // Delete sessions first
      await prisma.session.deleteMany({
        where: {
          user: {
            email: testUserData.email
          }
        }
      })
      
      // Delete workspace users
      await prisma.workspaceUser.deleteMany({
        where: {
          user: {
            email: testUserData.email
          }
        }
      })
      
      // Delete workspaces that belong to the test user
      const testUsers = await prisma.user.findMany({
        where: { email: testUserData.email },
        include: { workspaces: { include: { workspace: true } } }
      })
      
      for (const user of testUsers) {
        for (const userWorkspace of user.workspaces) {
          if (userWorkspace.role === 'OWNER') {
            await prisma.workspace.delete({
              where: { id: userWorkspace.workspace.id }
            })
          }
        }
      }
      
      // Finally delete users
      await prisma.user.deleteMany({
        where: { email: testUserData.email }
      })
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Cleanup warning:', error)
    }
  }

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUserData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data).toHaveProperty('token')
      expect(response.body.data).toHaveProperty('workspace')
      expect(response.body.data.user.email).toBe(testUserData.email)
      expect(response.body.data.user.firstName).toBe(testUserData.firstName)
      
      // Store for cleanup and login test
      testUser = response.body.data.user
    })

    it('should not register user with existing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUserData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('User already exists')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: testUserData.email,
        password: testUserData.password
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data).toHaveProperty('token')
      expect(response.body.data).toHaveProperty('workspace')
      expect(response.body.data.user.email).toBe(testUserData.email)
      
      // Verify token format
      expect(typeof response.body.data.token).toBe('string')
      expect(response.body.data.token.split('.').length).toBe(3) // JWT format
    })

    it('should not login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: testUserData.password
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Invalid email or password')
    })

    it('should not login with invalid password', async () => {
      const loginData = {
        email: testUserData.email,
        password: 'wrongpassword'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Invalid email or password')
    })

    it('should handle missing email field', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: testUserData.password })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should handle missing password field', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: testUserData.email })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email":"test@example.com","password":}')
        .expect(400)
    })
  })

  describe('Database and Infrastructure Tests', () => {
    it('should connect to database', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as test`
      expect(result).toBeDefined()
    })

    it('should have users table accessible', async () => {
      const count = await prisma.user.count()
      expect(typeof count).toBe('number')
    })

    it('should have workspaces table accessible', async () => {
      const count = await prisma.workspace.count()
      expect(typeof count).toBe('number')
    })
  })

  describe('API Endpoint Verification', () => {
    it('should respond to GET /', async () => {
      const response = await request(app)
        .get('/')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('GenFlow AI API')
    })

    it('should respond to GET /api', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should handle 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404)
    })
  })

  describe('CORS and Headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:5173')
        .expect(204)

      expect(response.headers['access-control-allow-origin']).toBeDefined()
    })

    it('should accept JSON content-type', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
          email: testUserData.email,
          password: testUserData.password
        }))
        .expect(200)

      expect(response.body.success).toBe(true)
    })
  })
})