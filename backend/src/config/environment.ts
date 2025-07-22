import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  OPENAI_API_KEY: z.string(),
  GOOGLE_CLOUD_PROJECT: z.string(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  ENCRYPTION_KEY: z.string().min(32),
  BCRYPT_ROUNDS: z.string().default('12').transform(Number)
})

export const env = envSchema.parse(process.env)
export type Environment = z.infer<typeof envSchema>