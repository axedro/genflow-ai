import bcrypt from 'bcrypt'
import { prisma } from '../config/database'
import { authService } from '../services/auth.service'

describe('Debug Auth Issue', () => {
  const testEmail = 'debug@test.com'
  const testPassword = 'TestPassword123!'

  afterEach(async () => {
    // Clean up
    try {
      await prisma.session.deleteMany({
        where: { user: { email: testEmail } }
      })
      await prisma.workspaceUser.deleteMany({
        where: { user: { email: testEmail } }
      })
      await prisma.workspace.deleteMany({
        where: { users: { some: { user: { email: testEmail } } } }
      })
      await prisma.user.deleteMany({
        where: { email: testEmail }
      })
    } catch (error) {
      console.log('Cleanup error:', error)
    }
  })

  it('should debug bcrypt hashing and comparison', async () => {
    console.log('=== BCRYPT DEBUG ===')
    
    // Test bcrypt directly
    const hashedPassword = await bcrypt.hash(testPassword, 12)
    console.log('Original password:', testPassword)
    console.log('Hashed password:', hashedPassword)
    
    const isValidDirect = await bcrypt.compare(testPassword, hashedPassword)
    console.log('Direct bcrypt comparison:', isValidDirect)
    
    expect(isValidDirect).toBe(true)
  })

  it('should debug full registration and login flow', async () => {
    console.log('=== FULL FLOW DEBUG ===')
    
    // Register user
    console.log('Registering user...')
    const registerResult = await authService.register({
      email: testEmail,
      password: testPassword,
      firstName: 'Debug',
      lastName: 'User'
    })
    
    console.log('Registration successful:', {
      userId: registerResult.user.id,
      email: registerResult.user.email,
      hasToken: !!registerResult.token
    })

    // Check database state
    const dbUser = await prisma.user.findUnique({
      where: { email: testEmail },
      include: {
        workspaces: {
          include: { workspace: true }
        }
      }
    })
    
    console.log('User in database:', {
      id: dbUser?.id,
      email: dbUser?.email,
      hasPasswordHash: !!dbUser?.passwordHash,
      passwordHashLength: dbUser?.passwordHash?.length,
      workspaceCount: dbUser?.workspaces.length
    })

    // Try to login
    console.log('Attempting login...')
    try {
      const loginResult = await authService.login({
        email: testEmail,
        password: testPassword
      })
      
      console.log('Login successful:', {
        userId: loginResult.user.id,
        email: loginResult.user.email,
        hasToken: !!loginResult.token
      })
    } catch (error) {
      console.error('Login failed:', error)
      
      // Debug password comparison manually
      if (dbUser?.passwordHash) {
        const isPasswordValid = await bcrypt.compare(testPassword, dbUser.passwordHash)
        console.log('Manual password comparison:', isPasswordValid)
        
        // Check if email case is an issue
        const userByExactEmail = await prisma.user.findUnique({
          where: { email: testEmail }
        })
        const userByLowerEmail = await prisma.user.findUnique({
          where: { email: testEmail.toLowerCase() }
        })
        
        console.log('User by exact email:', !!userByExactEmail)
        console.log('User by lowercase email:', !!userByLowerEmail)
        console.log('Are they the same?', userByExactEmail?.id === userByLowerEmail?.id)
      }
      
      throw error
    }
  })

  it('should check user workspace relationship', async () => {
    console.log('=== WORKSPACE RELATIONSHIP DEBUG ===')
    
    // First register a user
    const registerResult = await authService.register({
      email: testEmail,
      password: testPassword,
      firstName: 'Debug',
      lastName: 'User'
    })

    // Check the user-workspace relationship
    const userWithWorkspaces = await prisma.user.findUnique({
      where: { email: testEmail },
      include: {
        workspaces: {
          include: {
            workspace: true
          },
          where: {
            role: { in: ['OWNER', 'ADMIN'] }
          }
        }
      }
    })

    console.log('User workspace data:', {
      userExists: !!userWithWorkspaces,
      workspaceCount: userWithWorkspaces?.workspaces.length,
      workspaces: userWithWorkspaces?.workspaces.map(w => ({
        role: w.role,
        workspaceId: w.workspace.id,
        workspaceName: w.workspace.name
      }))
    })

    expect(userWithWorkspaces).toBeTruthy()
    expect(userWithWorkspaces?.workspaces.length).toBeGreaterThan(0)
  })
})