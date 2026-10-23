import { query } from '../config/database.js';

export const getFakultas = async () => {
  const result = await query('SELECT * FROM fakultas WHERE is_active = true ORDER BY nama');
  return result.rows;
};

export const getProdi = async (fakultasId = null) => {
  let whereClause = 'WHERE p.is_active = true';
  const params = [];
  
  if (fakultasId) {
    whereClause += ' AND p.fakultas_id = $1';
    params.push(fakultasId);
  }
  
  const result = await query(`
    SELECT p.*, f.nama as fakultas_nama
    FROM prodi p
    JOIN fakultas f ON p.fakultas_id = f.id
    ${whereClause}
    ORDER BY f.nama, p.nama
  `, params);
  
  return result.rows;
};

export const getKategori = async () => {
  const result = await query(`
    SELECT k.*, un.nama as default_unit_nama
    FROM kategori_pengaduan k
    LEFT JOIN kategori_unit_mapping kum ON k.id = kum.kategori_id AND kum.is_default = true
    LEFT JOIN unit_penanganan un ON kum.unit_id = un.id
    WHERE k.is_active = true
    ORDER BY k.nama
  `);
  return result.rows;
};

export const getUnitPenanganan = async () => {
  const result = await query('SELECT * FROM unit_penanganan WHERE is_active = true ORDER BY nama');
  return result.rows;
};

export const getKategoriUnitMapping = async () => {
  const result = await query(`
    SELECT kum.*, k.nama as kategori_nama, un.nama as unit_nama
    FROM kategori_unit_mapping kum
    JOIN kategori_pengaduan k ON kum.kategori_id = k.id
    JOIN unit_penanganan un ON kum.unit_id = un.id
    ORDER BY k.nama
  `);
  return result.rows;
};

export const getFAQ = async (kategoriId = null) => {
  let whereClause = 'WHERE f.is_active = true';
  const params = [];
  
  if (kategoriId) {
    whereClause += ' AND f.kategori_id = $1';
    params.push(kategoriId);
  }
  
  const result = await query(`
    SELECT f.*, k.nama as kategori_nama
    FROM faq f
    LEFT JOIN kategori_pengaduan k ON f.kategori_id = k.id
    ${whereClause}
    ORDER BY f.sort_order, f.view_count DESC
  `, params);
  
  return result.rows;
};

export const incrementFAQView = async (id) => {
  await query('UPDATE faq SET view_count = view_count + 1 WHERE id = $1', [id]);
};

export const getSettings = async (publicOnly = false) => {
  let whereClause = publicOnly ? 'WHERE is_public = true' : '';
  
  const result = await query(`SELECT * FROM system_settings ${whereClause} ORDER BY key`);
  return result.rows;
};

export const getSetting = async (key) => {
  const result = await query('SELECT * FROM system_settings WHERE key = $1', [key]);
  return result.rows[0];
};

export const updateSetting = async (key, value, userId) => {
  const result = await query(`
    UPDATE system_settings 
    SET value = $1, updated_by = $2, updated_at = NOW()
    WHERE key = $3
    RETURNING *
  `, [JSON.stringify(value), userId, key]);
  return result.rows[0];
};

export const getSystemInfo = async () => {
  const settings = await getSettings(true);
  return settings.reduce((acc, s) => {
    try {
      acc[s.key] = JSON.parse(s.value);
    } catch {
      acc[s.key] = s.value;
    }
    return acc;
  }, {});
};