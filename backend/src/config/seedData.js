import { query } from './database.js';
import bcrypt from 'bcryptjs';

export const seedDatabase = async () => {
  const client = await query('SELECT 1');
  
  try {
    console.log('🌱 Seeding database...');
    
    // Check if already seeded
    const existing = await query('SELECT COUNT(*) FROM users WHERE role = $1', ['admin']);
    if (parseInt(existing.rows[0].count) > 0) {
      console.log('✅ Database already seeded');
      return;
    }
    
    // Hash passwords
    const adminPass = await bcrypt.hash('admin123', 10);
    const mhsPass = await bcrypt.hash('mahasiswa123', 10);
    
    // Insert admin user
    await query(`
      INSERT INTO users (nim, nama, email, password_hash, role, is_verified, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, ['9999999999', 'Admin Kemahasiswaan', 'admin@uingusdur.ac.id', adminPass, 'admin', true, true]);
    
    // Insert sample mahasiswa
    await query(`
      INSERT INTO users (nim, nama, email, password_hash, role, prodi_id, is_verified, is_active)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8),
        ($9, $10, $11, $12, $13, $14, $15, $16)
    `, [
      '2210511042', 'Rayhan Pratama', 'rayhan@student.uingusdur.ac.id', mhsPass, 'mahasiswa', 1, true, true,
      '2210511015', 'Salsa Nuraini', 'salsa@student.uingusdur.ac.id', mhsPass, 'mahasiswa', 2, true, true
    ]);
    
    // Insert sample complaints
    await query(`
      INSERT INTO pengaduan (kode_pengaduan, user_id, judul, deskripsi, kategori_id, status, is_urgent, is_anonim, unit_id, created_at)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() - INTERVAL '18 days'),
        ($10, $11, $12, $13, $14, $15, $16, $17, $18, NOW() - INTERVAL '9 days'),
        ($19, $20, $21, $22, $23, $24, $25, $26, $27, NOW() - INTERVAL '1.5 days'),
        ($28, $29, $30, $31, $32, $33, $34, $35, $36, NOW() - INTERVAL '1 day')
    `, [
      'PM-2210-0001', 2, 'AC ruang kelas B2.04 mati sejak 2 minggu', 'AC tidak menyala, kelas sangat panas saat kuliah siang.', 2, 'selesai', false, false, 2,
      'PM-2210-0002', 2, 'Nilai UTS belum keluar melewati batas waktu', 'Dosen belum menginput nilai Basis Data padahal sudah 5 minggu.', 1, 'diproses', false, false, 1,
      'PM-2210-0003', 3, 'Perundungan di grup angkatan', 'Beberapa mahasiswa menyebarkan tangkapan layar yang mempermalukan teman.', 5, 'menunggu', true, true, null,
      'PM-2210-0004', 3, 'Keringanan UKT belum diproses', 'Pengajuan sudah 3 bulan tanpa kabar.', 3, 'menunggu', false, false, null
    ]);
    
    // Insert status history
    await query(`
      INSERT INTO status_history (pengaduan_id, status_from, status_to, changed_by, notes)
      VALUES 
        (1, NULL, 'menunggu', 2, 'Pengaduan diterima'),
        (1, 'menunggu', 'diproses', 1, 'Diverifikasi admin'),
        (1, 'diproses', 'selesai', 1, 'Selesai ditangani'),
        (2, NULL, 'menunggu', 2, 'Pengaduan diterima'),
        (2, 'menunggu', 'diproses', 1, 'Diverifikasi admin'),
        (3, NULL, 'menunggu', 3, 'Pengaduan diterima (anonim)'),
        (4, NULL, 'menunggu', 3, 'Pengaduan diterima')
    `);
    
    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}