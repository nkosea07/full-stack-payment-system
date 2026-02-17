import { Pool, PoolClient } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      console.error('Please set up your PostgreSQL database and configure DATABASE_URL');
      console.error('See ENV-EXAMPLE.md for configuration details');
      throw new Error('DATABASE_URL is required');
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  return pool;
}

// Helper function to execute queries with proper error handling
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const start = Date.now();
  try {
    const res = await getPool().query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 80), duration, rows: res.rowCount });
    return {
      rows: res.rows,
      rowCount: res.rowCount || 0
    };
  } catch (error) {
    console.error('Database query error', { text: text.substring(0, 80), error });
    throw error;
  }
}

// Helper function to get a single client for transactions
export async function getClient(): Promise<PoolClient> {
  return getPool().connect();
}

// Initialize database tables and seed data
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');

    const fs = require('fs');
    const path = require('path');

    const schemaPath = path.join(process.cwd(), 'lib/db/schema.sql');
    const seedPath = path.join(process.cwd(), 'lib/db/seed.sql');

    let schemaSQL, seedSQL;

    try {
      schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    } catch (error) {
      console.error('Failed to read schema file:', error);
      throw new Error(`Schema file not found at ${schemaPath}`);
    }

    try {
      seedSQL = fs.readFileSync(seedPath, 'utf8');
    } catch (error) {
      console.error('Failed to read seed file:', error);
      throw new Error(`Seed file not found at ${seedPath}`);
    }

    console.log('Executing schema...');
    await query(schemaSQL);
    console.log('Database schema created successfully');

    console.log('Executing seed data...');
    await query(seedSQL);
    console.log('Database seeded successfully');

  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// Test database connection
export async function testConnection() {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('Database connected successfully:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Close all connections
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connection pool closed');
  }
}

export default getPool;
