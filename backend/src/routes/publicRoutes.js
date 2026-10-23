// ==========================================================================
// Public routes — no authentication required (landing page).
// ==========================================================================
import { Router } from 'express';
import { getPublicStats, getPublicPengaduan } from '../services/publicService.js';

const router = Router();

router.get('/stats', async (req, res) => {
  try {
    const data = await getPublicStats();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'STATS_FAILED', message: error.message }
    });
  }
});

router.get('/pengaduan', async (req, res) => {
  try {
    const items = await getPublicPengaduan({
      search: req.query.search || '',
      limit: req.query.limit
    });
    res.json({ success: true, data: { items } });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'LIST_FAILED', message: error.message }
    });
  }
});

export default router;
