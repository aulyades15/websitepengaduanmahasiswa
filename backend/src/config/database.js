import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

dotenv.config();

// ─────────────────────────────────────────────────────────────
// Dukungan DATABASE_URL (Vercel Postgres / Neon / Railway).
// Kalau DATABASE_URL diset → pakai itu, plus SSL otomatis untuk host remote.
// Kalau tidak → fallback ke DB_HOST/DB_USER/... (development lokal).
// ─────────────────────────────────────────────────────────────
const isRemote = (host) => !['localhost', '127.0.0.1', '::1'].includes(host);

const poolOptions = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: isRemote(new URL(process.env.DATABASE_URL).hostname)
        ? { rejectUnauthorized: false }
        : undefined,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'pengaduan_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

const pool = new Pool(poolOptions);


pool.on('connect', () => {
  console.log('✅ Database connected');
});

pool.on('error', (err) => {
  console.error('❌ Database error:', err);
});

export const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Query executed', { text: text.substring(0, 100), duration, rows: res.rowCount });
  }
  return res;
};

export const getClient = () => pool.connect();

export const closePool = () => pool.end();

export default pool;