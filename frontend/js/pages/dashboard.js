// ==========================================================================
// CampusCare — Dashboard page
// ==========================================================================
import api from '../api.js';
import { icon } from '../icons.js';
import { $, $$, escapeHtml, statusBadge, slaBadge, timeAgo, formatDate, emptyState, skeletonRows, avatar } from '../ui.js';
import { state } from '../store.js';
import { navigate } from '../router.js';

const STATUS_COLORS = {
  menunggu: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
  diproses: 'linear-gradient(135deg,#f59e0b,#d97706)',
  selesai: 'linear-gradient(135deg,#10b981,#059669)',
  ditolak: 'linear-gradient(135deg,#f43f5e,#e11d48)',
  tertunda: 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
};
const STATUS_ICON_BG = {
  menunggu: ['var(--info-100)', 'var(--info-700)'],
  diproses: ['var(--warning-100)', 'var(--warning-700)'],
  selesai: ['var(--success-100)', 'var(--success-700)'],
  ditolak: ['var(--danger-100)', 'var(--danger-700)'],
  tertunda: ['var(--violet-50)', 'var(--violet-600)'],
};

function statCard({ label, value, iconName, accent, iconBg, iconFg, trend }) {
  return `<div class="stat-card" style="--card-accent:${accent};--icon-bg:${iconBg};--icon-fg:${iconFg}">
    <div class="stat-card__top">
      <span class="stat-card__icon">${icon(iconName, { size: 24 })}</span>
      ${trend ? `<span class="stat-card__trend stat-card__trend--${trend.dir}">${icon(trend.dir === 'up' ? 'trendingUp' : 'trendingDown', { size: 13 })}${trend.text}</span>` : ''}
    </div>
    <div class="stat-card__value">${value}</div>
    <div class="stat-card__label">${label}</div>
  </div>`;
}

export async function renderDashboard(root) {
  const role = state.user.role;

  // Load data (role-aware)
  let stats, list;
  try {
    if (role === 'mahasiswa') {
      [stats, list] = await Promise.all([
        api.getPengaduanStats(),
        api.getPengaduanList({ limit: 5, sort: 'created_at', order: 'desc' }),
      ]);
      stats = stats.data;
    } else {
      [stats, list] = await Promise.all([
        api.getDashboardStats(),
        api.getPengaduanList({ limit: 6, sort: 'created_at', order: 'desc' }),
      ]);
      stats = stats.data?.overview || stats.data;
    }
  } catch (err) {
    throw new Error('Gagal memuat dashboard: ' + err.message);
  }

  const items = list.data?.items || [];

  root.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Halo, ${escapeHtml(state.user.nama.split(' ')[0])} 👋</h1>
        <p class="page-header__subtitle">Berikut ringkasan aktivitas pengaduan Anda.</p>
      </div>
      <div class="page-header__actions">
        ${role === 'mahasiswa' ? `<a href="#/pengaduan/baru" class="btn btn--primary">${icon('plus', { size: 18 })} Buat Pengaduan</a>` : ''}
        <a href="#/pengaduan" class="btn btn--secondary">${icon('fileText', { size: 18 })} Lihat Semua</a>
      </div>
    </div>

    <div class="stat-grid stagger">
      ${statCard({ label: 'Total Pengaduan', value: stats.total_pengaduan ?? stats.total ?? 0, iconName: 'fileText', accent: 'var(--brand-gradient)', iconBg: 'var(--brand-50)', iconFg: 'var(--brand-600)' })}
      ${statCard({ label: 'Menunggu', value: stats.menunggu ?? 0, iconName: 'clock', accent: STATUS_COLORS.menunggu, iconBg: STATUS_ICON_BG.menunggu[0], iconFg: STATUS_ICON_BG.menunggu[1] })}
      ${statCard({ label: 'Diproses', value: stats.diproses ?? 0, iconName: 'activity', accent: STATUS_COLORS.diproses, iconBg: STATUS_ICON_BG.diproses[0], iconFg: STATUS_ICON_BG.diproses[1] })}
      ${statCard({ label: 'Selesai', value: stats.selesai ?? 0, iconName: 'checkCircle', accent: STATUS_COLORS.selesai, iconBg: STATUS_ICON_BG.selesai[0], iconFg: STATUS_ICON_BG.selesai[1] })}
      ${role !== 'mahasiswa' ? statCard({ label: 'Terlambat (SLA)', value: stats.overdue ?? 0, iconName: 'alert', accent: STATUS_COLORS.ditolak, iconBg: STATUS_ICON_BG.ditolak[0], iconFg: STATUS_ICON_BG.ditolak[1] }) : ''}
      ${role !== 'mahasiswa' && stats.completion_rate !== undefined ? statCard({ label: 'Tingkat Selesai', value: (stats.completion_rate ?? 0) + '%', iconName: 'target', accent: 'var(--accent-600)', iconBg: 'var(--success-100)', iconFg: 'var(--success-700)', trend: (stats.completion_rate >= 50 ? { dir: 'up', text: 'Baik' } : { dir: 'down', text: 'Perlu Action' }) }) : ''}
    </div>

    <div class="dashboard-grid">
      <div>
        <div class="card" style="margin-bottom:var(--space-6)">
          <div class="card__header">
            <div>
              <div class="card__title">${icon('barChart')} Distribusi Status</div>
              <div class="card__subtitle">Komposisi pengaduan berdasarkan status</div>
            </div>
          </div>
          <div class="card__body">
            ${renderBreakdown(stats)}
          </div>
        </div>

        <div class="card">
          <div class="card__header">
            <div>
              <div class="card__title">${icon('fileText')} Pengaduan Terbaru</div>
              <div class="card__subtitle">5 pengaduan terakhir</div>
            </div>
            <a href="#/pengaduan" class="btn btn--ghost btn--sm">Lihat Semua ${icon('chevronRight', { size: 15 })}</a>
          </div>
          <div class="card__body card__body--flush">
            ${items.length ? `<div class="table-wrap"><table class="table">
              <thead><tr><th>Kode</th><th>Judul</th><th>Status</th><th>SLA</th><th>Waktu</th></tr></thead>
              <tbody>${items.map((p) => pengaduanRow(p)).join('')}</tbody>
            </table></div>` : emptyState({ title: 'Belum ada pengaduan', text: 'Pengaduan yang Anda buat akan muncul di sini.', iconName: 'inbox' })}
          </div>
        </div>
      </div>

      <div>
        <div class="card" style="margin-bottom:var(--space-6)">
          <div class="card__header">
            <div class="card__title">${icon('pieChart')} Ringkasan Cepat</div>
          </div>
          <div class="card__body">
            <div class="breakdown-list">
              ${quickSummary(stats, role)}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card__header"><div class="card__title">${icon('lightbulb')} Tips</div></div>
          <div class="card__body">
            ${role === 'mahasiswa' ? tipsMahasiswa() : tipsAdmin()}
          </div>
        </div>
      </div>
    </div>
  `;

  // animate bars
  requestAnimationFrame(() => {
    $$('.progress-fill').forEach((el) => { el.style.width = el.dataset.w; });
    $$('.chart-bars__bar').forEach((el) => { el.style.height = el.dataset.h; });
  });

  // row click -> detail
  $$('.table tbody tr[data-id]').forEach((tr) => {
    tr.style.cursor = 'pointer';
    tr.addEventListener('click', () => navigate(`#/pengaduan/${tr.dataset.id}`));
  });
}

function renderBreakdown(s) {
  const statuses = ['menunggu', 'diproses', 'selesai', 'ditolak'];
  const max = Math.max(1, ...statuses.map((s2) => Number(s[s2] || 0)));
  return `<div class="breakdown-list">
    ${statuses.map((st) => {
      const val = Number(s[st] || 0);
      const pct = Math.round((val / max) * 100);
      const [bg, fg] = STATUS_ICON_BG[st];
      return `<div class="breakdown-item">
        <div class="breakdown-item__top">
          <span class="breakdown-item__label"><span style="width:10px;height:10px;border-radius:50%;background:${STATUS_COLORS[st]};display:inline-block"></span>${st.charAt(0).toUpperCase() + st.slice(1)}</span>
          <span class="breakdown-item__value">${val}</span>
        </div>
        <div class="progress-track"><div class="progress-fill" data-w="${pct}%" style="--fill:${STATUS_COLORS[st]};width:0%"></div></div>
      </div>`;
    }).join('')}
  </div>`;
}

function quickSummary(s, role) {
  const total = Number(s.total_pengaduan ?? s.total ?? 0);
  const urgent = Number(s.urgent ?? s.urgent_aktif ?? 0);
  const overdue = Number(s.overdue ?? 0);
  const rows = [
    { label: 'Total', value: total, icon: 'layers', color: 'var(--brand-600)' },
    { label: role === 'mahasiswa' ? 'Urgent' : 'Urgent Aktif', value: urgent, icon: 'zap', color: 'var(--danger-600)' },
    { label: 'Melewati SLA', value: overdue, icon: 'alert', color: 'var(--warning-600)' },
  ];
  if (s.avg_rating != null) rows.push({ label: 'Rata-rata Rating', value: Number(s.avg_rating).toFixed(1) + '★', icon: 'star', color: 'var(--warning-500)' });
  return rows.map((r) => `<div class="info-list__item" style="border:none;padding:0">
    <span class="info-list__label" style="display:flex;align-items:center;gap:8px;color:var(--text-secondary)"><span style="color:${r.color}">${icon(r.icon, { size: 18 })}</span>${r.label}</span>
    <span class="info-list__value" style="font-size:var(--text-xl);color:${r.color}">${r.value}</span>
  </div>`).join('');
}

function pengaduanRow(p) {
  const deadline = p.sla_deadline;
  return `<tr data-id="${p.id}">
    <td><span class="table__code">${escapeHtml(p.kode_pengaduan || '#' + p.id)}</span></td>
    <td>
      <div class="table__cell-title">${escapeHtml(p.judul)}</div>
      <div class="table__cell-sub">${escapeHtml(p.kategori_nama || '')} ${p.lokasi ? '· ' + escapeHtml(p.lokasi) : ''}</div>
    </td>
    <td>${statusBadge(p.status)}</td>
    <td>${slaBadge(deadline, p.status) || '<span class="text-muted">-</span>'}</td>
    <td class="text-sm text-muted">${timeAgo(p.created_at)}</td>
  </tr>`;
}

function tipsMahasiswa() {
  const tips = [
    ['Judul yang jelas', 'Tulis judul singkat & spesifik agar mudah ditindaklanjuti.'],
    ['Lampirkan bukti', 'Foto atau dokumen mempercepat verifikasi.'],
    ['Pantau status', 'Aktifkan notifikasi untuk update real-time.'],
  ];
  return tips.map(([t, d]) => `<div class="feed-item">
    <span class="feed-item__icon" style="--icon-bg:var(--brand-50);--icon-fg:var(--brand-600)">${icon('checkCircle', { size: 19 })}</span>
    <div class="feed-item__body"><div class="feed-item__title">${t}</div><div class="feed-item__meta">${d}</div></div>
  </div>`).join('');
}

function tipsAdmin() {
  const tips = [
    ['SLA Monitoring', 'Periksa pengaduan yang mendekati tenggat setiap pagi.'],
    ['Balas cepat', 'Pesan pertama menaikkan kepuasan pelapor.'],
    ['Bulk action', 'Verifikasi banyak pengaduan sekaligus untuk efisiensi.'],
  ];
  return tips.map(([t, d]) => `<div class="feed-item">
    <span class="feed-item__icon" style="--icon-bg:var(--warning-100);--icon-fg:var(--warning-700)">${icon('zap', { size: 19 })}</span>
    <div class="feed-item__body"><div class="feed-item__title">${t}</div><div class="feed-item__meta">${d}</div></div>
  </div>`).join('');
}
