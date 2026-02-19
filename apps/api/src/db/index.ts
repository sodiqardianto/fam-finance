import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

// Database Provider: "local" | "supabase"
const DATABASE_PROVIDER = process.env.DATABASE_PROVIDER || 'local';

// Select database URL based on provider
const connectionString = DATABASE_PROVIDER === 'supabase' 
  ? process.env.SUPABASE_DATABASE_URL! 
  : process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error(`DATABASE_URL not configured for provider: ${DATABASE_PROVIDER}`);
}

// Configuration based on provider
const isLocal = DATABASE_PROVIDER === 'local';

console.log(`🔌 Database Provider: ${DATABASE_PROVIDER}`);
console.log(`🔌 SSL Mode: ${isLocal ? 'disabled' : 'required'}`);

const client = postgres(connectionString, {
  prepare: false,      // Disable prepared statements
  ssl: isLocal ? false : 'require', // SSL only for Supabase
  max: 10,             // Connection pool
  connect_timeout: 10, // 10 seconds timeout
});

export const db = drizzle(client, { schema });
