import { Router } from 'express';
import { 
  uploadPengaduanFiles,
  uploadPengaduanFilesController,
  getAttachmentsController,
  deleteAttachmentController,
  uploadChatAttachment,
  uploadChatAttachmentController
} from '../controllers/fileController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Pengaduan attachments
router.post('/pengaduan', uploadPengaduanFiles, uploadPengaduanFilesController);
router.get('/pengaduan/:id', getAttachmentsController);
router.delete('/pengaduan/:id', deleteAttachmentController);

// Chat attachments
router.post('/chat', uploadChatAttachment, uploadChatAttachmentController);

export default router;