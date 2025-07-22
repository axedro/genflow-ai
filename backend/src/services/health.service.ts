import { prisma } from '../config/database'
import { redis } from '../config/redis'
import { logger } from '../utils/logger'
import { HealthStatus, SystemHealth } from '../types'
import OpenAI from 'openai'
import { env } from '../config/environment'

export class HealthService {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY
    })
  }

  async checkDatabaseHealth(): Promise<HealthStatus> {
    try {
      const start = Date.now()
      await prisma.$queryRaw`SELECT 1`
      const responseTime = Date.now() - start

      return {
        status: 'healthy',
        responseTime
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Database health check failed', { error: error.message })
        return {
          status: 'unhealthy',
          error: error.message
        }
      } else {
        logger.error('Database health check failed', { error })
        return {
          status: 'unhealthy',
          error: typeof error === 'string' ? error : JSON.stringify(error)
        }
      }
    }
  }

  async checkRedisHealth(): Promise<HealthStatus> {
    try {
      const start = Date.now()
      await redis.ping()
      const responseTime = Date.now() - start

      return {
        status: 'healthy',
        responseTime
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Redis health check failed', { error: error.message })
        return {
          status: 'unhealthy',
          error: error.message
        }
      } else {
        logger.error('Redis health check failed', { error })
        return {
          status: 'unhealthy',
          error: typeof error === 'string' ? error : JSON.stringify(error)
        }
      }
    }
  }

  async checkAIServiceHealth(): Promise<HealthStatus> {
    try {
      const start = Date.now()
      await this.openai.models.list()
      const responseTime = Date.now() - start

      return {
        status: 'healthy',
        responseTime
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error('AI service health check failed', { error: error.message })
        return {
          status: 'unhealthy',
          error: error.message
        }
      } else {
        logger.error('AI service health check failed', { error })
        return {
          status: 'unhealthy',
          error: typeof error === 'string' ? error : JSON.stringify(error)
        }
      }
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const [database, redis, aiService] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkRedisHealth(),
      this.checkAIServiceHealth()
    ])

    const services = { database, redis, aiService }
    const healthyServices = Object.values(services).filter(s => s.status === 'healthy').length
    const totalServices = Object.values(services).length

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy'
    if (healthyServices === totalServices) {
      overallStatus = 'healthy'
    } else if (healthyServices >= totalServices / 2) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'unhealthy'
    }

    return {
      status: overallStatus,
      services,
      timestamp: new Date().toISOString()
    }
  }

  // Kubernetes readiness probe
  async getReadinessStatus(): Promise<{ status: number; body: any }> {
    const [database, redis] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkRedisHealth()
    ])

    const isReady = database.status === 'healthy' && redis.status === 'healthy'

    return {
      status: isReady ? 200 : 503,
      body: {
        status: isReady ? 'ready' : 'not_ready',
        services: { database, redis },
        timestamp: new Date().toISOString()
      }
    }
  }

  // Kubernetes liveness probe
  async getLivenessStatus(): Promise<{ status: number; body: any }> {
    try {
      const memoryUsage = process.memoryUsage()
      const uptime = process.uptime()

      // Check if memory usage is reasonable (less than 80% of limit)
      const memoryLimit = parseInt(process.env.MEMORY_LIMIT || '512') * 1024 * 1024 // MB to bytes
      const memoryHealthy = memoryUsage.heapUsed < (memoryLimit * 0.8)

      const isAlive = memoryHealthy && uptime > 10 // App running for more than 10 seconds

      return {
        status: isAlive ? 200 : 503,
        body: {
          status: isAlive ? 'alive' : 'unhealthy',
          uptime,
          memory: {
            used: memoryUsage.heapUsed,
            limit: memoryLimit,
            healthy: memoryHealthy
          },
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        status: 503,
        body: {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : error,
          timestamp: new Date().toISOString()
        }
      }
    }
  }
}

export const healthService = new HealthService()