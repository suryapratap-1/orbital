import 'server-only';
import { Pool } from 'pg';

const globalForPg = globalThis as unknown as { __orbitalPool?: Pool };

export function getPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured');
  globalForPg.__orbitalPool ??= new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 4_000 });
  return globalForPg.__orbitalPool;
}
