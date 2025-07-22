import { Request, Response } from 'express'
import { healthService } from '../services/health.service'
import { logger } from '../utils/logger'
import { APIResponse } from '../types'

export class HealthController {
  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await healthService.getSystemHealth()
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 503

      res.status(statusCode).json({
        success: true,
        data: health
      } as APIResponse)
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Health check failed', { error: error.message })
        res.status(503).json({
          success: false,
          error: 'Health check failed',
          data: {
            status: 'unhealthy',
            timestamp: new Date().toISOString()
          }
        } as APIResponse)
      } else {
        logger.error('Health check failed', { error })
        res.status(503).json({
          success: false,
          error: 'Health check failed',
          data: {
            status: 'unhealthy',
            timestamp: new Date().toISOString()
          }
        } as APIResponse)
      }
    }
  }

  async getReadiness(req: Request, res: Response): Promise<void> {
    try {
      const { status, body } = await healthService.getReadinessStatus()
      res.status(status).json(body)
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Readiness check failed', { error: error.message })
        res.status(503).json({
          status: 'not_ready',
          error: error.message,
          timestamp: new Date().toISOString()
        })
      } else {
        logger.error('Readiness check failed', { error })
        res.status(503).json({
          status: 'not_ready',
          error: String(error),
          timestamp: new Date().toISOString()
        })
      }
    }
  }

  async getLiveness(req: Request, res: Response): Promise<void> {
    try {
      const { status, body } = await healthService.getLivenessStatus()
      res.status(status).json(body)
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Liveness check failed', { error: error.message })
        res.status(503).json({
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        })
      } else {
        logger.error('Liveness check failed', { error })
        res.status(503).json({
          status: 'unhealthy',
          error: String(error),
          timestamp: new Date().toISOString()
        })
      }
    }
  }

  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV
      }

      res.status(200).json({
        success: true,
        data: metrics
      } as APIResponse)
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Metrics collection failed', { error: error.message })
        res.status(500).json({
          success: false,
          error: error.message || 'Failed to collect metrics'
        } as APIResponse)
      } else {
        logger.error('Metrics collection failed', { error })
        res.status(500).json({
          success: false,
          error: 'Failed to collect metrics'
        } as APIResponse)
      }
    }
  }
}

export const healthController = new HealthController()