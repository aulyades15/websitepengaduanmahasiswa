// ==========================================================================
// CampusCare — Public landing page (no login required)
// ==========================================================================
import { icon } from '../icons.js';
import { escapeHtml, statusBadge, timeAgo, emptyState } from '../ui.js';
import { state, applyTheme, toggleTheme } from '../store.js';

const CATEGORIES = [
  { nama: 'Akademik', icon: 'graduationCap', desc: 'Nilai, jadwal, dan kurikulum', tone: 'indigo' },
  { nama: 'Fasilitas', icon: 'building', desc: 'Gedung, ruang, dan sarana', tone: 'violet' },
  { nama: 'Keuangan', icon: 'tag', desc: 'UKT, beasiswa, pembayaran', tone: 'emerald' },
  { nama: 'Dosen', icon: 'book', desc: 'Pengajaran & bimbingan', tone: 'amber' },
  { nama: 'Bullying', icon: 'shield', desc: 'Perundungan & kekerasan', tone: 'rose' },
];

export async function renderLanding() {
  const app = document.getElementById('app');
  applyTheme();

  app.innerHTML = `
    <div class="landing">
      <header class="landing__nav">
        <a class="landing__brand" href="#/">
          <span class="landing__logo">${icon('shieldCheck', { size: 22 })}</span>
          <span class="landing__brand-text">
            <strong>CampusCare</strong>
            <small>UIN Gus Dur</small>
          </span>
        </a>
        <nav class="landing__links" aria-label="Navigasi landing">
          <a href="#landing-stats">Statistik</a>
          <a href="#landing-kategori">Kategori</a>
          <a href="#pengaduan-terbaru">Pengaduan</a>
        </nav>
        <div class="landing__nav-actions">
          <button class="landing__theme" id="landing-theme" aria-label="Ganti tema">
            ${icon(state.theme === 'dark' ? 'sun' : 'moon', { size: 20 })}
          </button>
          <a href="#/login" class="btn btn--primary">Masuk</a>
        </div>
      </header>

      <section class="landing__hero">
        <div class="landing__hero-content">
          <span class="landing__eyebrow">${icon('sparkle', { size: 15 })} Sistem Pengaduan Mahasiswa</span>
          <h1 class="landing__title">Suarakan <span class="landing__gradient">Pengaduanmu</span>,<br>Wujudkan Kampus yang Lebih Baik.</h1>
          <p class="landing__lead">Laporkan masalah akademik, fasilitas, keuangan, hingga perundungan secara aman — bahkan tanpa menampilkan identitas. Pantau setiap prosesnya dari verifikasi hingga selesai.</p>
          <div class="landing__actions">
            <a href="#/login" class="btn btn--primary btn--lg">${icon('send', { size: 18 })} Sampaikan Pengaduan</a>
            <a href="#pengaduan-terbaru" class="btn btn--ghost btn--lg">${icon('eye', { size: 18 })} Lihat Pengaduan</a>
          </div>
          <div class="landing__trust">
            <span class="landing__trust-item">${icon('lock', { size: 16 })} Identitas terlindungi</span>
            <span class="landing__trust-item">${icon('zap', { size: 16 })} SLA terlacak</span>
            <span class="landing__trust-item">${icon('bell', { size: 16 })} Notifikasi real-time</span>
          </div>
        </div>

        <div class="landing__hero-art" aria-hidden="true">
          <div class="landing__glow landing__glow--1"></div>
          <div class="landing__glow landing__glow--2"></div>
          <div class="landing__mock">
            <div class="landing__mock-head">
              <span class="landing__mock-dot"></span>
              <span class="landing__mock-kode">PDU-2026-0042</span>
              <span class="landing__mock-badge">Diproses</span>
            </div>
            <div class="landing__mock-title">WiFi Lab Komputer sering terputus</div>
            <div class="landing__mock-meta">Fasilitas · Unit IT</div>
            <div class="landing__mock-timeline">
              <div class="landing__mock-step is-done"><span></span>Diterima</div>
              <div class="landing__mock-step is-done"><span></span>Diverifikasi</div>
              <div class="landing__mock-step is-active"><span></span>Ditindaklanjuti</div>
              <div class="landing__mock-step"><span></span>Selesai</div>
            </div>
          </div>
        </div>
      </section>

      <section class="landing__section" id="landing-stats">
        <div class="landing__stat-grid">
          <div class="landing__stat">
            <span class="landing__stat-icon">${icon('inbox', { size: 22 })}</span>
            <div><div class="landing__stat-value" id="stat-total">—</div><div class="landing__stat-label">Total Pengaduan</div></div>
          </div>
          <div class="landing__stat">
            <span class="landing__stat-icon landing__stat-icon--amber">${icon('hourglass', { size: 22 })}</span>
            <div><div class="landing__stat-value" id="stat-proses">—</div><div class="landing__stat-label">Sedang Ditangani</div></div>
          </div>
          <div class="landing__stat">
            <span class="landing__stat-icon landing__stat-icon--emerald">${icon('checkCircle', { size: 22 })}</span>
            <div><div class="landing__stat-value" id="stat-selesai">—</div><div class="landing__stat-label">Selesai</div></div>
          </div>
          <div class="landing__stat">
            <span class="landing__stat-icon landing__stat-icon--rose">${icon('star', { size: 22 })}</span>
            <div><div class="landing__stat-value" id="stat-rating">—</div><div class="landing__stat-label">Rating Kepuasan</div></div>
          </div>
        </div>
      </section>

      <section class="landing__section" id="landing-kategori">
        <div class="landing__section-head">
          <span class="landing__section-eyebrow">Kategori</span>
          <h2 class="landing__section-title">Lima area pengaduan utama</h2>
        </div>
        <div class="landing__cat-grid">
          ${CATEGORIES.map((c) => `
            <div class="landing__cat landing__cat--${c.tone}">
              <span class="landing__cat-icon">${icon(c.icon, { size: 22 })}</span>
              <div class="landing__cat-name">${c.nama}</div>
              <div class="landing__cat-desc">${c.desc}</div>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="landing__section" id="pengaduan-terbaru">
        <div class="landing__section-head landing__section-head--row">
          <div>
            <span class="landing__section-eyebrow">Transparansi</span>
            <h2 class="landing__section-title">Pengaduan terbaru</h2>
          </div>
          <div class="landing__search">
            ${icon('search', { size: 18 })}
            <input id="landing-search" placeholder="Cari judul atau kode..." aria-label="Cari pengaduan">
          </div>
        </div>
        <div class="landing__list" id="landing-list">
          ${skeleton()}
        </div>
        <p class="landing__list-note">${icon('lock', { size: 14 })} Identitas pelapor selalu disembunyikan di halaman publik.</p>
      </section>

      <footer class="landing__footer">
        <div class="landing__footer-top">
          <div>
            <div class="landing__footer-brand">
              <span class="landing__logo">${icon('shieldCheck', { size: 20 })}</span>
              <strong>CampusCare</strong>
            </div>
            <p class="landing__footer-text">Sistem Pengaduan Mahasiswa UIN Gus Dur. Transparan, aman, dan ditindaklanjuti.</p>
          </div>
          <a href="#/login" class="btn btn--primary">Masuk / Daftar</a>
        </div>
        <div class="landing__footer-bottom">© ${new Date().getFullYear()} UIN Gus Dur · Sistem Informasi Pengaduan Mahasiswa</div>
      </footer>
    </div>
  `;

  bindEvents();
  loadStats();
  loadRecent('');
}

function skeleton() {
  return `
    <div class="skeleton" style="height:74px;border-radius:14px;margin-bottom:10px"></div>
    <div class="skeleton" style="height:74px;border-radius:14px;margin-bottom:10px"></div>
    <div class="skeleton" style="height:74px;border-radius:14px"></div>
  `;
}

function bindEvents() {
  document.getElementById('landing-theme')?.addEventListener('click', () => {
    toggleTheme();
    const btn = document.getElementById('landing-theme');
    if (btn) btn.innerHTML = icon(state.theme === 'dark' ? 'sun' : 'moon', { size: 20 });
  });

  const search = document.getElementById('landing-search');
  let timer;
  search?.addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => loadRecent(e.target.value), 300);
  });
}

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Gagal memuat data');
  return res.json();
}

async function loadStats() {
  try {
    const res = await fetchJSON('/api/public/stats');
    const s = res.data || {};
    setText('stat-total', s.total_pengaduan ?? 0);
    setText('stat-proses', (s.menunggu || 0) + (s.diproses || 0));
    setText('stat-selesai', s.selesai ?? 0);
    setText('stat-rating', s.avg_rating ? Number(s.avg_rating).toFixed(1) : '—');
  } catch {
    /* keep placeholders if the API is unavailable */
  }
}

async function loadRecent(search = '') {
  const box = document.getElementById('landing-list');
  if (!box) return;
  try {
    const qs = new URLSearchParams({ limit: '8' });
    if (search.trim()) qs.set('search', search.trim());
    const res = await fetchJSON(`/api/public/pengaduan?${qs.toString()}`);
    const items = res.data?.items || [];

    if (!items.length) {
      box.innerHTML = emptyState({
        title: 'Belum ada pengaduan',
        text: search.trim() ? 'Tidak ada hasil untuk pencarian ini.' : 'Jadilah yang pertama menyampaikan pengaduan.',
        iconName: 'inbox',
      });
      return;
    }

    box.innerHTML = items.map((p) => `
      <a class="landing__item" href="#/login" title="Masuk untuk melihat detail">
        <div class="landing__item-top">
          <span class="landing__item-kode">${escapeHtml(p.kode_pengaduan || '')}</span>
          ${statusBadge(p.status)}
        </div>
        <div class="landing__item-title">${escapeHtml(p.judul)}</div>
        <div class="landing__item-meta">
          <span>${icon('tag', { size: 14 })} ${escapeHtml(p.kategori_nama || '-')}</span>
          <span>${icon('user', { size: 14 })} Anonim</span>
          ${p.unit_nama ? `<span>${icon('building', { size: 14 })} ${escapeHtml(p.unit_nama)}</span>` : ''}
          <span class="landing__item-time">${timeAgo(p.created_at)}</span>
        </div>
      </a>
    `).join('');
  } catch {
    box.innerHTML = emptyState({
      title: 'Gagal memuat pengaduan',
      text: 'Silakan coba lagi nanti.',
      iconName: 'alertCircle',
    });
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
