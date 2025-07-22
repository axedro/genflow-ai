import { app } from './app'
import { env } from './config/environment'
import { logger } from './utils/logger'
import { prisma } from './config/database'
import { redis } from './config/redis'

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect()
    logger.info('✅ Database connected successfully')

    // Test Redis connection
    await redis.ping()
    logger.info('✅ Redis connected successfully')

    // Start server
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`)
      logger.info(`📍 API available at http://localhost:${env.PORT}/api`)
      logger.info(`🔍 Health check at http://localhost:${env.PORT}/health`)
    })

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${env.PORT} is already in use`)
      } else {
        logger.error('❌ Server error:', error)
      }
      process.exit(1)
    })

    return server
  } catch (error) {
    logger.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

async function gracefulShutdown(signal: string) {
  logger.info(`📡 Received ${signal}. Starting graceful shutdown...`)

  try {
    // Close database connection
    await prisma.$disconnect()
    logger.info('✅ Database connection closed')

    // Close Redis connection
    redis.disconnect()
    logger.info('✅ Redis connection closed')

    logger.info('✅ Graceful shutdown completed')
    process.exit(0)
  } catch (error) {
    logger.error('❌ Error during shutdown:', error)
    process.exit(1)
  }
}

// Start the server
startServer()