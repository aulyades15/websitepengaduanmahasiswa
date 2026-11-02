import { query } from './database.js';
import fs from 'fs';
import path from 'path';

const initSql = fs.readFileSync(path.resolve('DATABASE_SCHEMA.sql'), 'utf-8');

/**
 * Split SQL multi-statement by ';' while respecting:
 * - dollar-quoted blocks ($$ ... $$ atau $tag$ ... $tag$)
 * - single-quoted strings ('...' dengan escape '')
 * - comment '// strip per-line' biasa dihapus setelahnya
 */
export const splitSqlStatements = (sql) => {
  const out = [];
  let cur = '';
  let i = 0;
  let state = null; // null | "'" | same-as-start
  while (i < sql.length) {
    // dollar quote?
    const dq = sql.slice(i).match(/^\$[A-Za-z0-9_]*\$/);
    if (state === null && dq) {
      const tag = dq[0];
      state = tag;
      cur += tag;
      i += tag.length;
      continue;
    }
    if (state && state.startsWith('$')) {
      const close = sql.indexOf(state, i);
      if (close === -1) { cur += sql.slice(i); i = sql.length; break; }
      cur += sql.slice(i, close + state.length);
      i = close + state.length;
      state = null;
      continue;
    }
    const ch = sql[i];
    if (state === "'" ) {
      cur += ch;
      if (ch === "'") {
        if (sql[i + 1] === "'") { cur += sql[i + 1]; i += 2; continue; }
        state = null;
      }
      i++;
      continue;
    }
    if (ch === "'" && state === null) { state = "'"; cur += ch; i++; continue; }
    if (ch === ';' && state === null) {
      const s = cur.replace(/^--.*$/gm, '').trim();
      out.push(s);
      cur = '';
      i++;
      continue;
    }
    cur += ch;
    i++;
  }
  const last = cur.replace(/^--.*$/gm, '').trim();
  if (last) out.push(last);
  return out.filter(s => s.length > 0);
};


export const initDatabase = async () => {
  try {
    console.log('🔄 Initializing database...');

    const statements = splitSqlStatements(initSql);

    
    for (const statement of statements) {
      if (statement.trim()) {
        await query(statement);
      }
    }
    
    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}