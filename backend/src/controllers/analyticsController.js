import { 
  getDashboardStats, 
  getPerformanceByUnit, 
  getTrendAnalysis, 
  getSLAPerformance, 
  getRatingAnalysis, 
  exportPengaduan 
} from '../services/analyticsService.js';

export const getDashboardStatsController = async (req, res) => {
  try {
    const stats = await getDashboardStats(req.user);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: error.message }
    });
  }
};

export const getPerformanceByUnitController = async (req, res) => {
  try {
    // Only admin and pimpinan
    if (!['admin', 'pimpinan'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Akses ditolak' }
      });
    }
    
    const { date_from, date_to } = req.query;
    const data = await getPerformanceByUnit(date_from, date_to);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: error.message }
    });
  }
};

export const getTrendAnalysisController = async (req, res) => {
  try {
    if (!['admin', 'pimpinan'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Akses ditolak' }
      });
    }
    
    const period = req.query.period || 'daily';
    const months = parseInt(req.query.months) || 6;
    
    const data = await getTrendAnalysis(period, months);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: error.message }
    });
  }
};

export const getSLAPerformanceController = async (req, res) => {
  try {
    if (!['admin', 'pimpinan'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Akses ditolak' }
      });
    }
    
    const { date_from, date_to } = req.query;
    const data = await getSLAPerformance(date_from, date_to);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: error.message }
    });
  }
};

export const getRatingAnalysisController = async (req, res) => {
  try {
    if (!['admin', 'pimpinan'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Akses ditolak' }
      });
    }
    
    const { date_from, date_to } = req.query;
    const data = await getRatingAnalysis(date_from, date_to);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: error.message }
    });
  }
};

export const exportPengaduanController = async (req, res) => {
  try {
    if (!['admin', 'pimpinan'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Akses ditolak' }
      });
    }
    
    const { format = 'csv', ...filters } = req.query;
    const data = await exportPengaduan(filters, format);
    
    if (format === 'csv') {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="pengaduan-export-${Date.now()}.csv"`);
      return res.send(csv);
    }
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'EXPORT_FAILED', message: error.message }
    });
  }
};

function convertToCSV(data) {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') return JSON.stringify(val);
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}