import request from 'supertest'
import { app } from '../app'
import './setup'

describe('Health Check Endpoints', () => {
  describe('GET /health', () => {
    it('should return system health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBeDefined()
      expect(response.body.data.services).toBeDefined()
      expect(response.body.data.services.database).toBeDefined()
      expect(response.body.data.services.redis).toBeDefined()
    })
  })

  describe('GET /ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/ready')

      expect(response.body.status).toBeDefined()
      expect(['ready', 'not_ready']).toContain(response.body.status)
    })
  })

  describe('GET /live', () => {
    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/live')

      expect(response.body.status).toBeDefined()
      expect(['alive', 'unhealthy']).toContain(response.body.status)
    })
  })
})