import { config } from 'dotenv'

import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'

import * as schema from './schema.ts'

config()

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle({ client: sql, schema })
