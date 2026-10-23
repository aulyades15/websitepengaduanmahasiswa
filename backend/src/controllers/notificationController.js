import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  getPreferences, 
  updatePreferences 
} from '../services/notificationService.js';

export const getNotificationsController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const is_read = req.query.is_read === 'true' ? true : req.query.is_read === 'false' ? false : null;
    
    const result = await getNotifications(req.user.id, { page, limit, is_read });
    
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

export const markAsReadController = async (req, res) => {
  try {
    const success = await markAsRead(req.params.id, req.user.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notifikasi tidak ditemukan' }
      });
    }
    
    res.json({
      success: true,
      message: 'Notifikasi ditandai sudah dibaca'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'MARK_READ_FAILED', message: error.message }
    });
  }
};

export const markAllAsReadController = async (req, res) => {
  try {
    await markAllAsRead(req.user.id);
    
    res.json({
      success: true,
      message: 'Semua notifikasi ditandai sudah dibaca'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'MARK_READ_FAILED', message: error.message }
    });
  }
};

export const getPreferencesController = async (req, res) => {
  try {
    const preferences = await getPreferences(req.user.id);
    
    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: error.message }
    });
  }
};

export const updatePreferencesController = async (req, res) => {
  try {
    const { preferences } = req.body;
    const updated = await updatePreferences(req.user.id, preferences);
    
    res.json({
      success: true,
      message: 'Preferensi notifikasi berhasil diupdate',
      data: updated
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'UPDATE_FAILED', message: error.message }
    });
  }
};