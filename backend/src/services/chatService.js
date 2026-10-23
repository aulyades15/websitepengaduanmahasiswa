import { query } from '../config/database.js';
import { createAndSendNotification } from './notificationSender.js';

export const sendMessage = async (pengaduanId, senderId, senderRole, message, isInternal = false) => {
  // Check if pengaduan exists and user has access
  const pengaduan = await query(
    'SELECT id, user_id, status FROM pengaduan WHERE id = $1',
    [pengaduanId]
  );
  
  if (pengaduan.rows.length === 0) {
    throw new Error('Pengaduan tidak ditemukan');
  }
  
  const p = pengaduan.rows[0];
  
  // Check access
  if (senderRole === 'mahasiswa' && p.user_id !== senderId) {
    throw new Error('Akses ditolak');
  }
  if (senderRole === 'mahasiswa' && ['selesai', 'ditolak'].includes(p.status)) {
    throw new Error('Tidak bisa mengirim pesan pada pengaduan yang sudah selesai');
  }
  
  // Insert message
  const result = await query(`
    INSERT INTO chat_messages (pengaduan_id, sender_id, sender_role, message, is_internal)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [pengaduanId, senderId, senderRole, message, isInternal]);
  
  const chatMessage = result.rows[0];
  
  // Update pengaduan updated_at
  await query('UPDATE pengaduan SET updated_at = NOW() WHERE id = $1', [pengaduanId]);
  
  // Create notification for recipient (in-app + email + WA)
  if (!isInternal) {
    if (senderRole === 'mahasiswa') {
      // Notify admins of this pengaduan
      const admins = await query("SELECT id, nama, email, phone FROM users WHERE role IN ('admin', 'unit') AND is_active = true");
      for (const admin of admins.rows) {
        await createAndSendNotification({
          userId: admin.id,
          pengaduanId,
          type: 'chat_baru',
          title: 'Pesan Baru',
          message: 'Anda menerima pesan baru',
          actionUrl: `/pengaduan/${pengaduanId}/chat`,
          pengaduanCode: p.kode_pengaduan,
        });
      }
    } else {
      // Notify mahasiswa
      await createAndSendNotification({
        userId: p.user_id,
        pengaduanId,
        type: 'chat_baru',
        title: 'Pesan Baru',
        message: 'Admin membalas pengaduan Anda',
        actionUrl: `/pengaduan/${pengaduanId}/chat`,
        pengaduanCode: p.kode_pengaduan,
      });
    }
  }
  
  return chatMessage;
};

export const getMessages = async (pengaduanId, userId, userRole, page = 1, limit = 50) => {
  // Check access
  const pengaduan = await query(
    'SELECT user_id FROM pengaduan WHERE id = $1',
    [pengaduanId]
  );
  
  if (pengaduan.rows.length === 0) {
    throw new Error('Pengaduan tidak ditemukan');
  }
  
  if (userRole === 'mahasiswa' && pengaduan.rows[0].user_id !== userId) {
    throw new Error('Akses ditolak');
  }
  
  const offset = (page - 1) * limit;
  
  // Build where clause for internal messages
  let whereClause = 'WHERE cm.pengaduan_id = $1';
  const params = [pengaduanId];
  
  if (userRole === 'mahasiswa') {
    whereClause += ' AND cm.is_internal = false';
  }
  
  const countResult = await query(
    `SELECT COUNT(*) FROM chat_messages cm ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);
  
  const result = await query(`
    SELECT cm.*, u.nama as sender_name, u.avatar_url
    FROM chat_messages cm
    LEFT JOIN users u ON cm.sender_id = u.id
    ${whereClause}
    ORDER BY cm.created_at ASC
    LIMIT $2 OFFSET $3
  `, [...params, limit, offset]);
  
  return {
    items: result.rows,
    pagination: {
      current_page: page,
      per_page: limit,
      total,
      total_pages: Math.ceil(total / limit),
      has_next: page < Math.ceil(total / limit)
    }
  };
};

export const markAsRead = async (pengaduanId, userId, userRole) => {
  let whereClause = 'WHERE pengaduan_id = $1 AND is_read = false';
  const params = [pengaduanId];
  
  if (userRole === 'mahasiswa') {
    whereClause += ' AND sender_role != \'mahasiswa\'';
  } else {
    whereClause += ' AND sender_role = \'mahasiswa\'';
  }
  
  await query(`
    UPDATE chat_messages SET is_read = true, read_at = NOW()
    ${whereClause}
  `, params);
  
  return true;
};

export const getUnreadCount = async (userId, userRole) => {
  let whereClause = '';
  
  if (userRole === 'mahasiswa') {
    whereClause = `
      WHERE cm.is_read = false 
      AND cm.sender_role != 'mahasiswa'
      AND cm.pengaduan_id IN (SELECT id FROM pengaduan WHERE user_id = $1)
    `;
  } else {
    whereClause = `
      WHERE cm.is_read = false 
      AND cm.sender_role = 'mahasiswa'
      AND cm.pengaduan_id IN (SELECT id FROM pengaduan WHERE unit_id = $1 OR $1 IS NULL)
    `;
  }
  
  const result = await query(`
    SELECT COUNT(*) FROM chat_messages cm ${whereClause}
  `, [userId]);
  
  return parseInt(result.rows[0].count);
};

export const getTemplates = async (kategoriId = null) => {
  let whereClause = 'WHERE is_active = true';
  const params = [];
  
  if (kategoriId) {
    whereClause += ' AND (kategori_id = $1 OR kategori_id IS NULL)';
    params.push(kategoriId);
  }
  
  const result = await query(`
    SELECT * FROM message_templates ${whereClause} ORDER BY usage_count DESC
  `, params);
  
  return result.rows;
};

export const createTemplate = async (userId, data) => {
  const { title, content, kategori_id } = data;
  
  const result = await query(`
    INSERT INTO message_templates (user_id, title, content, kategori_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [userId, title, content, kategori_id]);
  
  return result.rows[0];
};

export const updateTemplate = async (id, userId, data) => {
  const { title, content, kategori_id, is_active } = data;
  
  const result = await query(`
    UPDATE message_templates 
    SET title = $1, content = $2, kategori_id = $3, is_active = $4
    WHERE id = $5 AND user_id = $6
    RETURNING *
  `, [title, content, kategori_id, is_active, id, userId]);
  
  return result.rows[0];
};

export const deleteTemplate = async (id, userId) => {
  const result = await query(
    'DELETE FROM message_templates WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  
  return result.rows.length > 0;
};