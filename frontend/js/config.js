// ==========================================================================
// CampusCare — Runtime configuration (deploy-ready)
//
// Development : kosongkan VITE_API_URL → semua request relatif ('/api'),
//               ditangani proxy Vite (lihat vite.config.js).
// Production  : set VITE_API_URL saat build, contoh:
//               VITE_API_URL=https://api-campuscare.up.railway.app
//
// Usage:
//   import { API_BASE, SERVER_URL } from './config.js';
//   API_BASE      → 'https://api.../api' atau '/api'
//   SERVER_URL    → 'https://api...' atau '' (lalu `SERVER_URL + /uploads/..`)
// ==========================================================================

const API_URL = import.meta.env.VITE_API_URL || '';

export const API_BASE = API_URL ? `${API_URL}/api` : '/api';

// Origin backend (tanpa /api) — untuk file statis & WebSocket.
export const SERVER_URL = API_URL || '';

export default { API_BASE, SERVER_URL };
