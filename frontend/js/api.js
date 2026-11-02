// ==========================================================================
// CampusCare — API Service
// Talks to the Express backend. Vite proxies `/api` -> http://localhost:3000
// ==========================================================================

import { API_BASE } from './config.js';

// Production: set VITE_API_URL (lihat js/config.js). Development pakai proxy Vite.

export class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

class ApiService {
  constructor() {
    this.token = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
    this._refreshing = null; // in-flight refresh promise (dedupe)
  }

  setTokens(accessToken, refreshToken) {
    this.token = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('cc_user');
  }

  isLoggedIn() {
    return !!this.token;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const config = { ...options, headers };

    // Don't stringify FormData (let browser set multipart boundary)
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      config.body = JSON.stringify(options.body);
    }
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    let response;
    try {
      response = await fetch(url, config);
    } catch (err) {
      throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi Anda.', 'NETWORK_ERROR', 0);
    }

    // Token refresh on 401 (once)
    if (response.status === 401 && this.refreshToken && !options._retry) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        config.headers['Authorization'] = `Bearer ${this.token}`;
        config._retry = true;
        response = await fetch(url, config);
      } else {
        this.clearTokens();
        window.dispatchEvent(new CustomEvent('auth:expired'));
        throw new ApiError('Sesi Anda berakhir. Silakan login ulang.', 'SESSION_EXPIRED', 401);
      }
    }

    // Handle empty / non-JSON responses
    const text = await response.text();
    let data = {};
    if (text) {
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
    }

    if (!response.ok) {
      throw new ApiError(
        data.error?.message || data.message || `Request gagal (${response.status})`,
        data.error?.code || 'ERROR',
        response.status
      );
    }
    return data;
  }

  async refreshAccessToken() {
    // Serialize concurrent refresh attempts
    if (this._refreshing) return this._refreshing;
    this._refreshing = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
        if (res.ok) {
          const data = await res.json();
          this.token = data.data.accessToken;
          localStorage.setItem('accessToken', this.token);
          return true;
        }
      } catch (e) {
        console.error('Token refresh failed:', e);
      }
      return false;
    })();
    const ok = await this._refreshing;
    this._refreshing = null;
    return ok;
  }

  // ---- Auth ----
  register(data) { return this.request('/auth/register', { method: 'POST', body: data }); }
  login(nim, password) { return this.request('/auth/login', { method: 'POST', body: { nim, password } }); }
  logout() { return this.request('/auth/logout', { method: 'POST', _retry: true }); }
  getProfile() { return this.request('/auth/me', { _retry: true }); }
  updateProfile(data) { return this.request('/auth/me', { method: 'PUT', body: data }); }
  changePassword(data) { return this.request('/auth/change-password', { method: 'POST', body: data }); }

  // ---- Pengaduan ----
  createPengaduan(data) { return this.request('/pengaduan', { method: 'POST', body: data }); }
  getPengaduanList(params = {}) {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString();
    return this.request(`/pengaduan${q ? '?' + q : ''}`);
  }
  getPengaduanById(id) { return this.request(`/pengaduan/${id}`); }
  updatePengaduan(id, data) { return this.request(`/pengaduan/${id}`, { method: 'PUT', body: data }); }
  deletePengaduan(id) { return this.request(`/pengaduan/${id}`, { method: 'DELETE' }); }
  getPengaduanStats() { return this.request('/pengaduan/stats'); }
  verifyPengaduan(id, data) { return this.request(`/pengaduan/${id}/verify`, { method: 'POST', body: data }); }
  rejectPengaduan(id, reason) { return this.request(`/pengaduan/${id}/reject`, { method: 'POST', body: { reason } }); }
  resolvePengaduan(id, resolutionNote) { return this.request(`/pengaduan/${id}/resolve`, { method: 'POST', body: { resolution_note: resolutionNote } }); }
  ratePengaduan(id, rating, feedback) { return this.request(`/pengaduan/${id}/rate`, { method: 'POST', body: { rating, feedback } }); }
  bulkVerify(ids, unitId, notes) { return this.request('/pengaduan/bulk/verify', { method: 'POST', body: { pengaduan_ids: ids, unit_id: unitId, notes } }); }
  bulkUpdateStatus(ids, status, notes) { return this.request('/pengaduan/bulk/status', { method: 'POST', body: { pengaduan_ids: ids, status, notes } }); }

  // ---- Chat ----
  sendMessage(pengaduanId, message, isInternal = false) { return this.request(`/chat/${pengaduanId}/messages`, { method: 'POST', body: { message, is_internal: isInternal } }); }
  getMessages(pengaduanId, page = 1, limit = 50) { return this.request(`/chat/${pengaduanId}/messages?page=${page}&limit=${limit}`); }
  markMessagesAsRead(pengaduanId) { return this.request(`/chat/${pengaduanId}/messages/read`, { method: 'POST' }); }
  getUnreadCount() { return this.request('/chat/unread-count'); }
  getTemplates(kategoriId = null) { return this.request(`/chat/templates${kategoriId ? '?kategori_id=' + kategoriId : ''}`); }

  // ---- Notifications ----
  getNotifications(params = {}) { const q = new URLSearchParams(params).toString(); return this.request(`/notifications${q ? '?' + q : ''}`); }
  markNotificationAsRead(id) { return this.request(`/notifications/${id}/read`, { method: 'PUT' }); }
  markAllNotificationsAsRead() { return this.request('/notifications/read-all', { method: 'POST' }); }
  getNotificationPreferences() { return this.request('/notifications/preferences'); }
  updateNotificationPreferences(prefs) { return this.request('/notifications/preferences', { method: 'PUT', body: { preferences: prefs } }); }

  // ---- Files ----
  uploadPengaduanFiles(pengaduanId, files) {
    const fd = new FormData();
    fd.append('pengaduan_id', pengaduanId);
    files.forEach((f) => fd.append('files', f));
    return this.request('/files/pengaduan', { method: 'POST', body: fd });
  }
  getAttachments(pengaduanId) { return this.request(`/files/pengaduan/${pengaduanId}`); }
  deleteAttachment(id) { return this.request(`/files/pengaduan/${id}`, { method: 'DELETE' }); }

  // ---- Analytics ----
  getDashboardStats() { return this.request('/analytics/dashboard'); }
  getPerformanceByUnit(params = {}) { const q = new URLSearchParams(params).toString(); return this.request(`/analytics/performance/unit${q ? '?' + q : ''}`); }
  getTrends(params = {}) { const q = new URLSearchParams(params).toString(); return this.request(`/analytics/trends${q ? '?' + q : ''}`); }
  getSLAPerformance(params = {}) { const q = new URLSearchParams(params).toString(); return this.request(`/analytics/sla${q ? '?' + q : ''}`); }
  getRatingAnalysis(params = {}) { const q = new URLSearchParams(params).toString(); return this.request(`/analytics/ratings${q ? '?' + q : ''}`); }

  // ---- Master Data ----
  getFakultas() { return this.request('/master/fakultas'); }
  getProdi(fakultasId = null) { return this.request(`/master/prodi${fakultasId ? '?fakultas_id=' + fakultasId : ''}`); }
  getKategori() { return this.request('/master/kategori'); }
  getUnitPenanganan() { return this.request('/master/unit'); }
  getFAQ(kategoriId = null) { return this.request(`/master/faq${kategoriId ? '?kategori_id=' + kategoriId : ''}`); }
  getSystemInfo() { return this.request('/master/settings/public'); }
}

export const api = new ApiService();
export default api;
