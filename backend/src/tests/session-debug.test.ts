import { authService } from '../services/auth.service'
import { prisma } from '../config/database'
import request from 'supertest'
import { app } from '../app'

describe('Session Debug', () => {
  const testUserData = {
    email: 'sessiondebug@test.com',
    password: 'TestPassword123!',
    firstName: 'Session',
    lastName: 'Debug'
  }

  let authToken: string
  let userId: string

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
      console.warn('Cleanup error:', error)
    }
  }

  it('should track session state through the test lifecycle', async () => {
    console.log('=== STEP 1: Register User ===')
    
    const registerResult = await authService.register(testUserData)
    authToken = registerResult.token
    userId = registerResult.user.id
    
    console.log('User registered:', { userId, tokenLength: authToken.length })
    
    // Check session immediately after registration
    console.log('=== STEP 2: Check Session After Registration ===')
    const sessionsAfterReg = await prisma.session.findMany({
      where: { userId },
      include: { user: true }
    })
    
    console.log(`Sessions after registration: ${sessionsAfterReg.length}`)
    if (sessionsAfterReg.length > 0) {
      const session = sessionsAfterReg[0]
      console.log('Session details:', {
        id: session.id,
        token: session.token.substring(0, 50) + '...',
        tokenMatches: session.token === authToken,
        expiresAt: session.expiresAt,
        isExpired: session.expiresAt < new Date(),
        timeDifference: session.expiresAt.getTime() - Date.now()
      })
    }

    console.log('=== STEP 3: Validate Token Directly ===')
    try {
      const validation1 = await authService.validateToken(authToken)
      console.log('Direct validation success:', { userId: validation1.user.id })
    } catch (error) {
      console.error('Direct validation failed:', error)
    }

    console.log('=== STEP 4: Check Session Before HTTP Request ===')
    const sessionsBeforeHttp = await prisma.session.findMany({
      where: { userId },
      include: { user: true }
    })
    
    console.log(`Sessions before HTTP: ${sessionsBeforeHttp.length}`)
    if (sessionsBeforeHttp.length > 0) {
      const session = sessionsBeforeHttp[0]
      console.log('Session before HTTP:', {
        id: session.id,
        tokenMatches: session.token === authToken,
        expiresAt: session.expiresAt,
        isExpired: session.expiresAt < new Date()
      })
    }

    console.log('=== STEP 5: Test Direct Token Validation Before HTTP ===')
    try {
      const validation2 = await authService.validateToken(authToken)
      console.log('Pre-HTTP validation success:', { userId: validation2.user.id })
    } catch (error) {
      console.error('Pre-HTTP validation failed:', error)
      
      // Additional debugging - check exact session state
      const debugSession = await prisma.session.findUnique({
        where: { token: authToken },
        include: { user: { include: { workspaces: { include: { workspace: true } } } } }
      })
      
      console.log('Debug - session by token lookup:', {
        found: !!debugSession,
        expired: debugSession ? debugSession.expiresAt < new Date() : 'N/A',
        expiresAt: debugSession?.expiresAt,
        now: new Date()
      })
    }

    console.log('=== STEP 6: Make HTTP Request ===')
    const response = await request(app)
      .get('/api/workspace/stats')
      .set('Authorization', `Bearer ${authToken}`)

    console.log('HTTP Response:', {
      status: response.status,
      success: response.body.success,
      error: response.body.error
    })

    console.log('=== STEP 7: Check Session After HTTP Request ===')
    const sessionsAfterHttp = await prisma.session.findMany({
      where: { userId },
      include: { user: true }
    })
    
    console.log(`Sessions after HTTP: ${sessionsAfterHttp.length}`)
    if (sessionsAfterHttp.length > 0) {
      const session = sessionsAfterHttp[0]
      console.log('Session after HTTP:', {
        id: session.id,
        tokenMatches: session.token === authToken,
        expiresAt: session.expiresAt,
        isExpired: session.expiresAt < new Date()
      })
    }
  })
})