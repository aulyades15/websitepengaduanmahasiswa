import { query } from '../config/database.js';

export const getDashboardStats = async (user = null) => {
  let whereClause = '';
  const params = [];
  
  if (user && user.role === 'mahasiswa') {
    whereClause = 'WHERE user_id = $1';
    params.push(user.id);
  } else if (user && user.role === 'unit') {
    whereClause = 'WHERE unit_id = $1';
    params.push(user.id);
  }
  
  const statsResult = await query(`
    SELECT 
      status,
      COUNT(*) as count
    FROM pengaduan
    ${whereClause}
    GROUP BY status
  `, params);
  
  const stats = { menunggu: 0, diproses: 0, selesai: 0, ditolak: 0, tertunda: 0 };
  statsResult.rows.forEach(row => {
    stats[row.status] = parseInt(row.count);
  });
  
  // Urgent & Overdue
  const urgentWhere = whereClause ? `${whereClause} AND` : 'WHERE';
  const urgentResult = await query(`
    SELECT COUNT(*) FROM pengaduan ${urgentWhere} is_urgent = true AND status IN ('menunggu', 'diproses')
  `, params);
  
  const overdueResult = await query(`
    SELECT COUNT(*) FROM pengaduan ${urgentWhere} status IN ('menunggu', 'diproses') AND sla_deadline < NOW()
  `, params);
  
  // Average rating
  const ratingResult = await query(`
    SELECT AVG(rating) as avg_rating, COUNT(rating) as rating_count
    FROM pengaduan
    ${whereClause ? whereClause + ' AND' : 'WHERE'} rating IS NOT NULL
  `, params);
  
  return {
    overview: {
      total_pengaduan: Object.values(stats).reduce((a, b) => a + b, 0),
      ...stats,
      urgent_aktif: parseInt(urgentResult.rows[0].count),
      overdue: parseInt(overdueResult.rows[0].count),
      completion_rate: stats.selesai > 0 ? 
        Math.round((stats.selesai / Object.values(stats).reduce((a, b) => a + b, 0)) * 100 * 10) / 10 : 0,
      avg_rating: ratingResult.rows[0].avg_rating ? 
        Math.round(parseFloat(ratingResult.rows[0].avg_rating) * 10) / 10 : null,
      rating_count: parseInt(ratingResult.rows[0].rating_count)
    }
  };
};

export const getPerformanceByUnit = async (dateFrom, dateTo) => {
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramCount = 1;
  
  if (dateFrom) {
    whereClause += ` AND p.created_at >= $${paramCount++}`;
    params.push(dateFrom);
  }
  if (dateTo) {
    whereClause += ` AND p.created_at <= $${paramCount++}`;
    params.push(dateTo);
  }
  
  const result = await query(`
    SELECT 
      un.id as unit_id,
      un.nama as unit_nama,
      COUNT(p.id) as total_pengaduan,
      COUNT(p.id) FILTER (WHERE p.status = 'selesai') as selesai,
      COUNT(p.id) FILTER (WHERE p.status = 'ditolak') as ditolak,
      COUNT(p.id) FILTER (WHERE p.status IN ('menunggu', 'diproses') AND p.sla_deadline < NOW()) as overdue,
      COUNT(p.id) FILTER (WHERE p.is_urgent) as urgent,
      AVG(EXTRACT(EPOCH FROM (p.resolved_at - p.created_at))/3600) as avg_resolution_hours,
      AVG(p.rating) as avg_rating
    FROM pengaduan p
    LEFT JOIN unit_penanganan un ON p.unit_id = un.id
    ${whereClause}
    GROUP BY un.id, un.nama
    ORDER BY total_pengaduan DESC
  `, params);
  
  return result.rows.map(row => ({
    unit: { id: row.unit_id, nama: row.unit_nama },
    metrics: {
      total_pengaduan: parseInt(row.total_pengaduan),
      selesai: parseInt(row.selesai),
      ditolak: parseInt(row.ditolak),
      completion_rate: row.total_pengaduan > 0 ? 
        Math.round((row.selesai / row.total_pengaduan) * 100 * 10) / 10 : 0,
      avg_response_hours: row.avg_resolution_hours ? 
        Math.round(parseFloat(row.avg_resolution_hours) * 10) / 10 : null,
      overdue_count: parseInt(row.overdue),
      urgent_count: parseInt(row.urgent),
      avg_rating: row.avg_rating ? Math.round(parseFloat(row.avg_rating) * 10) / 10 : null
    }
  }));
};

export const getTrendAnalysis = async (period = 'daily', months = 6) => {
  const interval = period === 'monthly' ? '1 month' : '1 day';
  const format = period === 'monthly' ? 'YYYY-MM' : 'YYYY-MM-DD';
  
  const result = await query(`
    SELECT 
      TO_CHAR(date_trunc('${period === 'monthly' ? 'month' : 'day'}', created_at), '${format}') as period,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'selesai') as selesai,
      COUNT(*) FILTER (WHERE status = 'ditolak') as ditolak,
      COUNT(*) FILTER (WHERE is_urgent) as urgent
    FROM pengaduan
    WHERE created_at >= NOW() - INTERVAL '${months} ${period === 'monthly' ? 'months' : 'days'}'
    GROUP BY date_trunc('${period === 'monthly' ? 'month' : 'day'}', created_at)
    ORDER BY period
  `);
  
  return {
    labels: result.rows.map(r => r.period),
    datasets: [
      { label: 'Total Pengaduan', data: result.rows.map(r => parseInt(r.total)) },
      { label: 'Selesai', data: result.rows.map(r => parseInt(r.selesai)) },
      { label: 'Ditolak', data: result.rows.map(r => parseInt(r.ditolak)) },
      { label: 'Urgent', data: result.rows.map(r => parseInt(r.urgent)) }
    ]
  };
};

export const getSLAPerformance = async (dateFrom, dateTo) => {
  let whereClause = 'WHERE p.resolved_at IS NOT NULL';
  const params = [];
  let paramCount = 1;
  
  if (dateFrom) {
    whereClause += ` AND p.resolved_at >= $${paramCount++}`;
    params.push(dateFrom);
  }
  if (dateTo) {
    whereClause += ` AND p.resolved_at <= $${paramCount++}`;
    params.push(dateTo);
  }
  
  const overall = await query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE p.resolved_at <= p.sla_deadline) as met_sla,
      COUNT(*) FILTER (WHERE p.resolved_at > p.sla_deadline) as missed_sla,
      AVG(EXTRACT(EPOCH FROM (p.resolved_at - p.created_at))/3600) as avg_resolution_hours
    FROM pengaduan p
    ${whereClause}
  `, params);
  
  const byKategori = await query(`
    SELECT 
      k.nama as kategori,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE p.resolved_at <= p.sla_deadline) as met_sla,
      AVG(EXTRACT(EPOCH FROM (p.resolved_at - p.created_at))/3600) as avg_resolution_hours
    FROM pengaduan p
    JOIN kategori_pengaduan k ON p.kategori_id = k.id
    ${whereClause}
    GROUP BY k.nama
  `, params);
  
  return {
    overall: {
      total_resolved: parseInt(overall.rows[0].total),
      met_sla: parseInt(overall.rows[0].met_sla),
      missed_sla: parseInt(overall.rows[0].missed_sla),
      sla_compliance_rate: overall.rows[0].total > 0 ? 
        Math.round((overall.rows[0].met_sla / overall.rows[0].total) * 100 * 10) / 10 : 100,
      avg_resolution_hours: overall.rows[0].avg_resolution_hours ? 
        Math.round(parseFloat(overall.rows[0].avg_resolution_hours) * 10) / 10 : null
    },
    by_kategori: byKategori.rows.map(row => ({
      kategori: row.kategori,
      total: parseInt(row.total),
      met_sla: parseInt(row.met_sla),
      sla_compliance_rate: row.total > 0 ? 
        Math.round((row.met_sla / row.total) * 100 * 10) / 10 : 100,
      avg_resolution_hours: row.avg_resolution_hours ? 
        Math.round(parseFloat(row.avg_resolution_hours) * 10) / 10 : null
    }))
  };
};

export const getRatingAnalysis = async (dateFrom, dateTo) => {
  let whereClause = 'WHERE p.rating IS NOT NULL';
  const params = [];
  let paramCount = 1;
  
  if (dateFrom) {
    whereClause += ` AND p.rated_at >= $${paramCount++}`;
    params.push(dateFrom);
  }
  if (dateTo) {
    whereClause += ` AND p.rated_at <= $${paramCount++}`;
    params.push(dateTo);
  }
  
  const summary = await query(`
    SELECT 
      AVG(rating) as avg_rating,
      COUNT(*) as total_ratings
    FROM pengaduan p
    ${whereClause}
  `, params);
  
  const distribution = await query(`
    SELECT rating, COUNT(*) as count
    FROM pengaduan p
    ${whereClause}
    GROUP BY rating
    ORDER BY rating
  `, params);
  
  const byKategori = await query(`
    SELECT 
      k.nama as kategori,
      AVG(p.rating) as avg_rating,
      COUNT(*) as total
    FROM pengaduan p
    JOIN kategori_pengaduan k ON p.kategori_id = k.id
    ${whereClause}
    GROUP BY k.nama
  `, params);
  
  return {
    summary: {
      avg_rating: summary.rows[0].avg_rating ? 
        Math.round(parseFloat(summary.rows[0].avg_rating) * 10) / 10 : 0,
      total_ratings: parseInt(summary.rows[0].total_ratings),
      rating_distribution: {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
        ...Object.fromEntries(distribution.rows.map(r => [parseInt(r.rating), parseInt(r.count)]))
      }
    },
    by_kategori: byKategori.rows.map(row => ({
      kategori: row.kategori,
      avg_rating: Math.round(parseFloat(row.avg_rating) * 10) / 10,
      total: parseInt(row.total)
    }))
  };
};

export const exportPengaduan = async (filters = {}, format = 'csv') => {
  const { status, kategori_id, date_from, date_to } = filters;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramCount = 1;
  
  if (status) {
    whereClause += ` AND p.status = $${paramCount++}`;
    params.push(status);
  }
  if (kategori_id) {
    whereClause += ` AND p.kategori_id = $${paramCount++}`;
    params.push(kategori_id);
  }
  if (date_from) {
    whereClause += ` AND p.created_at >= $${paramCount++}`;
    params.push(date_from);
  }
  if (date_to) {
    whereClause += ` AND p.created_at <= $${paramCount++}`;
    params.push(date_to);
  }
  
  const result = await query(`
    SELECT 
      p.kode_pengaduan,
      p.judul,
      k.nama as kategori,
      p.status,
      u.nama as pelapor,
      u.nim,
      un.nama as unit,
      p.is_urgent,
      p.is_anonim,
      p.rating,
      p.created_at,
      p.resolved_at
    FROM pengaduan p
    JOIN users u ON p.user_id = u.id
    JOIN kategori_pengaduan k ON p.kategori_id = k.id
    LEFT JOIN unit_penanganan un ON p.unit_id = un.id
    ${whereClause}
    ORDER BY p.created_at DESC
  `, params);
  
  return result.rows;
};