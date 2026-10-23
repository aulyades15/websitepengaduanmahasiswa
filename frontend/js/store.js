// ==========================================================================
// CampusCare — Store: shared state, master-data cache, theme, unread count
// This module has NO dependency on app.js (breaks the circular import).
// ==========================================================================
import api from './api.js';
import { icon } from './icons.js';

/* ---------- Global state ---------- */
export const state = {
  user: JSON.parse(localStorage.getItem('cc_user') || 'null'),
  notifUnread: 0,
  theme: localStorage.getItem('cc_theme') || 'light',
};

export const cache = {
  kategori: null,
  unit: null,
};

/* ---------- Session ---------- */
export function setUser(user) {
  state.user = user;
  localStorage.setItem('cc_user', JSON.stringify(user));
}

export function clearUser() {
  state.user = null;
  localStorage.removeItem('cc_user');
}

/* ---------- Master data (cached) ---------- */
export async function loadKategori(force = false) {
  if (cache.kategori && !force) return cache.kategori;
  try {
    const res = await api.getKategori();
    cache.kategori = res.data || [];
  } catch { cache.kategori = []; }
  return cache.kategori;
}

export async function loadUnit(force = false) {
  if (cache.unit && !force) return cache.unit;
  try {
    const res = await api.getUnitPenanganan();
    cache.unit = res.data || [];
  } catch { cache.unit = []; }
  return cache.unit;
}

/* ---------- Theme ---------- */
export function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('cc_theme', state.theme);
  const iconEl = document.getElementById('theme-toggle-icon');
  if (iconEl) iconEl.innerHTML = icon(state.theme === 'dark' ? 'sun' : 'moon', { size: 21 });
}

export function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
}

/* ---------- Unread notifications badge ---------- */
export async function refreshUnreadCount() {
  try {
    const res = await api.getUnreadCount();
    state.notifUnread = res.data?.total || 0;
  } catch { /* ignore */ }
  updateUnreadBadges();
  return state.notifUnread;
}

export function updateUnreadBadges() {
  const dot = document.querySelector('#notif-btn .icon-btn__dot');
  const navBadge = document.querySelector('.nav-item[href="#/notifikasi"] .nav-item__badge');
  if (state.notifUnread > 0) {
    if (dot) dot.textContent = state.notifUnread > 9 ? '9+' : state.notifUnread;
    if (navBadge) navBadge.textContent = state.notifUnread > 99 ? '99+' : state.notifUnread;
  } else {
    dot?.remove();
    navBadge?.remove();
  }
}
