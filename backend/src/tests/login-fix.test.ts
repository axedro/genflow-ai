import request from 'supertest'
import { app } from '../app'
import { prisma } from '../config/database'

describe('Login Fix Verification', () => {
  const testEmail = 'logintest@example.com'
  const testPassword = 'TestPassword123!'

  beforeEach(async () => {
    await cleanupUser()
  })

  afterEach(async () => {
    await cleanupUser()
  })

  async function cleanupUser() {
    try {
      await prisma.session.deleteMany({
        where: { user: { email: testEmail } }
      })
      await prisma.workspaceUser.deleteMany({
        where: { user: { email: testEmail } }
      })
      
      const users = await prisma.user.findMany({
        where: { email: testEmail },
        include: { workspaces: { include: { workspace: true } } }
      })
      
      for (const user of users) {
        for (const userWorkspace of user.workspaces) {
          if (userWorkspace.role === 'OWNER') {
            await prisma.workspace.delete({
              where: { id: userWorkspace.workspace.id }
            })
          }
        }
      }
      
      await prisma.user.deleteMany({
        where: { email: testEmail }
      })
    } catch (error) {
      console.warn('Cleanup error:', error)
    }
  }

  it('should complete full registration and login flow successfully', async () => {
    // Step 1: Register user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        firstName: 'Login',
        lastName: 'Test'
      })

    expect(registerResponse.status).toBe(201)
    expect(registerResponse.body.success).toBe(true)
    expect(registerResponse.body.data.user.email).toBe(testEmail)
    expect(registerResponse.body.data.token).toBeDefined()

    // Step 2: Verify user exists in database
    const dbUser = await prisma.user.findUnique({
      where: { email: testEmail },
      include: {
        workspaces: {
          include: { workspace: true }
        }
      }
    })

    expect(dbUser).toBeTruthy()
    expect(dbUser!.email).toBe(testEmail)
    expect(dbUser!.passwordHash).toBeTruthy()
    expect(dbUser!.workspaces.length).toBeGreaterThan(0)

    // Step 3: Login with same credentials
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: testPassword
      })

    expect(loginResponse.status).toBe(200)
    expect(loginResponse.body.success).toBe(true)
    expect(loginResponse.body.data.user.email).toBe(testEmail)
    expect(loginResponse.body.data.token).toBeDefined()
    expect(loginResponse.body.data.workspace).toBeDefined()

    // Step 4: Verify tokens are unique
    const registerToken = registerResponse.body.data.token
    const loginToken = loginResponse.body.data.token
    
    expect(registerToken).not.toBe(loginToken)
    
    // Step 5: Verify both tokens are valid JWT format
    expect(registerToken.split('.').length).toBe(3)
    expect(loginToken.split('.').length).toBe(3)
  })

  it('should handle multiple logins without token collision', async () => {
    // Register user first
    await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        firstName: 'Login',
        lastName: 'Test'
      })
      .expect(201)

    // Login multiple times
    const tokens = []
    
    for (let i = 0; i < 5; i++) {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        })
        .expect(200)
      
      tokens.push(response.body.data.token)
    }

    // Verify all tokens are unique
    const uniqueTokens = new Set(tokens)
    expect(uniqueTokens.size).toBe(tokens.length)

    // Verify all tokens are properly formatted
    tokens.forEach(token => {
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3)
    })
  })

  it('should reject login attempts with wrong password', async () => {
    // Register user
    await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        firstName: 'Login',
        lastName: 'Test'
      })
      .expect(201)

    // Try to login with wrong password
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword123!'
      })
      .expect(401)

    expect(response.body.success).toBe(false)
    expect(response.body.error).toContain('Invalid email or password')
  })
})