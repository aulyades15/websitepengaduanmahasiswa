// ==========================================================================
// CampusCare — Notifications page
// ==========================================================================
import api from '../api.js';
import { icon } from '../icons.js';
import { $, $$, escapeHtml, timeAgo, emptyState, toastSuccess, toastError } from '../ui.js';
import { refreshUnreadCount } from '../store.js';
import { navigate } from '../router.js';

const TYPE_STYLE = {
  pengaduan_baru: ['inbox', 'var(--brand-50)', 'var(--brand-600)'],
  status_berubah: ['refresh', 'var(--info-100)', 'var(--info-700)'],
  ada_balasan: ['message', 'var(--violet-50)', 'var(--violet-600)'],
  pengaduan_selesai: ['checkCircle', 'var(--success-100)', 'var(--success-700)'],
  pengaduan_ditolak: ['x', 'var(--danger-100)', 'var(--danger-700)'],
  pengingat_sla: ['alert', 'var(--warning-100)', 'var(--warning-700)'],
};

export async function renderNotifications(root) {
  root.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Notifikasi</h1>
        <p class="page-header__subtitle">Update terbaru mengenai pengaduan Anda.</p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--secondary" id="mark-all">${icon('checkSquare', { size: 18 })} Tandai Semua Dibaca</button>
      </div>
    </div>
    <div class="card">
      <div class="card__body card__body--flush" id="notif-list">
        <div style="padding:var(--space-6)"><div class="skeleton" style="height:72px;margin-bottom:10px"></div><div class="skeleton" style="height:72px;margin-bottom:10px"></div><div class="skeleton" style="height:72px"></div></div>
      </div>
    </div>
  `;

  $('#mark-all').addEventListener('click', async (e) => {
    try {
      await api.markAllNotificationsAsRead();
      toastSuccess('Semua notifikasi ditandai sudah dibaca.');
      refreshUnreadCount();
      loadNotifications();
    } catch (err) { toastError(err.message); }
  });

  loadNotifications();
}

async function loadNotifications() {
  const list = $('#notif-list');
  try {
    const res = await api.getNotifications({ page: 1, limit: 50 });
    const items = res.data?.items || [];
    if (!items.length) {
      list.innerHTML = emptyState({ title: 'Tidak ada notifikasi', text: 'Notifikasi baru akan muncul di sini.', iconName: 'bell' });
      return;
    }
    list.innerHTML = `<div class="notif-list stagger">${items.map(notifItem).join('')}</div>`;

    $$('.notif-item').forEach((it) => {
      it.addEventListener('click', async () => {
        const id = it.dataset.id;
        if (!it.classList.contains('is-unread')) return;
        try { await api.markNotificationAsRead(id); refreshUnreadCount(); } catch {}
        const url = it.dataset.url;
        if (url) navigate('#' + url.replace(/^\/?/, '/'));
      });
    });
  } catch (err) {
    list.innerHTML = emptyState({ title: 'Gagal memuat', text: err.message, iconName: 'alertCircle' });
  }
}

function notifItem(n) {
  const [ic, bg, fg] = TYPE_STYLE[n.type] || TYPE_STYLE.status_berubah;
  const unread = !n.is_read;
  return `<div class="notif-item ${unread ? 'is-unread' : ''}" data-id="${n.id}" data-url="${escapeHtml(n.action_url || '')}">
    <div class="notif-item__icon" style="--icon-bg:${bg};--icon-fg:${fg}">${icon(ic, { size: 21 })}</div>
    <div class="notif-item__body">
      <div class="notif-item__title">${escapeHtml(n.title || 'Notifikasi')}</div>
      <div class="notif-item__msg">${escapeHtml(n.message || '')}</div>
      ${n.kode_pengaduan ? `<div class="notif-item__time">${escapeHtml(n.kode_pengaduan)} · ${timeAgo(n.created_at)}</div>` : `<div class="notif-item__time">${timeAgo(n.created_at)}</div>`}
    </div>
    ${unread ? '<span class="notif-item__unread-dot" aria-label="Belum dibaca"></span>' : ''}
  </div>`;
}
