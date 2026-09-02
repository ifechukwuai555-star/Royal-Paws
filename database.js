import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL is not configured.');
}

const pool = new Pool({
  connectionString,
  ssl: connectionString
    ? { rejectUnauthorized: false }
    : undefined,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error);
});

export default pool;
