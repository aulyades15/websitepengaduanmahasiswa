// ==========================================================================
// Public (unauthenticated) data for the landing page.
// Deliberately exposes aggregates and a safe, identity-free pengaduan list.
// ==========================================================================
import { query } from '../config/database.js';

export const getPublicStats = async () => {
  const statsResult = await query(`
    SELECT status, COUNT(*)::int AS count
    FROM pengaduan
    GROUP BY status
  `);

  const counts = { menunggu: 0, diproses: 0, selesai: 0, ditolak: 0, tertunda: 0 };
  statsResult.rows.forEach((row) => {
    if (row.status in counts) counts[row.status] = row.count;
  });

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const ratingResult = await query(`
    SELECT AVG(rating) AS avg_rating, COUNT(rating)::int AS rating_count
    FROM pengaduan
    WHERE rating IS NOT NULL
  `);
  const rating = ratingResult.rows[0] || {};

  return {
    total_pengaduan: total,
    menunggu: counts.menunggu,
    diproses: counts.diproses,
    selesai: counts.selesai,
    ditolak: counts.ditolak,
    tertunda: counts.tertunda,
    completion_rate: total ? Math.round((counts.selesai / total) * 1000) / 10 : 0,
    avg_rating: rating.avg_rating ? Math.round(parseFloat(rating.avg_rating) * 10) / 10 : null,
    rating_count: rating.rating_count || 0,
  };
};

/**
 * Recent pengaduan for the public landing page.
 * NOTE: never selects user identity (nim / nama) — public sees anonymous data.
 */
export const getPublicPengaduan = async ({ search = '', limit = 8 } = {}) => {
  const safeLimit = Math.min(Math.max(parseInt(limit) || 8, 1), 20);
  const params = [];
  let where = '';

  if (search && String(search).trim()) {
    params.push(`%${String(search).trim()}%`);
    where = 'WHERE (p.judul ILIKE $1 OR p.kode_pengaduan ILIKE $1)';
  }
  params.push(safeLimit);

  const result = await query(`
    SELECT
      p.id,
      p.kode_pengaduan,
      p.judul,
      p.status,
      p.created_at,
      p.rating,
      k.nama AS kategori_nama,
      k.icon AS kategori_icon,
      un.nama AS unit_nama
    FROM pengaduan p
    JOIN kategori_pengaduan k ON p.kategori_id = k.id
    LEFT JOIN unit_penanganan un ON p.unit_id = un.id
    ${where}
    ORDER BY p.created_at DESC
    LIMIT $${params.length}
  `, params);

  return result.rows;
};
