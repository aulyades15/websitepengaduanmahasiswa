import { 
  sendMessage, 
  getMessages, 
  markAsRead, 
  getUnreadCount, 
  getTemplates, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate 
} from '../services/chatService.js';
import { emitToRoom } from '../config/socket.js';

export const sendMessageController = async (req, res) => {
  try {
    const { message, is_internal } = req.body;
    const senderRole = req.user.role;
    
    const chatMessage = await sendMessage(
      req.params.id, 
      req.user.id, 
      senderRole, 
      message, 
      is_internal || false
    );

    // Real-time broadcast. Internal notes go to a staff-only room.
    const room = chatMessage.is_internal
      ? `pengaduan-${req.params.id}-internal`
      : `pengaduan-${req.params.id}`;
    emitToRoom(room, 'chat:message', {
      ...chatMessage,
      sender_name: req.user.nama
    });
    
    res.status(201).json({
      success: true,
      message: 'Pesan berhasil dikirim',
      data: chatMessage
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'SEND_FAILED', message: error.message }
    });
  }
};

export const getMessagesController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    const result = await getMessages(
      req.params.id, 
      req.user.id, 
      req.user.role, 
      page, 
      limit
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: error.message }
    });
  }
};

export const markAsReadController = async (req, res) => {
  try {
    await markAsRead(req.params.id, req.user.id, req.user.role);
    
    res.json({
      success: true,
      message: 'Pesan ditandai sudah dibaca'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'MARK_READ_FAILED', message: error.message }
    });
  }
};

export const getUnreadCountController = async (req, res) => {
  try {
    const count = await getUnreadCount(req.user.id, req.user.role);
    
    res.json({
      success: true,
      data: { unread_count: count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: error.message }
    });
  }
};

export const getTemplatesController = async (req, res) => {
  try {
    const kategoriId = req.query.kategori_id ? parseInt(req.query.kategori_id) : null;
    const templates = await getTemplates(kategoriId);
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: error.message }
    });
  }
};

export const createTemplateController = async (req, res) => {
  try {
    const template = await createTemplate(req.user.id, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Template berhasil dibuat',
      data: template
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'CREATE_FAILED', message: error.message }
    });
  }
};

export const updateTemplateController = async (req, res) => {
  try {
    const template = await updateTemplate(req.params.id, req.user.id, req.body);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Template tidak ditemukan' }
      });
    }
    
    res.json({
      success: true,
      message: 'Template berhasil diupdate',
      data: template
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'UPDATE_FAILED', message: error.message }
    });
  }
};

export const deleteTemplateController = async (req, res) => {
  try {
    const deleted = await deleteTemplate(req.params.id, req.user.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Template tidak ditemukan' }
      });
    }
    
    res.json({
      success: true,
      message: 'Template berhasil dihapus'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'DELETE_FAILED', message: error.message }
    });
  }
};