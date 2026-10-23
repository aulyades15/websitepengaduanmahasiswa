import { 
  saveFileRecord, 
  saveChatAttachment, 
  getAttachments, 
  getChatAttachments, 
  deleteFile, 
  deleteChatAttachment 
} from '../services/fileService.js';
import { upload } from '../services/fileService.js';

export const uploadPengaduanFiles = upload.array('files', 5);

export const uploadPengaduanFilesController = async (req, res) => {
  try {
    const { pengaduan_id } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILES', message: 'Tidak ada file yang diupload' }
      });
    }
    
    if (!pengaduan_id) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_ID', message: 'ID pengaduan diperlukan' }
      });
    }
    
    // Verify pengaduan exists and user owns it
    // This would need a service call - for now just save
    const savedFiles = [];
    for (const file of req.files) {
      const saved = await saveFileRecord(pengaduan_id, file);
      savedFiles.push(saved);
    }
    
    res.status(201).json({
      success: true,
      message: `${savedFiles.length} file berhasil diupload`,
      data: savedFiles
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'UPLOAD_FAILED', message: error.message }
    });
  }
};

export const getAttachmentsController = async (req, res) => {
  try {
    const attachments = await getAttachments(req.params.id);
    
    res.json({
      success: true,
      data: attachments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: error.message }
    });
  }
};

export const deleteAttachmentController = async (req, res) => {
  try {
    const deleted = await deleteFile(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'File tidak ditemukan' }
      });
    }
    
    res.json({
      success: true,
      message: 'File berhasil dihapus'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'DELETE_FAILED', message: error.message }
    });
  }
};

export const uploadChatAttachment = upload.single('attachment');

export const uploadChatAttachmentController = async (req, res) => {
  try {
    const { message_id } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'Tidak ada file yang diupload' }
      });
    }
    
    if (!message_id) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_ID', message: 'ID pesan diperlukan' }
      });
    }
    
    const saved = await saveChatAttachment(message_id, req.file);
    
    res.status(201).json({
      success: true,
      message: 'File berhasil diupload',
      data: saved
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'UPLOAD_FAILED', message: error.message }
    });
  }
};