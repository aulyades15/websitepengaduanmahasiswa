import { Router } from 'express';
import { 
  getNotificationsController,
  markAsReadController,
  markAllAsReadController,
  getPreferencesController,
  updatePreferencesController
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../validators/index.js';
import { schemas } from '../validators/index.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotificationsController);
router.post('/read-all', markAllAsReadController);
router.put('/:id/read', markAsReadController);
router.get('/preferences', getPreferencesController);
router.put('/preferences', validate(schemas.notificationPrefs), updatePreferencesController);

export default router;