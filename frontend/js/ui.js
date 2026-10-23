// ==========================================================================
// CampusCare — UI helpers: toast, modal, formatting, badges, SLA
// ==========================================================================
import { icon } from './icons.js';

/* ---------- DOM helpers ---------- */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ---------- Toast ---------- */
let toastContainer;
function ensureToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('role', 'status');
    toastContainer.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

const TOAST_ICONS = {
  success: 'checkCircle',
  error: 'alertCircle',
  warning: 'alert',
  info: 'info',
};

export function toast(message, type = 'info', title = '') {
  const container = ensureToastContainer();
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  const defaultTitles = { success: 'Berhasil', error: 'Gagal', warning: 'Perhatian', info: 'Informasi' };
  el.innerHTML = `
    <span class="toast__icon">${icon(TOAST_ICONS[type] || 'info', { size: 22 })}</span>
    <div class="toast__content">
      <div class="toast__title">${escapeHtml(title || defaultTitles[type])}</div>
      <div class="toast__message">${escapeHtml(message)}</div>
    </div>
    <button class="toast__close" aria-label="Tutup notifikasi">${icon('x', { size: 15 })}</button>
  `;
  const close = () => {
    if (el.classList.contains('is-leaving')) return;
    el.classList.add('is-leaving');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  };
  el.querySelector('.toast__close').addEventListener('click', close);
  container.appendChild(el);
  setTimeout(close, 4500);
  return el;
}

export const toastSuccess = (m, t) => toast(m, 'success', t);
export const toastError = (m, t) => toast(m, 'error', t);
export const toastWarning = (m, t) => toast(m, 'warning', t);
export const toastInfo = (m, t) => toast(m, 'info', t);

/* ---------- Modal ---------- */
export function openModal(html, { size = '', onMount } = {}) {
  closeModal();
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = 'active-modal';
  backdrop.innerHTML = `<div class="modal ${size ? 'modal--' + size : ''}" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(backdrop);
  document.body.style.overflow = 'hidden';

  // close on backdrop click + Escape
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
  const escHandler = (e) => { if (e.key === 'Escape') closeModal(); };
  document.addEventListener('keydown', escHandler);
  backdrop._escHandler = escHandler;

  requestAnimationFrame(() => backdrop.classList.add('is-open'));

  backdrop.querySelectorAll('[data-close-modal]').forEach((b) => b.addEventListener('click', closeModal));

  // focus first input / the modal
  const focusable = backdrop.querySelector('input, textarea, select, button:not([data-close-modal])');
  if (focusable) setTimeout(() => focusable.focus(), 100);

  if (typeof onMount === 'function') onMount(backdrop.querySelector('.modal'));
  return backdrop;
}

export function closeModal() {
  const backdrop = document.getElementById('active-modal');
  if (!backdrop) return;
  if (backdrop._escHandler) document.removeEventListener('keydown', backdrop._escHandler);
  backdrop.classList.remove('is-open');
  document.body.style.overflow = '';
  setTimeout(() => backdrop.remove(), 220);
}

/* ---------- Loading state for a button ---------- */
export function withButtonLoading(btn, fn) {
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="btn__loader"></span> Memproses...`;
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      if (document.body.contains(btn)) {
        btn.disabled = false;
        btn.innerHTML = original;
      }
    });
}

/* ---------- Formatting ---------- */
const STATUS_LABEL = {
  menunggu: 'Menunggu',
  diproses: 'Diproses',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
  tertunda: 'Tertunda',
};

export function statusLabel(s) { return STATUS_LABEL[s] || s; }

export function statusBadge(status, { pulse = false } = {}) {
  return `<span class="badge badge--${escapeHtml(status)} ${pulse && status === 'diproses' ? 'badge--pulse' : ''}">
    <span class="badge__dot"></span>${escapeHtml(statusLabel(status))}
  </span>`;
}

export function priorityBadge(p) {
  const map = {
    rendah: ['badge--neutral', 'Rendah'],
    normal: ['badge--brand', 'Normal'],
    sedang: ['badge--brand', 'Sedang'],
    tinggi: ['badge--warning', 'Tinggi'],
    kritis: ['badge--urgent', 'Kritis'],
  };
  const [cls, label] = map[p] || map.normal;
  return `<span class="badge ${cls}">${label}</span>`;
}

export function formatDate(iso, { withTime = true } = {}) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d)) return '-';
  const date = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  if (!withTime) return date;
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
}

export function timeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'baru saja';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} hari lalu`;
  return formatDate(iso, { withTime: false });
}

export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export function avatarColor(seed = '') {
  const gradients = ['', 'avatar--accent', 'avatar--warm', 'avatar--green'];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

export function avatar(name, { size = '', seed } = {}) {
  const cls = `avatar ${size ? 'avatar--' + size : ''} ${avatarColor(seed || name)}`;
  return `<span class="${cls}" aria-hidden="true">${escapeHtml(initials(name))}</span>`;
}

/* ---------- SLA helpers ---------- */
export function slaState(deadlineIso, status) {
  if (!deadlineIso || ['selesai', 'ditolak'].includes(status)) return null;
  const deadline = new Date(deadlineIso).getTime();
  const diff = deadline - Date.now();
  if (diff <= 0) return { state: 'danger', label: 'Terlambat', hours: 0, overdue: true };
  const hours = diff / 36e5;
  if (hours < 6) return { state: 'danger', label: `${Math.max(1, Math.floor(hours))}j tersisa`, hours, overdue: false };
  if (hours < 24) return { state: 'warning', label: `${Math.floor(hours)}j tersisa`, hours, overdue: false };
  return { state: 'ok', label: `${Math.floor(hours / 24)}h tersisa`, hours, overdue: false };
}

export function slaBadge(deadlineIso, status) {
  const s = slaState(deadlineIso, status);
  if (!s) return '';
  return `<span class="sla sla--${s.state}">${icon('clock', { size: 13 })}${escapeHtml(s.label)}</span>`;
}

/* ---------- Misc ---------- */
export function emptyState({ title, text, action = '', iconName = 'inbox' }) {
  return `<div class="empty-state">
    <div class="empty-state__icon">${icon(iconName, { size: 34 })}</div>
    <div class="empty-state__title">${escapeHtml(title)}</div>
    <div class="empty-state__text">${escapeHtml(text)}</div>
    ${action}
  </div>`;
}

export function skeletonRows(count = 5, height = '64px') {
  return Array.from({ length: count })
    .map(() => `<div class="skeleton" style="height:${height};margin-bottom:12px"></div>`)
    .join('');
}

export function debounce(fn, delay = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

export function paginate(current, total, maxVisible = 5) {
  if (total <= 1) return [];
  let start = Math.max(1, current - Math.floor(maxVisible / 2));
  let end = Math.min(total, start + maxVisible - 1);
  start = Math.max(1, end - maxVisible + 1);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

export function roleLabel(role) {
  return { mahasiswa: 'Mahasiswa', admin: 'Admin', pimpinan: 'Pimpinan', unit: 'Unit' }[role] || role;
}
