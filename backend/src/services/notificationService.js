import { query } from '../config/database.js';

export const getNotifications = async (userId, { page = 1, limit = 20, is_read }) => {
  let whereClause = 'WHERE n.user_id = $1';
  const params = [userId];
  let paramCount = 2;
  
  // Only add is_read filter if explicitly true or false (not null/undefined)
  if (is_read === true || is_read === false) {
    whereClause += ` AND n.is_read = $${paramCount++}`;
    params.push(is_read);
  }
  
  const countResult = await query(
    `SELECT COUNT(*) FROM notifications n ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);
  
  const offset = (page - 1) * limit;
  
  const result = await query(`
    SELECT n.*, p.kode_pengaduan, p.judul as pengaduan_judul
    FROM notifications n
    LEFT JOIN pengaduan p ON n.pengaduan_id = p.id
    ${whereClause}
    ORDER BY n.created_at DESC
    LIMIT $${paramCount++} OFFSET $${paramCount++}
  `, [...params, limit, offset]);
  
  const unreadResult = await query(
    'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
    [userId]
  );
  
  return {
    items: result.rows,
    pagination: {
      current_page: page,
      per_page: limit,
      total,
      total_pages: Math.ceil(total / limit),
      has_next: page < Math.ceil(total / limit)
    },
    unread_count: parseInt(unreadResult.rows[0].count)
  };
};

export const markAsRead = async (notificationId, userId) => {
  const result = await query(`
    UPDATE notifications SET is_read = true, read_at = NOW()
    WHERE id = $1 AND user_id = $2
    RETURNING id
  `, [notificationId, userId]);
  
  return result.rows.length > 0;
};

export const markAllAsRead = async (userId) => {
  await query(
    'UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false',
    [userId]
  );
  return true;
};

export const getPreferences = async (userId) => {
  const result = await query(
    'SELECT * FROM notification_preferences WHERE user_id = $1',
    [userId]
  );
  
  // If no preferences exist, create defaults
  if (result.rows.length === 0) {
    const defaultPrefs = [
      { user_id: userId, channel: 'email', notification_type: 'status_berubah', is_enabled: true },
      { user_id: userId, channel: 'email', notification_type: 'chat_baru', is_enabled: true },
      { user_id: userId, channel: 'email', notification_type: 'pengaduan_baru', is_enabled: true },
      { user_id: userId, channel: 'push', notification_type: 'status_berubah', is_enabled: true },
      { user_id: userId, channel: 'push', notification_type: 'chat_baru', is_enabled: true },
    ];
    
    for (const pref of defaultPrefs) {
      await query(`
        INSERT INTO notification_preferences (user_id, channel, notification_type, is_enabled)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, channel, notification_type) DO NOTHING
      `, [pref.user_id, pref.channel, pref.notification_type, pref.is_enabled]);
    }
    
    return defaultPrefs;
  }
  
  return result.rows;
};

export const updatePreferences = async (userId, preferences) => {
  for (const pref of preferences) {
    await query(`
      INSERT INTO notification_preferences (user_id, channel, notification_type, is_enabled)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, channel, notification_type) 
      DO UPDATE SET is_enabled = $4, updated_at = NOW()
    `, [userId, pref.channel, pref.notification_type, pref.is_enabled]);
  }
  
  return getPreferences(userId);
};

export const createNotification = async (userId, pengaduanId, type, title, message, actionUrl = null) => {
  const result = await query(`
    INSERT INTO notifications (user_id, pengaduan_id, type, title, message, action_url)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [userId, pengaduanId, type, title, message, actionUrl]);
  
  return result.rows[0];
};

export const deleteNotification = async (notificationId, userId) => {
  const result = await query(
    'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
    [notificationId, userId]
  );
  
  return result.rows.length > 0;
};