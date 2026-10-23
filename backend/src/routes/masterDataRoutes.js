import { Router } from 'express';
import { 
  getFakultasController,
  getProdiController,
  getKategoriController,
  getUnitPenangananController,
  getKategoriUnitMappingController,
  getFAQController,
  incrementFAQViewController,
  getSettingsController,
  getSettingController,
  updateSettingController,
  getSystemInfoController
} from '../controllers/masterDataController.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Public routes (no auth required)
router.get('/fakultas', getFakultasController);
router.get('/prodi', getProdiController);
router.get('/kategori', getKategoriController);
router.get('/unit', getUnitPenangananController);
router.get('/kategori-unit', getKategoriUnitMappingController);
router.get('/faq', getFAQController);
router.post('/faq/:id/view', incrementFAQViewController);
router.get('/settings/public', getSystemInfoController);

// Protected routes
router.use(authenticate);

router.get('/settings', getSettingsController);
router.get('/settings/:key', getSettingController);
router.put('/settings/:key', authorize('admin'), updateSettingController);

export default router;