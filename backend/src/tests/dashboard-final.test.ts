import request from 'supertest'
import { app } from '../app'
import { authService } from '../services/auth.service'
import { prisma } from '../config/database'

describe('Dashboard Stats - Working Test', () => {
  const testUserData = {
    email: 'workingdashboard@test.com',
    password: 'TestPassword123!',
    firstName: 'Working',
    lastName: 'Dashboard'
  }

  beforeEach(async () => {
    await cleanup()
  })

  afterEach(async () => {
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
      // Ignore cleanup errors
    }
  }

  it('should return dashboard stats successfully', async () => {
    // Register user and get token
    const registerResult = await authService.register(testUserData)
    const authToken = registerResult.token

    // Make API request
    const response = await request(app)
      .get('/api/workspace/stats')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    // Verify response structure
    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveProperty('aiUsage')
    expect(response.body.data).toHaveProperty('aiLimit')
    expect(response.body.data).toHaveProperty('_count')
    expect(response.body.data).toHaveProperty('recentActivity')

    // Verify _count structure
    expect(response.body.data._count).toHaveProperty('workflows')
    expect(response.body.data._count).toHaveProperty('executions')
    expect(response.body.data._count).toHaveProperty('integrations')
    expect(response.body.data._count).toHaveProperty('users')

    // Verify recentActivity structure  
    expect(response.body.data.recentActivity).toHaveProperty('totalExecutions')
    expect(response.body.data.recentActivity).toHaveProperty('successfulExecutions')
    expect(response.body.data.recentActivity).toHaveProperty('failedExecutions')
    expect(response.body.data.recentActivity).toHaveProperty('successRate')
    expect(response.body.data.recentActivity).toHaveProperty('avgDuration')

    // Verify data types
    expect(typeof response.body.data.aiUsage).toBe('number')
    expect(typeof response.body.data.aiLimit).toBe('number')
    expect(typeof response.body.data._count.workflows).toBe('number')
    expect(typeof response.body.data.recentActivity.successRate).toBe('number')

    console.log('Dashboard stats response:', JSON.stringify(response.body.data, null, 2))
  })

  it('should handle multiple requests with fresh tokens', async () => {
    // First request
    const registerResult1 = await authService.register({
      ...testUserData,
      email: 'first-' + testUserData.email
    })

    const response1 = await request(app)
      .get('/api/workspace/stats')
      .set('Authorization', `Bearer ${registerResult1.token}`)
      .expect(200)

    expect(response1.body.success).toBe(true)

    // Second request with different user
    const registerResult2 = await authService.register({
      ...testUserData,
      email: 'second-' + testUserData.email
    })

    const response2 = await request(app)
      .get('/api/workspace/stats')
      .set('Authorization', `Bearer ${registerResult2.token}`)
      .expect(200)

    expect(response2.body.success).toBe(true)

    // Clean up additional users
    await prisma.session.deleteMany({
      where: {
        user: {
          email: {
            in: ['first-' + testUserData.email, 'second-' + testUserData.email]
          }
        }
      }
    })
    
    await prisma.workspaceUser.deleteMany({
      where: {
        user: {
          email: {
            in: ['first-' + testUserData.email, 'second-' + testUserData.email]
          }
        }
      }
    })

    const additionalUsers = await prisma.user.findMany({
      where: {
        email: {
          in: ['first-' + testUserData.email, 'second-' + testUserData.email]
        }
      },
      include: { workspaces: { include: { workspace: true } } }
    })

    for (const user of additionalUsers) {
      for (const userWorkspace of user.workspaces) {
        if (userWorkspace.role === 'OWNER') {
          await prisma.workspace.delete({
            where: { id: userWorkspace.workspace.id }
          })
        }
      }
    }

    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['first-' + testUserData.email, 'second-' + testUserData.email]
        }
      }
    })
  })
})