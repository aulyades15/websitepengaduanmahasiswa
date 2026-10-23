import { 
  getFakultas, 
  getProdi, 
  getKategori, 
  getUnitPenanganan, 
  getKategoriUnitMapping, 
  getFAQ, 
  incrementFAQView, 
  getSettings, 
  getSetting, 
  updateSetting, 
  getSystemInfo 
} from '../services/masterDataService.js';

export const getFakultasController = async (req, res) => {
  try {
    const fakultas = await getFakultas();
    res.json({ success: true, data: fakultas });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: error.message } });
  }
};

export const getProdiController = async (req, res) => {
  try {
    const fakultasId = req.query.fakultas_id ? parseInt(req.query.fakultas_id) : null;
    const prodi = await getProdi(fakultasId);
    res.json({ success: true, data: prodi });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: error.message } });
  }
};

export const getKategoriController = async (req, res) => {
  try {
    const kategori = await getKategori();
    res.json({ success: true, data: kategori });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: error.message } });
  }
};

export const getUnitPenangananController = async (req, res) => {
  try {
    const units = await getUnitPenanganan();
    res.json({ success: true, data: units });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: error.message } });
  }
};

export const getKategoriUnitMappingController = async (req, res) => {
  try {
    const mapping = await getKategoriUnitMapping();
    res.json({ success: true, data: mapping });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: error.message } });
  }
};

export const getFAQController = async (req, res) => {
  try {
    const kategoriId = req.query.kategori_id ? parseInt(req.query.kategori_id) : null;
    const faq = await getFAQ(kategoriId);
    res.json({ success: true, data: faq });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: error.message } });
  }
};

export const incrementFAQViewController = async (req, res) => {
  try {
    await incrementFAQView(req.params.id);
    res.json({ success: true, message: 'View count updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'UPDATE_FAILED', message: error.message } });
  }
};

export const getSettingsController = async (req, res) => {
  try {
    const publicOnly = req.user?.role !== 'admin';
    const settings = await getSettings(publicOnly);
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: error.message } });
  }
};

export const getSettingController = async (req, res) => {
  try {
    const setting = await getSetting(req.params.key);
    if (!setting) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Setting tidak ditemukan' } });
    }
    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: error.message } });
  }
};

export const updateSettingController = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Hanya admin' } });
    }
    const { value } = req.body;
    const setting = await updateSetting(req.params.key, value, req.user.id);
    res.json({ success: true, message: 'Setting berhasil diupdate', data: setting });
  } catch (error) {
    res.status(400).json({ success: false, error: { code: 'UPDATE_FAILED', message: error.message } });
  }
};

export const getSystemInfoController = async (req, res) => {
  try {
    const info = await getSystemInfo();
    res.json({ success: true, data: info });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: error.message } });
  }
};