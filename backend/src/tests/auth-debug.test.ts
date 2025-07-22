import { authService } from '../services/auth.service'
import { prisma } from '../config/database'
import * as jwt from 'jsonwebtoken'
import { env } from '../config/environment'

describe('Auth Debug - Token Validation', () => {
  const testUserData = {
    email: 'tokentest@example.com',
    password: 'TestPassword123!',
    firstName: 'Token',
    lastName: 'Test'
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
      console.warn('Cleanup error:', error)
    }
  }

  it('should debug token validation step by step', async () => {
    console.log('=== REGISTER USER ===')
    
    // Register user
    const registerResult = await authService.register(testUserData)
    const { user, token, workspace } = registerResult
    
    console.log('Registration result:', {
      userId: user.id,
      email: user.email,
      tokenExists: !!token,
      workspaceId: workspace?.id
    })

    console.log('=== CHECK DATABASE STATE ===')
    
    // Check if session exists in database
    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      include: { user: true }
    })
    
    console.log(`Found ${sessions.length} sessions for user`)
    if (sessions.length > 0) {
      console.log('Session details:', {
        sessionId: sessions[0].id,
        token: sessions[0].token.substring(0, 50) + '...',
        userId: sessions[0].userId,
        expiresAt: sessions[0].expiresAt,
        isExpired: sessions[0].expiresAt < new Date()
      })
    }

    console.log('=== DECODE JWT TOKEN ===')
    
    // Decode token to see payload
    const decoded = jwt.decode(token) as any
    console.log('Decoded token payload:', {
      userId: decoded.userId,
      workspaceId: decoded.workspaceId,
      role: decoded.role,
      sessionId: decoded.sessionId,
      exp: new Date(decoded.exp * 1000).toISOString(),
      isExpired: decoded.exp < Date.now() / 1000
    })

    console.log('=== MANUALLY VALIDATE TOKEN ===')
    
    try {
      // Verify JWT signature
      const verified = jwt.verify(token, env.JWT_SECRET) as any
      console.log('JWT signature valid:', !!verified)
      
      // Check if session exists with exact token
      const sessionByToken = await prisma.session.findUnique({
        where: { token },
        include: {
          user: {
            include: {
              workspaces: {
                include: { workspace: true }
              }
            }
          }
        }
      })
      
      console.log('Session found by token:', !!sessionByToken)
      if (sessionByToken) {
        console.log('Session details:', {
          sessionId: sessionByToken.id,
          userId: sessionByToken.userId,
          expiresAt: sessionByToken.expiresAt,
          isExpired: sessionByToken.expiresAt < new Date(),
          userExists: !!sessionByToken.user,
          workspaceCount: sessionByToken.user?.workspaces.length
        })
      }

    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError)
    }

    console.log('=== TEST AUTH SERVICE validateToken ===')
    
    try {
      const validationResult = await authService.validateToken(token)
      console.log('Token validation successful:', {
        userId: validationResult.user.id,
        workspaceId: validationResult.workspace.id
      })
    } catch (validationError) {
      console.error('Token validation failed:', validationError)
      
      // Additional debugging
      console.log('=== ADDITIONAL DEBUG INFO ===')
      
      // Check if token is blacklisted in Redis
      const isBlacklisted = await prisma.$queryRaw`
        SELECT EXISTS(
          SELECT 1 FROM sessions WHERE token = ${token}
        ) as session_exists
      `
      console.log('Database query result:', isBlacklisted)
    }
  })
})