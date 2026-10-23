import { Router } from 'express';
import { 
  sendMessageController,
  getMessagesController,
  markAsReadController,
  getUnreadCountController,
  getTemplatesController,
  createTemplateController,
  updateTemplateController,
  deleteTemplateController
} from '../controllers/chatController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../validators/index.js';
import { schemas } from '../validators/index.js';

const router = Router();

router.use(authenticate);

// Chat messages
router.post('/:id/messages', validate(schemas.sendMessage), sendMessageController);
router.get('/:id/messages', getMessagesController);
router.post('/:id/messages/read', markAsReadController);
router.get('/unread-count', getUnreadCountController);

// Templates (admin only for create/update/delete)
router.get('/templates', getTemplatesController);
router.post('/templates', authorize('admin'), validate(schemas.createTemplate), createTemplateController);
router.put('/templates/:id', authorize('admin'), updateTemplateController);
router.delete('/templates/:id', authorize('admin'), deleteTemplateController);

export default router;