// ==========================================================================
// CampusCare — Analytics page (admin / pimpinan)
// ==========================================================================
import api from '../api.js';
import { icon } from '../icons.js';
import { $, $$, escapeHtml, emptyState, formatDate } from '../ui.js';
import { state } from '../store.js';

export async function renderAnalytics(root) {
  let data = {};
  try {
    const [dash, units, trends] = await Promise.all([
      api.getDashboardStats().catch(() => ({ data: {} })),
      api.getPerformanceByUnit().catch(() => ({ data: [] })),
      api.getTrends().catch(() => ({ data: [] })),
    ]);
    data = {
      overview: dash.data?.overview || dash.data || {},
      byCategory: dash.data?.by_category || [],
      byUnit: dash.data?.by_unit || [],
      units: units.data || [],
      trends: trends.data || [],
    };
  } catch (err) {
    throw new Error('Gagal memuat analitik: ' + err.message);
  }

  const ov = data.overview;
  const byCategory = Array.isArray(data.byCategory) ? data.byCategory : [];
  const byUnit = Array.isArray(data.byUnit) ? data.byUnit : (Array.isArray(data.units) ? data.units : []);

  const maxCat = Math.max(1, ...byCategory.map((c) => Number(c.count || c.total || 0)));
  const maxUnit = Math.max(1, ...byUnit.map((c) => Number(c.count || c.total || c.total_pengaduan || 0)));

  root.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Analitik & Laporan</h1>
        <p class="page-header__subtitle">Statistik performa penanganan pengaduan kampus.</p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--secondary" id="export-btn">${icon('download', { size: 18 })} Ekspor Ringkasan</button>
      </div>
    </div>

    <div class="stat-grid stagger">
      ${miniStat('Total Pengaduan', ov.total_pengaduan ?? 0, 'fileText', 'var(--brand-gradient)', 'var(--brand-50)', 'var(--brand-600)')}
      ${miniStat('Tingkat Penyelesaian', (ov.completion_rate ?? 0) + '%', 'target', 'linear-gradient(135deg,#10b981,#059669)', 'var(--success-100)', 'var(--success-700)')}
      ${miniStat('Melewati SLA', ov.overdue ?? 0, 'alert', 'linear-gradient(135deg,#f43f5e,#e11d48)', 'var(--danger-100)', 'var(--danger-700)')}
      ${miniStat('Rata-rata Rating', ov.avg_rating != null ? Number(ov.avg_rating).toFixed(1) + '★' : '-', 'star', 'linear-gradient(135deg,#f59e0b,#d97706)', 'var(--warning-100)', 'var(--warning-700)')}
    </div>

    <div class="dashboard-grid">
      <div class="card">
        <div class="card__header"><div><div class="card__title">${icon('tag')} Pengaduan per Kategori</div><div class="card__subtitle">Distribusi masalah berdasarkan kategori</div></div></div>
        <div class="card__body">
          ${byCategory.length ? `<div class="breakdown-list">${byCategory.map((c) => {
            const val = Number(c.count || c.total || 0);
            const pct = Math.round((val / maxCat) * 100);
            return `<div class="breakdown-item">
              <div class="breakdown-item__top"><span class="breakdown-item__label">${c.icon || ''} ${escapeHtml(c.nama || c.kategori_nama || '-')}</span><span class="breakdown-item__value">${val}</span></div>
              <div class="progress-track"><div class="progress-fill" data-w="${pct}%" style="--fill:var(--brand-gradient);width:0%"></div></div>
            </div>`;
          }).join('')}</div>` : emptyState({ title: 'Belum ada data', text: 'Belum ada data kategori untuk ditampilkan.', iconName: 'tag' })}
        </div>
      </div>

      <div class="card">
        <div class="card__header"><div><div class="card__title">${icon('building')} Performa per Unit</div><div class="card__subtitle">Beban kerja tiap unit penanganan</div></div></div>
        <div class="card__body">
          ${byUnit.length ? `<div class="breakdown-list">${byUnit.map((u) => {
            const val = Number(u.count || u.total || u.total_pengaduan || 0);
            const pct = Math.round((val / maxUnit) * 100);
            return `<div class="breakdown-item">
              <div class="breakdown-item__top"><span class="breakdown-item__label">${escapeHtml(u.nama || u.unit_nama || '-')}</span><span class="breakdown-item__value">${val}</span></div>
              <div class="progress-track"><div class="progress-fill" data-w="${pct}%" style="--fill:linear-gradient(135deg,#14b8a6,#0d9488);width:0%"></div></div>
            </div>`;
          }).join('')}</div>` : emptyState({ title: 'Belum ada data', text: 'Belum ada data unit untuk ditampilkan.', iconName: 'building' })}
        </div>
      </div>
    </div>
  `;

  requestAnimationFrame(() => $$('.progress-fill').forEach((el) => { el.style.width = el.dataset.w; }));

  $('#export-btn').addEventListener('click', () => exportSummary(ov, byCategory, byUnit));
}

function miniStat(label, value, iconName, accent, bg, fg) {
  return `<div class="stat-card" style="--card-accent:${accent};--icon-bg:${bg};--icon-fg:${fg}">
    <div class="stat-card__top"><span class="stat-card__icon">${icon(iconName, { size: 24 })}</span></div>
    <div class="stat-card__value">${value}</div>
    <div class="stat-card__label">${label}</div>
  </div>`;
}

function exportSummary(ov, byCategory, byUnit) {
  const lines = [
    'LAPORAN RINGKASAN PENGADUAN — CampusCare UIN Gus Dur',
    `Tanggal: ${formatDate(new Date().toISOString())}`,
    '',
    '=== RINGKASAN ===',
    `Total Pengaduan : ${ov.total_pengaduan ?? 0}`,
    `Menunggu        : ${ov.menunggu ?? 0}`,
    `Diproses        : ${ov.diproses ?? 0}`,
    `Selesai         : ${ov.selesai ?? 0}`,
    `Ditolak         : ${ov.ditolak ?? 0}`,
    `Urgent Aktif    : ${ov.urgent_aktif ?? 0}`,
    `Melewati SLA    : ${ov.overdue ?? 0}`,
    `Tingkat Selesai : ${ov.completion_rate ?? 0}%`,
    ov.avg_rating != null ? `Rata-rata Rating: ${Number(ov.avg_rating).toFixed(2)} / 5` : '',
    '',
    '=== PER KATEGORI ===',
    ...byCategory.map((c) => `${(c.nama || c.kategori_nama || '-').padEnd(24)}: ${c.count || c.total || 0}`),
    '',
    '=== PER UNIT ===',
    ...byUnit.map((u) => `${(u.nama || u.unit_nama || '-').padEnd(24)}: ${u.count || u.total || u.total_pengaduan || 0}`),
  ].filter(Boolean);

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `laporan-pengaduan-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}
