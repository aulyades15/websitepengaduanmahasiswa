// ==========================================================================
// CampusCare — App core: layout shell, routing, auth guard, boot.
// Shared state lives in store.js; navigation in router.js. This module
// imports the page modules but nothing imports it back (no cycles).
// ==========================================================================
import api from './api.js';
import { icon } from './icons.js';
import { $, $$, toast, toastError, escapeHtml, avatar, roleLabel } from './ui.js';
import { state, setUser, clearUser, applyTheme, toggleTheme, refreshUnreadCount, loadKategori, loadUnit } from './store.js';
import { navigate, setRouteHandler } from './router.js';

import { renderLogin } from './pages/login.js';
import { renderRegister } from './pages/register.js';
import { renderLanding } from './pages/landing.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderPengaduanList, renderPengaduanNew, renderPengaduanDetail } from './pages/pengaduan.js';
import { renderChat } from './pages/chat.js';
import { renderNotifications } from './pages/notifications.js';
import { renderAnalytics } from './pages/analytics.js';
import { renderProfile } from './pages/profile.js';

/* ---------- Router table ---------- */
const routes = {
  '': { render: renderDashboard, title: 'Dashboard' },
  'dashboard': { render: renderDashboard, title: 'Dashboard' },
  'pengaduan': { render: renderPengaduanList, title: 'Pengaduan' },
  'pengaduan/baru': { render: renderPengaduanNew, title: 'Buat Pengaduan' },
  'chat': { render: renderChat, title: 'Diskusi' },
  'notifikasi': { render: renderNotifications, title: 'Notifikasi' },
  'analitik': { render: renderAnalytics, title: 'Analitik' },
  'profil': { render: renderProfile, title: 'Profil' },
};

function parseHash() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [path, ...rest] = hash.split('/');
  return { path, param: rest.join('/') || null };
}

const AUTH_PATHS = new Set(['login', 'masuk', 'register', 'daftar']);
const isAuthPath = (path) => AUTH_PATHS.has(path);

async function handleRoute() {
  const { path, param } = parseHash();

  // Public area: unauthenticated visitors get the landing page,
  // unless they explicitly open the login/register screen.
  if (!api.isLoggedIn() || !state.user) {
    if (path === 'register' || path === 'daftar') {
      renderRegister();
    } else if (isAuthPath(path)) {
      renderLogin();
    } else {
      renderLanding();
    }
    return;
  }

  // Authenticated users should never stay on the auth screens.
  if (isAuthPath(path)) {
    navigate('#/dashboard');
    return;
  }

  // Match multi-segment static routes first (e.g. 'pengaduan/baru'), then single-segment.
  const combined = param ? `${path}/${param}` : path;
  let route = routes[combined] || routes[path];

  // dynamic detail route: #/pengaduan/:id
  if (path === 'pengaduan' && param && param !== 'baru') {
    route = { render: (root) => renderPengaduanDetail(root, param), title: 'Detail Pengaduan' };
  }

  if (!route) { renderNotFound(); return; }

  renderLayout();
  const main = document.getElementById('main-content');
  main.innerHTML = '<div class="empty-state"><div class="spinner spinner-lg"></div></div>';
  document.title = `${route.title} · CampusCare`;

  try {
    await route.render(main, param);
  } catch (err) {
    console.error(err);
    main.innerHTML = `<div class="empty-state">
      <div class="empty-state__icon" style="background:var(--danger-50);color:var(--danger-600)">${icon('alertCircle', { size: 34 })}</div>
      <div class="empty-state__title">Terjadi kesalahan</div>
      <div class="empty-state__text">${escapeHtml(err.message || 'Gagal memuat halaman')}</div>
      <button class="btn btn--primary" onclick="location.reload()">Muat Ulang</button>
    </div>`;
  }
}

function renderNotFound() {
  const main = document.getElementById('main-content');
  if (!main) return;
  main.innerHTML = `<div class="empty-state">
    <div class="empty-state__icon">${icon('helpCircle', { size: 34 })}</div>
    <div class="empty-state__title">Halaman tidak ditemukan</div>
    <div class="empty-state__text">Halaman yang Anda tuju tidak tersedia.</div>
    <a href="#/dashboard" class="btn btn--primary">Kembali ke Dashboard</a>
  </div>`;
}

/* ---------- Navigation config ---------- */
const NAV_MAIN = [
  { hash: '#/dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['mahasiswa', 'admin', 'pimpinan', 'unit'] },
  { hash: '#/pengaduan/baru', label: 'Buat Pengaduan', icon: 'plusCircle', roles: ['mahasiswa'] },
  { hash: '#/pengaduan', label: 'Pengaduan', icon: 'fileText', roles: ['mahasiswa', 'admin', 'pimpinan', 'unit'] },
  { hash: '#/chat', label: 'Diskusi', icon: 'message', roles: ['mahasiswa', 'admin', 'pimpinan', 'unit'] },
];
const NAV_MONITORING = [
  { hash: '#/notifikasi', label: 'Notifikasi', icon: 'bell', roles: ['mahasiswa', 'admin', 'pimpinan', 'unit'], badge: true },
  { hash: '#/analitik', label: 'Analitik', icon: 'barChart', roles: ['admin', 'pimpinan'] },
];
const NAV_ACCOUNT = [
  { hash: '#/profil', label: 'Profil Saya', icon: 'user', roles: ['mahasiswa', 'admin', 'pimpinan', 'unit'] },
];

function navItemHtml(item) {
  const isActive = location.hash.startsWith(item.hash);
  const showBadge = item.badge && state.notifUnread > 0;
  return `<a href="${item.hash}" class="nav-item ${isActive ? 'is-active' : ''}">
    ${icon(item.icon, { size: 20 })}
    <span class="nav-item__label">${item.label}</span>
    ${showBadge ? `<span class="nav-item__badge">${state.notifUnread > 99 ? '99+' : state.notifUnread}</span>` : ''}
  </a>`;
}

/* ---------- Layout shell ---------- */
function renderLayout() {
  const user = state.user;
  const role = user.role;
  const app = document.getElementById('app');

  const mainNav = NAV_MAIN.filter((n) => n.roles.includes(role));
  const monitorNav = NAV_MONITORING.filter((n) => n.roles.includes(role));
  const accountNav = NAV_ACCOUNT.filter((n) => n.roles.includes(role));

  app.innerHTML = `
    <div class="app">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar__brand">
        <span class="sidebar__logo">${icon('shieldCheck', { size: 22 })}</span>
        <span class="sidebar__brand-text">
          <span class="sidebar__brand-name">CampusCare</span>
          <span class="sidebar__brand-sub">UIN Gus Dur</span>
        </span>
      </div>
      <nav class="sidebar__nav">
        <div class="sidebar__section">
          <div class="sidebar__section-title">Menu Utama</div>
          ${mainNav.map((n) => navItemHtml(n)).join('')}
        </div>
        ${monitorNav.length ? `<div class="sidebar__section">
          <div class="sidebar__section-title">Monitoring</div>
          ${monitorNav.map((n) => navItemHtml(n)).join('')}
        </div>` : ''}
        <div class="sidebar__section">
          <div class="sidebar__section-title">Akun</div>
          ${accountNav.map((n) => navItemHtml(n)).join('')}
          <a class="nav-item" id="logout-btn" role="button" tabindex="0">
            ${icon('logOut', { size: 20 })}
            <span class="nav-item__label">Keluar</span>
          </a>
        </div>
      </nav>
      <div class="sidebar__footer">
        <div class="sidebar__user">
          ${avatar(user.nama, { seed: user.nama })}
          <div class="sidebar__user-info">
            <div class="sidebar__user-name">${escapeHtml(user.nama)}</div>
            <div class="sidebar__user-role">${roleLabel(role)}</div>
          </div>
        </div>
      </div>
    </aside>

    <div class="overlay" id="sidebar-overlay"></div>

    <header class="topbar">
      <button class="topbar__menu-btn" id="menu-toggle" aria-label="Buka menu">${icon('menu', { size: 22 })}</button>
      <div class="topbar__search">
        ${icon('search', { size: 18 })}
        <input type="search" id="global-search" placeholder="Cari pengaduan..." aria-label="Cari pengaduan">
      </div>
      <div class="topbar__actions">
        <button class="icon-btn" id="theme-toggle" aria-label="Ganti tema">
          <span id="theme-toggle-icon">${icon(state.theme === 'dark' ? 'sun' : 'moon', { size: 21 })}</span>
        </button>
        <button class="icon-btn" id="notif-btn" aria-label="Notifikasi">
          ${icon('bell', { size: 21 })}
          ${state.notifUnread > 0 ? `<span class="icon-btn__dot">${state.notifUnread > 9 ? '9+' : state.notifUnread}</span>` : ''}
        </button>
      </div>
    </header>

    <main class="main" id="main-content"></main>
    </div>
  `;

  bindLayoutEvents();
}

function bindLayoutEvents() {
  const sidebar = $('#sidebar');
  const overlay = $('#sidebar-overlay');

  $('#menu-toggle')?.addEventListener('click', () => {
    sidebar.classList.add('is-open');
    overlay.classList.add('is-open');
  });
  overlay?.addEventListener('click', closeSidebar);
  $$('.nav-item[href]').forEach((a) => a.addEventListener('click', closeSidebar));

  $('#theme-toggle')?.addEventListener('click', toggleTheme);
  $('#notif-btn')?.addEventListener('click', () => navigate('#/notifikasi'));

  $('#global-search')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = e.target.value.trim();
      if (q) navigate(`#/pengaduan?search=${encodeURIComponent(q)}`);
    }
  });

  $('#logout-btn')?.addEventListener('click', doLogout);
  $('#logout-btn')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogout(); });
}

export function closeSidebar() {
  $('#sidebar')?.classList.remove('is-open');
  $('#sidebar-overlay')?.classList.remove('is-open');
}

export async function doLogout() {
  try { await api.logout(); } catch { /* ignore */ }
  api.clearTokens();
  clearUser();
  toast('Anda telah keluar.', 'info');
  const alreadyHome = !location.hash || location.hash === '#/' || location.hash === '#';
  location.hash = '#/';
  if (alreadyHome) handleRoute();
}

/* ---------- Auth expiry ---------- */
window.addEventListener('auth:expired', () => {
  clearUser();
  toastError('Sesi Anda berakhir. Silakan login ulang.');
  renderLogin();
});

/* ---------- Boot ---------- */
export async function initApp() {
  applyTheme();
  setRouteHandler(handleRoute);
  window.addEventListener('hashchange', handleRoute);

  if (api.isLoggedIn() && state.user) {
    try {
      const res = await api.getProfile();
      setUser(res.data);
    } catch {
      api.clearTokens();
      clearUser();
    }
  }

  handleRoute();

  if (api.isLoggedIn() && state.user) {
    refreshUnreadCount();
    setInterval(refreshUnreadCount, 30000);
    loadKategori();
    loadUnit();
  }
}
