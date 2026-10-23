import { 
  createPengaduan, 
  getPengaduanList, 
  getPengaduanById, 
  updatePengaduan, 
  updateStatus, 
  verifyPengaduan, 
  rejectPengaduan, 
  resolvePengaduan, 
  ratePengaduan, 
  deletePengaduan, 
  getPengaduanStats 
} from '../services/pengaduanService.js';

export const createPengaduanController = async (req, res) => {
  try {
    const pengaduan = await createPengaduan(req.user.id, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Pengaduan berhasil dikirim',
      data: pengaduan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'CREATE_FAILED', message: error.message }
    });
  }
};

export const getPengaduanListController = async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status,
      kategori_id: req.query.kategori_id ? parseInt(req.query.kategori_id) : undefined,
      is_urgent: req.query.is_urgent === 'true' ? true : req.query.is_urgent === 'false' ? false : undefined,
      is_overdue: req.query.is_overdue === 'true' ? true : req.query.is_overdue === 'false' ? false : undefined,
      search: req.query.search,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      sort: req.query.sort || 'created_at',
      order: req.query.order || 'desc'
    };
    
    const result = await getPengaduanList(filters, req.user);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: error.message }
    });
  }
};

export const getPengaduanByIdController = async (req, res) => {
  try {
    const pengaduan = await getPengaduanById(req.params.id, req.user);
    
    if (!pengaduan) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Pengaduan tidak ditemukan' }
      });
    }
    
    res.json({
      success: true,
      data: pengaduan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: error.message }
    });
  }
};

export const updatePengaduanController = async (req, res) => {
  try {
    const pengaduan = await updatePengaduan(req.params.id, req.user.id, req.body);
    
    if (!pengaduan) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Pengaduan tidak ditemukan atau tidak bisa diubah' }
      });
    }
    
    res.json({
      success: true,
      message: 'Pengaduan berhasil diupdate',
      data: pengaduan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'UPDATE_FAILED', message: error.message }
    });
  }
};

export const updateStatusController = async (req, res) => {
  try {
    const pengaduan = await updateStatus(req.params.id, req.user.id, req.body);
    
    res.json({
      success: true,
      message: 'Status berhasil diupdate',
      data: pengaduan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'STATUS_UPDATE_FAILED', message: error.message }
    });
  }
};

export const verifyPengaduanController = async (req, res) => {
  try {
    const { unit_id, notes } = req.body;
    const pengaduan = await verifyPengaduan(req.params.id, req.user.id, unit_id, notes);
    
    res.json({
      success: true,
      message: 'Pengaduan berhasil diverifikasi',
      data: pengaduan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'VERIFY_FAILED', message: error.message }
    });
  }
};

export const rejectPengaduanController = async (req, res) => {
  try {
    const { reason } = req.body;
    const pengaduan = await rejectPengaduan(req.params.id, req.user.id, reason);
    
    res.json({
      success: true,
      message: 'Pengaduan ditolak',
      data: pengaduan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'REJECT_FAILED', message: error.message }
    });
  }
};

export const resolvePengaduanController = async (req, res) => {
  try {
    const { resolution_note } = req.body;
    const pengaduan = await resolvePengaduan(req.params.id, req.user.id, resolution_note);
    
    res.json({
      success: true,
      message: 'Pengaduan diselesaikan',
      data: pengaduan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'RESOLVE_FAILED', message: error.message }
    });
  }
};

export const ratePengaduanController = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const pengaduan = await ratePengaduan(req.params.id, req.user.id, rating, feedback);
    
    res.json({
      success: true,
      message: 'Terima kasih atas penilaiannya!',
      data: pengaduan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'RATE_FAILED', message: error.message }
    });
  }
};

export const deletePengaduanController = async (req, res) => {
  try {
    const isAdmin = ['admin', 'pimpinan'].includes(req.user.role);
    const deleted = await deletePengaduan(req.params.id, req.user.id, isAdmin);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Pengaduan tidak ditemukan atau tidak bisa dihapus' }
      });
    }
    
    res.json({
      success: true,
      message: 'Pengaduan berhasil dihapus'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'DELETE_FAILED', message: error.message }
    });
  }
};

export const getStatsController = async (req, res) => {
  try {
    const stats = await getPengaduanStats(req.user);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'STATS_FAILED', message: error.message }
    });
  }
};

export const bulkVerifyController = async (req, res) => {
  try {
    const { pengaduan_ids, unit_id, notes } = req.body;
    
    if (!pengaduan_ids || !Array.isArray(pengaduan_ids) || pengaduan_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Daftar ID pengaduan diperlukan' }
      });
    }
    
    const results = [];
    let successCount = 0;
    
    for (const id of pengaduan_ids) {
      try {
        await verifyPengaduan(id, req.user.id, unit_id, notes);
        results.push({ id, success: true });
        successCount++;
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }
    
    res.json({
      success: true,
      message: `${successCount} dari ${pengaduan_ids.length} pengaduan berhasil diverifikasi`,
      data: { success_count: successCount, failed_count: pengaduan_ids.length - successCount, results }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'BULK_VERIFY_FAILED', message: error.message }
    });
  }
};