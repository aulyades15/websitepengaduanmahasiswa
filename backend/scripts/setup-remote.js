// ============================================================
// Setup-remote: buat meja (tabel) + data awal pada DATABASE_URL.
// Bypass guard `file://` isi initDb/seedData yang tak cocok
// di Windows (argv[1] pakai backslash, import.meta.url forward-slash).
//
// Pemakaian:
//   DATABASE_URL=postgresql://... node scripts/setup-remote.js
// ============================================================
import { initDatabase } from '../src/config/initDb.js';
import { seedDatabase } from '../src/config/seedData.js';
import { closePool } from '../src/config/database.js';

try {
  await initDatabase();
  await seedDatabase();
  console.log('🚀 Remote database siap (schema + seed).');
} catch (err) {
  console.error('💥 Setup gagal:', err.message);
  process.exitCode = 1;
} finally {
  await closePool();
}
