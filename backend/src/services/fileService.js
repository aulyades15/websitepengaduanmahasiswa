import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';

const ALLOWED_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
};

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads';

if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Tipe file tidak diizinkan. Hanya: JPG, PNG, GIF, PDF, DOC, DOCX'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

export const saveFileRecord = async (pengaduanId, file) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  const fileType = file.mimetype.startsWith('image/') ? 'image' : 'document';
  
  const result = await query(`
    INSERT INTO lampiran (pengaduan_id, filename, original_filename, file_path, file_size, mime_type, file_type)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [pengaduanId, file.filename, file.originalname, file.path, file.size, file.mimetype, fileType]);
  
  return result.rows[0];
};

export const saveChatAttachment = async (messageId, file) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  const fileType = file.mimetype.startsWith('image/') ? 'image' : 'document';
  
  const result = await query(`
    INSERT INTO chat_attachments (message_id, filename, file_path, file_size, mime_type)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [messageId, file.filename, file.path, file.size, file.mimetype]);
  
  return result.rows[0];
};

export const getAttachments = async (pengaduanId) => {
  const result = await query(
    'SELECT * FROM lampiran WHERE pengaduan_id = $1 ORDER BY uploaded_at',
    [pengaduanId]
  );
  return result.rows;
};

export const getChatAttachments = async (messageId) => {
  const result = await query(
    'SELECT * FROM chat_attachments WHERE message_id = $1',
    [messageId]
  );
  return result.rows;
};

export const deleteFile = async (id) => {
  const result = await query('SELECT file_path FROM lampiran WHERE id = $1', [id]);
  if (result.rows.length > 0) {
    const filePath = result.rows[0].file_path;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  
  const deleteResult = await query('DELETE FROM lampiran WHERE id = $1 RETURNING id', [id]);
  return deleteResult.rows.length > 0;
};

export const deleteChatAttachment = async (id) => {
  const result = await query('SELECT file_path FROM chat_attachments WHERE id = $1', [id]);
  if (result.rows.length > 0) {
    const filePath = result.rows[0].file_path;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  
  const deleteResult = await query('DELETE FROM chat_attachments WHERE id = $1 RETURNING id', [id]);
  return deleteResult.rows.length > 0;
};

export const getFileUrl = (filename) => {
  return `/uploads/${filename}`;
};