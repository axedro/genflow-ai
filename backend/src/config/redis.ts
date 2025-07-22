import Redis from 'ioredis'
import { env } from './environment'

export const redis = new Redis(env.REDIS_URL, {
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  lazyConnect: true
})

redis.on('connect', () => {
  console.log('✅ Redis connected')
})

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error)
})