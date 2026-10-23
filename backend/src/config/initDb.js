import { query } from './database.js';
import fs from 'fs';
import path from 'path';

const initSql = fs.readFileSync(path.resolve('DATABASE_SCHEMA.sql'), 'utf-8');

export const initDatabase = async () => {
  try {
    console.log('🔄 Initializing database...');
    
    // Split by semicolon and execute each statement
    const statements = initSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
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