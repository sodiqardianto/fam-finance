import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function test() {
  try {
    console.log("Testing connection...");
    const result = await db.execute(sql`SELECT 1 as connected`);
    console.log("Connection result:", result);

    console.log("Checking tables...");
    const tables = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
    console.log("Tables in public schema:", tables);
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    process.exit();
  }
}

test();
