import { query, getClient } from '../config/database.js';
import { createAndSendNotification } from './notificationSender.js';

export const createPengaduan = async (userId, data) => {
  const { judul, deskripsi, kategori_id, lokasi, is_anonim } = data;
  
  // Lookup kategori for SLA deadline + auto-urgent (Bullying → urgent)
  const katResult = await query(
    'SELECT nama, sla_hours FROM kategori_pengaduan WHERE id = $1',
    [kategori_id]
  );
  const kategori = katResult.rows[0];
  const slaHours = kategori?.sla_hours || 48;
  const isUrgent = (kategori?.nama || '').trim().toLowerCase() === 'bullying';
  
  const result = await query(`
    INSERT INTO pengaduan (user_id, judul, deskripsi, kategori_id, lokasi, is_anonim, status, is_urgent, urgency_level, sla_deadline)
    VALUES ($1, $2, $3, $4, $5, $6, 'menunggu', $7, $8, NOW() + make_interval(hours => $9::int))
    RETURNING *
  `, [userId, judul, deskripsi, kategori_id, lokasi, is_anonim, isUrgent, isUrgent ? 'critical' : 'normal', slaHours]);
  
  const pengaduan = result.rows[0];
  
  // Get default unit for category
  const unitResult = await query(
    'SELECT unit_id FROM kategori_unit_mapping WHERE kategori_id = $1 AND is_default = true',
    [kategori_id]
  );
  
  if (unitResult.rows.length > 0) {
    await query(
      'UPDATE pengaduan SET unit_id = $1 WHERE id = $2',
      [unitResult.rows[0].unit_id, pengaduan.id]
    );
    pengaduan.unit_id = unitResult.rows[0].unit_id;
  }
  
  // Create status history
  await query(`
    INSERT INTO status_history (pengaduan_id, status_from, status_to, changed_by, notes)
    VALUES ($1, NULL, 'menunggu', $2, 'Pengaduan diterima')
  `, [pengaduan.id, userId]);
  
  // Create notification for admins (in-app + email + WA)
  const admins = await query("SELECT id, nama, email, phone FROM users WHERE role IN ('admin', 'pimpinan') AND is_active = true");
  for (const admin of admins.rows) {
    await createAndSendNotification({
      userId: admin.id,
      pengaduanId: pengaduan.id,
      type: 'pengaduan_baru',
      title: 'Pengaduan Baru',
      message: `Pengaduan baru: ${judul}`,
      actionUrl: `/pengaduan/${pengaduan.id}`,
      pengaduanCode: pengaduan.kode_pengaduan,
    });
  }
  
  return pengaduan;
};

export const getPengaduanList = async (filters = {}, user = null) => {
  const { page = 1, limit = 20, status, kategori_id, is_urgent, is_overdue, search, date_from, date_to, sort = 'created_at', order = 'desc' } = filters;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramCount = 1;
  
  // Role-based filtering
  if (user && user.role === 'mahasiswa') {
    whereClause += ` AND p.user_id = $${paramCount++}`;
    params.push(user.id);
  } else if (user && user.role === 'unit') {
    whereClause += ` AND p.unit_id = $${paramCount++}`;
    params.push(user.id);
  }
  // Admin and pimpinan can see all
  
  if (status) {
    whereClause += ` AND p.status = $${paramCount++}`;
    params.push(status);
  }
  
  if (kategori_id) {
    whereClause += ` AND p.kategori_id = $${paramCount++}`;
    params.push(kategori_id);
  }
  
  if (is_urgent !== undefined) {
    whereClause += ` AND p.is_urgent = $${paramCount++}`;
    params.push(is_urgent);
  }
  
  if (is_overdue) {
    whereClause += ` AND p.status IN ('menunggu', 'diproses') AND p.sla_deadline < NOW()`;
  }
  
  if (search) {
    whereClause += ` AND (p.kode_pengaduan ILIKE $${paramCount} OR p.judul ILIKE $${paramCount} OR u.nama ILIKE $${paramCount} OR u.nim ILIKE $${paramCount})`;
    params.push(`%${search}%`);
    paramCount++;
  }
  
  if (date_from) {
    whereClause += ` AND p.created_at >= $${paramCount++}`;
    params.push(date_from);
  }
  
  if (date_to) {
    whereClause += ` AND p.created_at <= $${paramCount++}`;
    params.push(date_to);
  }
  
  // Count total
  const countResult = await query(`
    SELECT COUNT(*) FROM pengaduan p
    JOIN users u ON p.user_id = u.id
    ${whereClause}
  `, params);
  
  const total = parseInt(countResult.rows[0].count);
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  
  // Get data
  const validSortColumns = ['created_at', 'updated_at', 'judul', 'status', 'sla_deadline'];
  const sortColumn = validSortColumns.includes(sort) ? sort : 'created_at';
  const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  
  const dataResult = await query(`
    SELECT 
      p.*, 
      k.nama as kategori_nama, k.icon as kategori_icon,
      un.nama as unit_nama,
      u.nim, u.nama as pelapor_nama,
      EXTRACT(EPOCH FROM (p.sla_deadline - NOW()))/3600 as hours_until_deadline,
      CASE 
        WHEN p.status IN ('selesai', 'ditolak') THEN false
        WHEN p.sla_deadline < NOW() THEN true
        ELSE false
      END as is_overdue_calc,
      (SELECT COUNT(*) FROM chat_messages WHERE pengaduan_id = p.id) as chat_count
    FROM pengaduan p
    JOIN users u ON p.user_id = u.id
    JOIN kategori_pengaduan k ON p.kategori_id = k.id
    LEFT JOIN unit_penanganan un ON p.unit_id = un.id
    ${whereClause}
    ORDER BY p.${sortColumn} ${sortOrder}
    LIMIT $${paramCount++} OFFSET $${paramCount++}
  `, [...params, limit, offset]);
  
  return {
    items: dataResult.rows,
    pagination: {
      current_page: page,
      per_page: limit,
      total,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1
    }
  };
};

export const getPengaduanById = async (id, user = null) => {
  let whereClause = 'WHERE p.id = $1';
  const params = [id];
  
  if (user && user.role === 'mahasiswa') {
    whereClause += ' AND p.user_id = $2';
    params.push(user.id);
  }
  
  const result = await query(`
    SELECT 
      p.*, 
      k.nama as kategori_nama, k.icon as kategori_icon, k.sla_hours,
      un.nama as unit_nama, un.email as unit_email, un.pic_name as unit_pic,
      u.nim, u.nama as pelapor_nama, u.email as pelapor_email, u.phone as pelapor_phone,
      pr.nama as prodi_nama,
      EXTRACT(EPOCH FROM (p.sla_deadline - NOW()))/3600 as hours_until_deadline,
      CASE 
        WHEN p.status IN ('selesai', 'ditolak') THEN false
        WHEN p.sla_deadline < NOW() THEN true
        ELSE false
      END as is_overdue_calc
    FROM pengaduan p
    JOIN users u ON p.user_id = u.id
    JOIN kategori_pengaduan k ON p.kategori_id = k.id
    LEFT JOIN unit_penanganan un ON p.unit_id = un.id
    LEFT JOIN prodi pr ON u.prodi_id = pr.id
    ${whereClause}
  `, params);
  
  if (result.rows.length === 0) return null;
  
  const pengaduan = result.rows[0];
  
  // Get attachments
  const attachments = await query(
    'SELECT * FROM lampiran WHERE pengaduan_id = $1 ORDER BY uploaded_at',
    [id]
  );
  pengaduan.attachments = attachments.rows;
  
  // Get status history
  const history = await query(`
    SELECT sh.*, u.nama as changed_by_name
    FROM status_history sh
    LEFT JOIN users u ON sh.changed_by = u.id
    WHERE sh.pengaduan_id = $1
    ORDER BY sh.created_at
  `, [id]);
  pengaduan.status_history = history.rows;
  
  return pengaduan;
};

export const updatePengaduan = async (id, userId, data) => {
  const { judul, deskripsi, kategori_id, lokasi } = data;
  
  const fields = [];
  const values = [id, userId];
  let paramCount = 3;
  
  if (judul) { fields.push(`judul = $${paramCount++}`); values.push(judul); }
  if (deskripsi) { fields.push(`deskripsi = $${paramCount++}`); values.push(deskripsi); }
  if (kategori_id) { fields.push(`kategori_id = $${paramCount++}`); values.push(kategori_id); }
  if (lokasi !== undefined) { fields.push(`lokasi = $${paramCount++}`); values.push(lokasi); }
  
  if (fields.length === 0) return null;
  
  fields.push(`updated_at = NOW()`);
  
  const result = await query(`
    UPDATE pengaduan SET ${fields.join(', ')} 
    WHERE id = $1 AND user_id = $2 AND status = 'menunggu'
    RETURNING *
  `, values);
  
  return result.rows[0];
};

export const updateStatus = async (id, adminId, data) => {
  const { status, unit_id, notes } = data;
  
  // Use a dedicated client for the transaction
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Get current status
    const current = await client.query('SELECT status, unit_id FROM pengaduan WHERE id = $1', [id]);
    if (current.rows.length === 0) throw new Error('Pengaduan tidak ditemukan');
    
    const oldStatus = current.rows[0].status;
    const oldUnit = current.rows[0].unit_id;
    
    if (oldStatus === 'selesai' || oldStatus === 'ditolak') {
      throw new Error('Tidak bisa mengubah status pengaduan yang sudah selesai/ditolak');
    }
    
    // Build update query properly
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    fields.push(`status = $${paramCount++}`);
    values.push(status);
    
    fields.push(`updated_at = NOW()`);
    
    if (unit_id) { 
      fields.push(`unit_id = $${paramCount++}`); 
      values.push(unit_id); 
    }
    if (status === 'diproses' && !oldUnit) {
      fields.push(`assigned_at = NOW()`);
    }
    if (status === 'selesai') {
      fields.push(`resolved_at = NOW()`);
      fields.push(`resolved_by = $${paramCount++}`);
      values.push(adminId);
    }
    if (status === 'ditolak') {
      fields.push(`rejected_at = NOW()`);
      fields.push(`rejected_by = $${paramCount++}`);
      values.push(adminId);
      fields.push(`rejection_reason = $${paramCount++}`);
      values.push(notes);
    }
    
    const setClause = fields.join(', ');
    // id is the last parameter
    values.push(id);
    await client.query(`
      UPDATE pengaduan SET ${setClause} WHERE id = $${paramCount}
    `, values);
    
    // Log status history
    await client.query(`
      INSERT INTO status_history (pengaduan_id, status_from, status_to, changed_by, notes)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, oldStatus, status, adminId, notes || `Status diubah menjadi ${status}`]);
    
    // Create notification (in-app + email + WA)
    const pengaduanResult = await client.query('SELECT judul, user_id, is_anonim, kode_pengaduan FROM pengaduan WHERE id = $1', [id]);
    const p = pengaduanResult.rows[0];
    
    if (p.user_id) {
      await createAndSendNotification({
        userId: p.user_id,
        pengaduanId: id,
        type: 'status_berubah',
        title: 'Status Pengaduan Berubah',
        message: `Pengaduan ${p.kode_pengaduan || id} telah diubah menjadi '${status}'`,
        actionUrl: `/pengaduan/${id}`,
        pengaduanCode: p.kode_pengaduan,
      });
    }
    
    await client.query('COMMIT');
    const result = await getPengaduanById(id);
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const verifyPengaduan = async (id, adminId, unitId, notes) => {
  return updateStatus(id, adminId, { status: 'diproses', unit_id: unitId, notes });
};

export const rejectPengaduan = async (id, adminId, reason) => {
  return updateStatus(id, adminId, { status: 'ditolak', notes: reason });
};

export const resolvePengaduan = async (id, adminId, resolutionNote) => {
  return updateStatus(id, adminId, { status: 'selesai', notes: resolutionNote });
};

export const ratePengaduan = async (id, userId, rating, feedback) => {
  const result = await query(`
    UPDATE pengaduan SET rating = $1, feedback = $2, rated_at = NOW(), updated_at = NOW()
    WHERE id = $1 AND user_id = $2 AND status = 'selesai' AND rating IS NULL
    RETURNING *
  `, [rating, feedback, id, userId]);
  
  if (result.rows.length === 0) {
    throw new Error('Tidak bisa memberi rating pada pengaduan ini');
  }
  
  return result.rows[0];
};

export const deletePengaduan = async (id, userId, isAdmin = false) => {
  let whereClause = 'WHERE id = $1';
  const params = [id];
  
  if (!isAdmin) {
    whereClause += ' AND user_id = $2 AND status = \'menunggu\'';
    params.push(userId);
  }
  
  const result = await query(`DELETE FROM pengaduan ${whereClause} RETURNING id`, params);
  return result.rows.length > 0;
};

export const getPengaduanStats = async (user = null) => {
  let whereClause = '';
  const params = [];
  
  if (user && user.role === 'mahasiswa') {
    whereClause = 'WHERE user_id = $1';
    params.push(user.id);
  } else if (user && user.role === 'unit') {
    whereClause = 'WHERE unit_id = $1';
    params.push(user.id);
  }
  
  const result = await query(`
    SELECT 
      status,
      COUNT(*) as count
    FROM pengaduan
    ${whereClause}
    GROUP BY status
  `, params);
  
  const stats = { menunggu: 0, diproses: 0, selesai: 0, ditolak: 0, tertunda: 0 };
  result.rows.forEach(row => {
    stats[row.status] = parseInt(row.count);
  });
  
  // Get urgent count
  const urgentResult = await query(`
    SELECT COUNT(*) FROM pengaduan 
    ${whereClause ? whereClause + ' AND' : 'WHERE'} is_urgent = true AND status IN ('menunggu', 'diproses')
  `, params);
  stats.urgent = parseInt(urgentResult.rows[0].count);
  
  // Get overdue count
  const overdueResult = await query(`
    SELECT COUNT(*) FROM pengaduan 
    ${whereClause ? whereClause + ' AND' : 'WHERE'} status IN ('menunggu', 'diproses') AND sla_deadline < NOW()
  `, params);
  stats.overdue = parseInt(overdueResult.rows[0].count);
  
  return stats;
};