import { Router } from 'express';
import { 
  register, 
  login, 
  refresh, 
  logout, 
  getProfile, 
  updateProfileController, 
  changePasswordController 
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../validators/index.js';
import { schemas } from '../validators/index.js';

const router = Router();

router.post('/register', validate(schemas.register), register);
router.post('/login', validate(schemas.login), login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfileController);
router.post('/change-password', authenticate, validate(schemas.changePassword), changePasswordController);

export default router;