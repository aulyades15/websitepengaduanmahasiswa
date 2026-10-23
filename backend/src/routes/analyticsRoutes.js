import { Router } from 'express';
import { 
  getDashboardStatsController,
  getPerformanceByUnitController,
  getTrendAnalysisController,
  getSLAPerformanceController,
  getRatingAnalysisController,
  exportPengaduanController
} from '../controllers/analyticsController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateQuery } from '../validators/index.js';
import { querySchemas } from '../validators/index.js';

const router = Router();

router.use(authenticate);

// Dashboard stats (all authenticated users)
router.get('/dashboard', getDashboardStatsController);

// Admin & Pimpinan only
router.get('/performance/unit', authorize('admin', 'pimpinan'), validateQuery(querySchemas.analytics), getPerformanceByUnitController);
router.get('/trends', authorize('admin', 'pimpinan'), getTrendAnalysisController);
router.get('/sla', authorize('admin', 'pimpinan'), validateQuery(querySchemas.analytics), getSLAPerformanceController);
router.get('/ratings', authorize('admin', 'pimpinan'), validateQuery(querySchemas.analytics), getRatingAnalysisController);
router.get('/export', authorize('admin', 'pimpinan'), exportPengaduanController);

export default router;