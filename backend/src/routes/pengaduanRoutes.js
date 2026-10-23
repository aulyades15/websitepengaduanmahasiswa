import { Router } from 'express';
import { 
  createPengaduanController,
  getPengaduanListController,
  getPengaduanByIdController,
  updatePengaduanController,
  updateStatusController,
  verifyPengaduanController,
  rejectPengaduanController,
  resolvePengaduanController,
  ratePengaduanController,
  deletePengaduanController,
  getStatsController,
  bulkVerifyController
} from '../controllers/pengaduanController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate, validateQuery } from '../validators/index.js';
import { schemas, querySchemas } from '../validators/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Mahasiswa routes
router.post('/', validate(schemas.createPengaduan), createPengaduanController);
router.get('/', validateQuery(querySchemas.pengaduanList), getPengaduanListController);
router.get('/stats', getStatsController);
router.get('/:id', getPengaduanByIdController);
router.put('/:id', validate(schemas.updatePengaduan), updatePengaduanController);
router.delete('/:id', deletePengaduanController);
router.post('/:id/rate', validate(schemas.ratePengaduan), ratePengaduanController);

// Admin routes
router.put('/:id/status', authorize('admin', 'pimpinan', 'unit'), validate(schemas.updateStatus), updateStatusController);
router.post('/:id/verify', authorize('admin', 'pimpinan'), verifyPengaduanController);
router.post('/:id/reject', authorize('admin', 'pimpinan'), validate(schemas.rejectPengaduan), rejectPengaduanController);
router.post('/:id/resolve', authorize('admin', 'pimpinan', 'unit'), validate(schemas.resolvePengaduan), resolvePengaduanController);
router.post('/bulk/verify', authorize('admin', 'pimpinan'), bulkVerifyController);

export default router;