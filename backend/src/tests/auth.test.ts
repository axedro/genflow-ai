import request from 'supertest'
import { app } from '../app'
import './setup'

describe('Authentication Endpoints', () => {
  const testUser = {
    email: 'test@genflow.ai',
    password: 'TestPass123',
    firstName: 'Test',
    lastName: 'User',
    companyName: 'Test Company'
  }

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(testUser.email)
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.workspace).toBeDefined()
    })

    it('should reject duplicate email registration', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)

      // Second registration with same email
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400)
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // Too short
          firstName: '',
          lastName: ''
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.details).toBeDefined()
    })
  })

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
    })

    it('should login with valid credentials', async () => {
      // User is already registered in beforeEach
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(testUser.email)
      expect(response.body.data.token).toBeDefined()
    })

    it('should reject invalid credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401)
    })

    it('should reject non-existent user', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123'
        })
        .expect(401)
    })
  })

  describe('GET /api/auth/me', () => {
    let authToken: string

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)

      authToken = response.body.data.token
    })

    it('should return user data with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(testUser.email)
    })

    it('should reject requests without token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401)
    })

    it('should reject invalid token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
    })
  })
})