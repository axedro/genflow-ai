import request from 'supertest'
import { app } from '../app'
import { authService } from '../services/auth.service'
import { prisma } from '../config/database'

describe('Dashboard Stats API', () => {
  let authToken: string
  let testUser: any
  
  const testUserData = {
    email: 'dashboard@test.com',
    password: 'TestPassword123!',
    firstName: 'Dashboard',
    lastName: 'Test'
  }

  beforeAll(async () => {
    // Clean up any existing test data
    await cleanup()
    
    // Create test user and get auth token
    const registerResult = await authService.register(testUserData)
    testUser = registerResult.user
    authToken = registerResult.token
    
    console.log('Test setup - Token created:', {
      userId: testUser.id,
      tokenLength: authToken.length,
      tokenPreview: authToken.substring(0, 50) + '...'
    })
    
    // Verify the token can be validated immediately
    try {
      const validation = await authService.validateToken(authToken)
      console.log('Token validation in setup:', {
        userId: validation.user.id,
        workspaceId: validation.workspace.id
      })
    } catch (error) {
      console.error('Token validation failed in setup:', error)
    }
  })

  afterAll(async () => {
    await cleanup()
  })

  async function cleanup() {
    try {
      await prisma.session.deleteMany({
        where: { user: { email: testUserData.email } }
      })
      await prisma.workspaceUser.deleteMany({
        where: { user: { email: testUserData.email } }
      })
      
      const users = await prisma.user.findMany({
        where: { email: testUserData.email },
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
        where: { email: testUserData.email }
      })
    } catch (error) {
      console.warn('Cleanup error:', error)
    }
  }

  describe('GET /api/workspace/stats', () => {
    it('should return dashboard stats for authenticated user', async () => {
      console.log('Making HTTP request with token:', authToken.substring(0, 50) + '...')
      
      // Test token validation right before the request
      try {
        const preValidation = await authService.validateToken(authToken)
        console.log('Pre-request token validation successful:', {
          userId: preValidation.user.id,
          workspaceId: preValidation.workspace.id
        })
      } catch (error) {
        console.error('Pre-request token validation failed:', error)
      }
      
      const response = await request(app)
        .get('/api/workspace/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('aiUsage')
      expect(response.body.data).toHaveProperty('aiLimit') 
      expect(response.body.data).toHaveProperty('_count')
      expect(response.body.data).toHaveProperty('recentActivity')
      
      // Check structure of _count
      expect(response.body.data._count).toHaveProperty('workflows')
      expect(response.body.data._count).toHaveProperty('executions')
      expect(response.body.data._count).toHaveProperty('integrations')
      expect(response.body.data._count).toHaveProperty('users')
      
      // Check structure of recentActivity
      expect(response.body.data.recentActivity).toHaveProperty('totalExecutions')
      expect(response.body.data.recentActivity).toHaveProperty('successfulExecutions')
      expect(response.body.data.recentActivity).toHaveProperty('failedExecutions')
      expect(response.body.data.recentActivity).toHaveProperty('successRate')
      expect(response.body.data.recentActivity).toHaveProperty('avgDuration')
    })

    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get('/api/workspace/stats')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
    })

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/workspace/stats')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
    })
  })

  describe('Frontend API call simulation', () => {
    it('should simulate the exact frontend API call', async () => {
      // This simulates what the frontend does
      const response = await request(app)
        .get('/api/workspace/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .expect(200)

      console.log('Dashboard stats response:', JSON.stringify(response.body, null, 2))
      
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeTruthy()
      
      // Verify it matches the frontend interface
      const stats = response.body.data
      expect(typeof stats.aiUsage).toBe('number')
      expect(typeof stats.aiLimit).toBe('number')
      expect(typeof stats._count.workflows).toBe('number')
      expect(typeof stats._count.executions).toBe('number')
      expect(typeof stats._count.integrations).toBe('number')
      expect(typeof stats._count.users).toBe('number')
      expect(typeof stats.recentActivity.totalExecutions).toBe('number')
      expect(typeof stats.recentActivity.successfulExecutions).toBe('number')
      expect(typeof stats.recentActivity.failedExecutions).toBe('number')
      expect(typeof stats.recentActivity.successRate).toBe('number')
      expect(typeof stats.recentActivity.avgDuration).toBe('number')
    })
  })
})