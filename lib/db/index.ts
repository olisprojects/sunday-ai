import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;
let _db: DbInstance | undefined;

export function getDb(): DbInstance {
  if (!_db) {
    _db = drizzle(neon(process.env.DATABASE_URL!), { schema });
  }
  return _db;
}
